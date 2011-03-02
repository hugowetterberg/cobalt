(function($) {
  $(document).ready(function(){
    var match_count = 0, match_page_size=5, match_offset = 0,
        cobalt_visible = false, cobalt_out_visible = false,
        matches = [], match_idx = 0, handler_idx = 0,
        current_text, current_action_text='', handler, item, actions, match_count=0,
        plugins = {}, plugin_names=[], catalogs = {}, global_handlers = [], handlers = {},
        update_queue = [], required_updates = [];

    var log_error = function(message, err) {
       if (typeof(window.console) != 'undefined') {
         console.error(message);
         if(err) {
          console.log(err);
         }
       }
    };

    var log_msg = function(message) {
       if (typeof(window.console) != 'undefined') {
         console.log(message);
       }
    };

    var db = null;
    // Initialize database
    if (typeof(google) != 'undefined' && typeof(google.gears) != 'undefined') {
      try {
        var gdb = google.gears.factory.create('beta.database');
        gdb.open('cobalt');
        var db = gears_db_html5_wrapper(gdb);
      }
      catch (err) {
        log_msg(Drupal.t('Failed to open database using the Google Gears api'), err);
      }
    }

    if (!db && typeof(openDatabase)=='function') {
      try {
        var db = openDatabase('cobalt', '1.0', 'Cobalt Database', 204800);
      }
      catch (err) {
        log_msg(Drupal.t('Failed to open database using the HTML5-api'));
      }
    }

    if (!db) {
      log_error(Drupal.t('Could not open a client-side database. Cobalt requires a browser that implements the HTML5 database api or had Google Gears installed'));
      return;
    }

    var nullDataHandler = function(transaction, results) { };

    var current_state = function() {
      if (typeof(Drupal.settings.cobalt) != 'undefined' &&
          typeof(Drupal.settings.cobalt.state) != 'undefined') {
        return Drupal.settings.cobalt.state;
      }
      else {
        return 0;
      }
    };

    // Initialize Cobalt
    var cobalt = {
      'dbErrorHandler': function(transaction, error)
      {
        $(document).trigger('cobalt-db-error');
        if (window.console) {
          console.error(error.message+' (Code: '+error.code+')');
        }
        return false;
      },
      'registerPlugin': function(name, plugin) {
        plugin_names.push(name);
        plugins[name] = plugin;

        if(typeof(plugin['catalogs'])!='undefined') {
          for(var c_name in plugin.catalogs) {
            catalogs[c_name] = plugin.catalogs[c_name];
          }
        }

        if(typeof(plugin['handlers'])!='undefined') {
          var h_len = plugin.handlers.length;
          for(var i=0; i<h_len; i++) {
            register_handler(plugin.handlers[i]);
          }
        }
      },
      'catalogUpdated': function(catalog, updated) {
        if (typeof(updated)=='undefined') {
          updated = new Date().getTime();
        }
        db.transaction(function (transaction) {
          transaction.executeSql("UPDATE catalogs SET updated=?, state=? WHERE name = ?;", [ updated, Drupal.settings.cobalt.state, catalog ], nullDataHandler,cobalt.dbErrorHandler);
        });
      },
      'emptyCatalog': function(name) {
        db.transaction(function (transaction) {
          transaction.executeSql("DELETE FROM entries WHERE catalog=?;", [ name ], nullDataHandler,cobalt.dbErrorHandler);
        });
      },
      'addKeyBinding': function(binding, catalog, id, handler, active, state) {
        if (typeof(state)=='undefined') {
          state = current_state();
        }
        if (typeof(active)=='undefined') {
          active = 1;
        }
        bind_key(binding, catalog, id, handler);
        db.transaction(function (transaction) {
          transaction.executeSql("INSERT OR REPLACE INTO key_bindings(binding, catalog, id, handler, active, state) VALUES(?,?,?,?,?,?);", [ binding, catalog, id, handler, active, state ], nullDataHandler,cobalt.dbErrorHandler);
        });
      },
      'loadEntry': function(catalog, id, callback) {
        var state = current_state();
        db.transaction(function (transaction) {
          transaction.executeSql("SELECT * FROM entries WHERE catalog=? AND id=? AND state=?;", [ catalog, id, state ], function(transaction, results) {
            var item = null;
            if (results.rows.length) {
              item = results.rows.item(0);
              item.information = $.evalJSON(item.data);
            }
            callback(item);
          },cobalt.dbErrorHandler);
        });
      },
      'deleteEntry': function(catalog, id) {
        db.transaction(function (transaction) {
          transaction.executeSql("DELETE FROM entries WHERE catalog=? AND id=?;", [ catalog, id ], nullDataHandler,cobalt.dbErrorHandler);
        });
      },
      'addTemporaryEntry': function(id, name, information, classname) {
        cobalt.addEntry({id:id, name:name, information:information, catalog:'*temporary*', classname:classname, active:1, state:current_state()});
      },
      'addEntry': function(data) {
        if (typeof(data.state)=='undefined') {
          data.state = current_state();
        }
        if (typeof(data.active)=='undefined') {
          data.active = 1;
        }
        if (typeof(data.extra)=='undefined') {
          data.extra = '';
        }
        db.transaction(function (transaction) {
          transaction.executeSql("INSERT OR REPLACE INTO entries(id, name, extra, data, catalog, data_class, state, active) VALUES(?,?,?,?,?,?,?,?);", [data['id'], data['name'], data.extra, $.toJSON(data.information), data.catalog, data.classname, data.state, data.active], nullDataHandler,cobalt.dbErrorHandler);
        });
      },
      'actionCandidates': function(item, callback) {
        action_candidates(item, callback);
      },
      'showHtml': function(html) {
        if (typeof(html) == 'string') {
          cobalt_output.html(html);
        }
        else {
          cobalt_output.empty().append(html);
        }

        if (!cobalt_out_visible) {
          toggle_output();
        }
      }
    };

    if (typeof(Drupal.settings.cobalt) != 'undefined' && typeof(Drupal.settings.cobalt.update) != 'undefined') {
     cobalt.updateVersion = function(transaction, name, version) {
        transaction.executeSql('UPDATE versions SET version=? WHERE name=?', [version, name], nullDataHandler,cobalt.dbErrorHandler);
      };
      $(document).trigger('cobalt-update', [cobalt, db, Drupal.settings.cobalt.update]);
      return;
    }

    var register_handler_use = function(handler, item, transaction) {
      transaction.executeSql("INSERT OR IGNORE INTO handler_usage_data(catalog, id, handler, weight) VALUES(?,?,?,?)",
        [item.catalog, item.id, handler.id, 0], nullDataHandler, cobalt.dbErrorHandler);
      transaction.executeSql("UPDATE handler_usage_data SET weight=weight+1 WHERE catalog=? AND id=? AND handler=?",
        [item.catalog, item.id, handler.id], nullDataHandler, cobalt.dbErrorHandler);
      if (item.id) {
        handler.weight++;
        register_handler_use(handler, {id:0, catalog: ''}, transaction);
      }
    };

    var register_use = function(text, item, handler) {
      db.transaction(function (transaction) {
        register_handler_use(handler, item, transaction);
        transaction.executeSql("UPDATE usage_data SET last=null WHERE last = 1", [], nullDataHandler, cobalt.dbErrorHandler);
        if (item.weight == null) {
          // IGNORE in the rare event a handler that don't refresh the page
          // (e.g "show") is used multiple times and the weight initially was null.
          transaction.executeSql("INSERT OR IGNORE INTO usage_data(catalog, id, weight, abbreviation, last) VALUES(?,?,?,?,?)",
            [item.catalog, item.id, 1, text, 1], nullDataHandler,cobalt.dbErrorHandler);
        }
        else {
          transaction.executeSql("UPDATE usage_data SET weight=weight+1, abbreviation=?, last=1 WHERE catalog=? AND id=?",
            [text, item.catalog, item.id], nullDataHandler,cobalt.dbErrorHandler);
        }
      });
    };

    var register_handler = function(handler) {
      if (typeof(handler['data_class'])=='undefined') {
        handler['data_class'] = null;
      }

      handler.weight = 0;
      handler.context_weight = 0;

      // Get the weight of the handler
      db.transaction(function (transaction) {
        transaction.executeSql("SELECT weight FROM handler_usage_data WHERE catalog='' AND handler=?",
          [handler.id], function(transaction, results) {
            if (results.rows.length) {
              handler.weight = results.rows.item(0).weight;
            }
        });
      });

      if (!handler['data_class']) {
        global_handlers.push(handler);
      }
      else {
        if (!handlers[handler.data_class]) {
          handlers[handler.data_class] = [];
        }
        handlers[handler.data_class].push(handler);
      }
    };

    $(document).trigger('cobalt-load', cobalt);

    cobalt.registerPlugin('cobalt', {
      'version': 1,
      'handlers': [
        {
          'id': 'cobalt_show',
          'name': Drupal.t('Show'),
          'handler': function(text, item) {
            cobalt.showHtml('<h2>' + item.name + '</h2>' +
              Drupal.t('text') + ': <i>' + text + '</i><br/>' +
              Drupal.t('id') + ': ' + item.id + '<br/>' +
              Drupal.t('catalog') + ': ' + item.catalog + '<br/>' +
              Drupal.t('class') + ': ' + item.data_class + '<br/>' +
              Drupal.t('data') + ': ' + item.data + '<br/>' +
              Drupal.t('weight') + ': ' + item.weight);
          }
        },
        {
          'id': 'cobalt_abbrev',
          'name': Drupal.t('Assign shortcut'),
          'handler': function(text, item) {
            cobalt.actionCandidates(item, function(cand) {
              var out = $('<div class="shortcut-add"><h2>' + item.name + '</h2>' +
                Drupal.t('The keys !input should trigger the action:', {'!input': '<input class="key-combo" type="text" value="Ctrl+"/>'}) +
                '<br/> <select class="action-select"></select>' +
                '<p><button class="ok">' + Drupal.t('Ok') + '</button></p></div>');
              var actions = $(out).find('.action-select');
              var key_combo = $(out).find('.key-combo').css('width',50);
              var cand_count = cand.length;
              for(var i=0; i<cand_count; i++) {
                actions.append('<option value="' + cand[i].id + '">' + cand[i].name + '</option>');
              }

              $(out).find('button.ok').bind('click',function(){
                toggle_output('hide');
               cobalt.addKeyBinding(key_combo.val(), item.catalog, item.id, actions.val());
              });

              cobalt.showHtml(out);
              key_combo.focus();
            });
          }
        }
      ]
    });

    db.transaction(function (transaction) {
      transaction.executeSql('CREATE TABLE IF NOT EXISTS versions(' +
        'name TEXT NOT NULL, version INTEGER NOT NULL DEFAULT 0, ' +
        'CONSTRAINT pk_versions PRIMARY KEY(name));', [], nullDataHandler,cobalt.dbErrorHandler);
      transaction.executeSql('CREATE TABLE IF NOT EXISTS entries(' +
        'catalog TEXT NOT NULL, id TEXT NOT NULL, name TEXT NOT NULL, extra TEXT DEFAULT "", data TEXT NOT NULL DEFAULT "", data_class TEXT NOT NULL, ' +
        'state INTEGER NOT NULL DEFAULT 0, active INTEGER NOT NULL DEFAULT 1, ' +
        'CONSTRAINT pk_entries PRIMARY KEY(catalog, id));', [], nullDataHandler,cobalt.dbErrorHandler);
      transaction.executeSql('DELETE FROM entries WHERE catalog=?', ['*temporary*'], nullDataHandler, cobalt.dbErrorHandler);
      transaction.executeSql('CREATE TABLE IF NOT EXISTS key_bindings(' +
        'binding TEXT NOT NULL, catalog TEXT NOT NULL, id TEXT NOT NULL, handler TEXT NOT NULL, ' +
        'state INTEGER NOT NULL DEFAULT 0, active INTEGER NOT NULL DEFAULT 1, ' +
        'CONSTRAINT pk_bindings PRIMARY KEY(binding, state));', [], nullDataHandler,cobalt.dbErrorHandler);
      transaction.executeSql('CREATE TABLE IF NOT EXISTS usage_data(catalog TEXT NOT NULL, id TEXT NOT NULL, ' +
        'weight INTEGER NOT NULL DEFAULT 0, abbreviation TEXT NOT NULL DEFAULT "", last INTEGER, ' +
        'CONSTRAINT pk_usage_data PRIMARY KEY(catalog, id));', [], nullDataHandler,cobalt.dbErrorHandler);
      transaction.executeSql('CREATE TABLE IF NOT EXISTS handler_usage_data(catalog TEXT NOT NULL, id TEXT NOT NULL, ' +
        'handler TEXT NOT NULL, weight INTEGER NOT NULL DEFAULT 0,' +
        'CONSTRAINT pk_handler_usage_data PRIMARY KEY(catalog, id, handler));', [], nullDataHandler,cobalt.dbErrorHandler);
      transaction.executeSql('CREATE INDEX IF NOT EXISTS idx_entries_catalog ON entries(catalog);', [], nullDataHandler,cobalt.dbErrorHandler);
      transaction.executeSql('CREATE INDEX IF NOT EXISTS idx_entries_abbreviation ON usage_data(abbreviation);', [], nullDataHandler,cobalt.dbErrorHandler);
      transaction.executeSql('CREATE INDEX IF NOT EXISTS idx_entries_active ON entries(active DESC);', [], nullDataHandler,cobalt.dbErrorHandler);
      transaction.executeSql('CREATE INDEX IF NOT EXISTS idx_entries_weight ON usage_data(weight DESC);', [], nullDataHandler,cobalt.dbErrorHandler);
      transaction.executeSql('CREATE TABLE IF NOT EXISTS catalogs(' +
        'name TEXT NOT NULL PRIMARY KEY, updated INTEGER NOT NULL DEFAULT 0, state INTEGER NOT NULL DEFAULT 0, active INTEGER NOT NULL DEFAULT 1, uninstall INTEGER NOT NULL DEFAULT 0);', [], nullDataHandler,cobalt.dbErrorHandler);
    });

    var cobalt_output = $('<div id="cobalt-out"></div>').appendTo('body').hide();

    var bind_key = function (binding, catalog, id, handler) {
      $(document).bind('keydown', binding, function(){
        cobalt.loadEntry(catalog, id, function(item) {
          if (item) {
            cobalt.actionCandidates(item, function(cand){
              var cand_count = cand.length;
              for(var i=0; i<cand_count; i++) {
                if (cand[i].id == handler) {
                  cand[i].handler(item.name, item);
                }
              }
            });
          }
        });
      });
    };

    var toggle_output = function(arg) {
      if (cobalt_out_visible) {
        cobalt_output.hide();
        cobalt_out_visible = false;
      }
      else if (arg!='hide') {
        cobalt_output.show();
        cobalt_out_visible = true;
      }
    };

    var keypress_reaction = function() {
      if(cobalt_input.val()==current_text) {
        return;
      }
      current_text = cobalt_input.val();

      if($.trim(current_text)!='') {
        lookup();
      }
    };

    var action_keypress_reaction = function() {
      if(cobalt_h_input.val()==current_action_text) {
        return;
      }
      current_action_text = cobalt_h_input.val();

      action_candidates(item, function(candidates) {
        actions = candidates;
        set_handler(0, true);
      });
    };

    var clear_ac = function() {
      match_idx = 0;
      matches = null;
      item = 0;
      $('#cobalt .inner').attr('class','inner');
      $('#cobalt .inner label').hide();
      cobalt_ac.hide().empty();
      cobalt_paging.hide().empty();
    };

    var lookup = function(preserve_offset) {
      if (!preserve_offset) {
        match_offset = 0;
      }
      var like_expr = '%' + current_text + '%';
      db.transaction(function (transaction) {
        transaction.executeSql("SELECT e.*, u.weight FROM entries AS e " +
          "LEFT OUTER JOIN usage_data AS u ON (e.catalog=u.catalog AND e.id=u.id) " +
          "WHERE e.active=1 AND (u.abbreviation = ? OR e.name LIKE ? OR e.extra LIKE ?) " +
          "ORDER BY nullif(?,u.abbreviation), nullif(?,e.name), u.weight DESC LIMIT ?,?;", [
          current_text, like_expr, like_expr, current_text, current_text, match_offset, match_page_size ], lookup_finished,cobalt.dbErrorHandler);
      });
    };

    var lookup_finished = function(transaction, results) {
      if (results.rows.length) {
        match_idx = 0;
        $('#cobalt .left label').hide();
        cobalt_ac.empty().hide();
        for (var i=0; i<results.rows.length; i++) {
          var item = results.rows.item(i);
          item.information = $.evalJSON(item.data);
          if (typeof(catalogs[item.catalog]) !='undefined' && typeof(catalogs[item.catalog].item_formatter) == 'function'){
            var title = catalogs[item.catalog].item_formatter(item);
          }
          else {
            var title = item.name;
          }
          $('<li class="ac-opt-' + i + '"></li>').html(title).appendTo(cobalt_ac);
        }
        matches = results.rows;

        //Only count for paging when we're not already offsetting the result and
        //have a match count equal to the page size
        if (match_offset) {
          update_pager(match_count);
        }
        else if (matches.length==match_page_size) {
          var like_expr = '%' + current_text + '%';
          db.transaction(function (transaction) {
            transaction.executeSql("SELECT COUNT(*) as match_count FROM entries AS e " +
              "LEFT OUTER JOIN usage_data AS u ON (e.catalog=u.catalog AND e.id=u.id) " +
              "WHERE e.active=1 AND (u.abbreviation = ? OR e.name LIKE ? OR e.extra LIKE ?);", [
              current_text, like_expr, like_expr], function(transaction, results) {
                if (results.rows.length) {
                  match_count = results.rows.item(0).match_count;
                  update_pager(match_count);
                }
              },cobalt.dbErrorHandler);
          });
        }
        else {
          update_pager(matches.length);
        }
        cobalt_ac.show();
      }

      ac_select(0);
    };

    var update_pager = function(new_match_count) {
      match_count = new_match_count;
      cobalt_paging.hide().empty();

      var page_count = Math.min(Math.ceil(match_count/match_page_size),25);
      for (var i=0; i<page_count; i++ ) {
        var p = $('<li>&nbsp;</li>').appendTo(cobalt_paging);
        if (i==match_offset/match_page_size) {
          p.attr('class','current');
        }
      }

      cobalt_paging.show();
    };

    var ac_page = function(new_offset) {
      if (new_offset>=match_count || new_offset<0) {
        return;
      }
      match_offset = new_offset;
      lookup(true);
    };

    var ac_select = function(idx) {
      if (idx<0 || idx >= matches.length) {
        item = null;
        return;
      }

      item = matches.item(idx);
      item.information = $.evalJSON(item.data);
      var old_item = matches.item(match_idx);

      $('#cobalt .ac-opt-' + match_idx).removeClass('active');
      match_idx = idx;
      // Generate path specific classes that can be used for icons.
      // Matches the classes used in the Rubik admin theme.
      var classes = '';
      if (item.data_class === 'url_data') {
        var path = $.evalJSON(item.data);
        if (typeof(path) == 'object') {
          path = path.path;
        }
        classes = [];
        var args = path.split('/');
        while(args.length) {
          classes[args.length - 1] = 'path-' + args.join('-');
          args.pop();
        }
        classes = classes.join(' ');
      };
      $('#cobalt .left .inner').attr('class','inner cobalt-item-' + item.data_class + ' ' + classes);
      $('#cobalt .left label').text(item.name).show();
      $('#cobalt .ac-opt-' + match_idx).addClass('active');

      action_candidates(item, function(candidates){
        actions = candidates;
        set_handler(0, true);
      });
    };

    var action_candidates = function(item, callback) {
      var candidates = [], gcount, i, j, cls_count, rc, cc, item,
        add_applicable = function(handler) {
          // Check if the handler matches the current_action_text (from closure),
          // or run the handlers own applicability check if it has one.
          if ((current_action_text=='' || handler['name'].toLowerCase().indexOf(current_action_text)!=-1) &&
              (!handler['applicable'] || handler.applicable(current_text, item))) {
            candidates.push(handler);
          }
        };

      // Add handlers for the items data class that match the current_action_text
      if (typeof(handlers[item.data_class])!='undefined') {
        cls_count = handlers[item.data_class].length;
        for (i=0; i<cls_count; i++) {
          add_applicable(handlers[item.data_class][i]);
        }
      }

      // Add global handlers that match the current_action_text
      g_count = global_handlers.length;
      for (i=0; i<g_count; i++) {
        add_applicable(global_handlers[i]);
      }

      // Load the usage data for the candidates so that we may sort them
      db.transaction(function (transaction) {
        transaction.executeSql("SELECT handler, weight FROM handler_usage_data WHERE catalog=? AND id=?",
          [item.catalog, item.id], function(transaction, results) {
            rc = results.rows.length;
            cc = candidates.length;
            for (j=0; j<cc; j++) {
              candidates[j].context_weight = 0;
              for (i=0; i<rc; i++) {
                r = results.rows.item(i);
                if (r.handler == candidates[j].id) {
                  candidates[j].context_weight = r.weight;
                }
              }
            }
            // Sort the candidates after context_weight and weight
            candidates.sort(function(a, b){
              var cwd = b.context_weight-a.context_weight;
              if (cwd==0) {
                return b.weight-a.weight;
              }
              return cwd;
            });
            callback(candidates);
        });
      });
    };

    var handler_class = function() {
      if (handler) {
        return handler['class'] ? handler['class'] : 'default';
      }
    };

    var set_handler = function(idx, update) {
      if (update) {
        cobalt_actions.empty();
        var a_count = actions.length;
        for(var i=0; i<a_count; i++) {
          $('<li class="action-opt-' + i + '"></l i>').html(actions[i]['name']).appendTo(cobalt_actions);
        }
      }

      if (idx<0 || idx >= actions.length) {
        return;
      }

      $('#cobalt .action-opt-' + handler_idx).removeClass('active');
      $('#cobalt .action-opt-' + idx).addClass('active');
      handler_idx = idx;
      var new_handler = actions[idx];

      handler = new_handler;
      if (handler) {
        var newClass = handler_class();
        $('#cobalt .right .inner').attr('class','inner cobalt-action-' + newClass);
        $('#cobalt .right label').text(handler.name).show();
      }
    };

    var run_handler = function() {
      if (item && typeof(handler['handler']) == 'function') {
        var text = $.trim(cobalt_input.val());
        register_use(text, item, handler);
        try {
          handler.handler(text, item);
        }
        catch(err) {
          log_error(Drupal.t("The handler threw a exception"), err);
        }
      }
      hide();
    };

    var get_last_entry = function() {
      db.transaction(function (transaction) {
        transaction.executeSql("SELECT e.*, u.weight FROM entries AS e INNER JOIN usage_data AS u ON u.catalog = e.catalog AND u.id = e.id WHERE last = 1;", [], function(transaction, results) {
          lookup_finished(transaction, results);
        }, cobalt.dbErrorHandler);
      });
    };

    var toggle = function(arg) {
      if (cobalt_visible) {
        cb.hide();
        cobalt_visible = false;
      }
      else if (arg!='hide') {
        toggle_output('hide');
        cobalt_input.val($.trim(cobalt_input.val()));
        cb.show();
        cobalt_visible = true;
        setTimeout(function(){ cobalt_input.focus(); cobalt_input.select(); }, 100);
      }
    };

    var hide = function() {
      toggle('hide');
    };

    var init = function() {
      $(document).trigger('cobalt-init', cobalt);

      // Load key bindings
      db.transaction(function (transaction) {
        transaction.executeSql('SELECT binding, catalog, id, handler FROM key_bindings', [], function(transaction, results) {
          for (var i=0; i<results.rows.length; i++) {
            var b = results.rows.item(i);
            bind_key(b.binding, b.catalog, b.id, b.handler);
          }
        },cobalt.dbErrorHandler);
      });

      get_last_entry();

      db.transaction(function (transaction) {
        transaction.executeSql("SELECT * FROM catalogs ORDER BY updated;", [ ], function(transaction, results) {
          var info = {};
          var state = current_state();

          // Queue catalogs for update
          for (var i = 0; i < results.rows.length; i++) {
            var item = results.rows.item(i);
            info[item.name] = item;
            update_queue.push({'name': item.name, 'updated': (item.state==state?item.updated:0) });
          }

          // Install new catalogs and queue them for updates
          for (var key in catalogs) {
            (function(key) {
              if (!info[key]) {
                if (catalogs[key]['install']) {
                  catalogs[key].install();
                }
                db.transaction(function (transaction) {
                  transaction.executeSql("INSERT INTO catalogs(name) VALUES(?)", [key], nullDataHandler,cobalt.dbErrorHandler);
                });
                update_queue.unshift({'name': key, 'updated': 0 });
              }
            })(key);
          }

          // Update loop
          var update_counter = 0;
          var update_loop = function() {
            setTimeout(function() {
              if(update_queue.length) {
                var inf = update_queue.shift();
                var now = new Date().getTime();
                var catalog = catalogs[inf.name];

                if (typeof(catalog['update_rate'])!='undefined' && inf.updated + catalog.update_rate > now) {
                  update_queue.push(inf);
                  update_loop();
                }
                else {
                  if (catalog['update']) {
                    catalog.update(inf.updated, function(enqueue){
                      var now = new Date().getTime();
                     cobalt.catalogUpdated(inf.name);

                      if (enqueue) {
                        update_queue.push({'name': inf.name, 'updated': now });
                      }

                      update_counter++;
                      update_loop();
                    });
                  }
                  else {
                    update_loop();
                  }
                }
              }
            },update_counter?1000:100);
          };
          update_loop();
        },cobalt.dbErrorHandler);
      });

      $(document).trigger('cobalt-post-init', cobalt);

      cb.bind('click', function(e){ return false; }).
        bind('keydown', 'esc', function(){ toggle('hide'); toggle_output('hide'); return false; }).
        bind('keydown', 'return', function(){ run_handler(); return false; });
      cobalt_input.bind('keydown', 'up', function(){ ac_select(match_idx-1); return false; }).
        bind('keydown', 'down', function(){ ac_select(match_idx+1); return false; }).
        bind('keydown', 'Alt+left', function(){ ac_page(match_offset-match_page_size); return false; }).
        bind('keydown', 'Alt+right', function(){ ac_page(match_offset+match_page_size); return false; }).
        bind('keyup', function(){ keypress_reaction(); return false; }).
        bind('focus', function() {
          if (matches && matches.length) {
            cobalt_ac.show();
            cobalt_paging.show();
          }
          cobalt_actions.hide();
        });
      cobalt_h_input.bind('keydown', 'up', function(){ set_handler(handler_idx-1); return false; }).
        bind('keydown', 'down', function(){ set_handler(handler_idx+1); return false; }).
        bind('keyup', function(){ action_keypress_reaction(); return false; }).
        bind('focus', function(){ cobalt_paging.hide(); cobalt_ac.hide(); cobalt_actions.show(); });
      cobalt_output.bind('click', function(e){ return false; });
      $('.cell.left', cb).bind('click', function(){ cobalt_input[0].focus(); });
      $('.cell.right', cb).bind('click', function(){ cobalt_h_input[0].focus(); });
      $(document).bind('click', function(){ toggle('hide'); toggle_output('hide'); });

      if (Drupal && Drupal.settings && Drupal.settings.cobalt) {
        var bindings = Drupal.settings.cobalt.bindings,
          bind_count = bindings.length, i;
        for (i=0; i<bind_count; i++) {
          $(document).bind('keydown', bindings[i], toggle);
        }
      }
      else {
        $(document).bind('keydown', 'Alt+space', toggle)
          .bind('keydown', 'Ctrl+space', toggle);
      }
    };

    // Initialize GUI
    var cb = $('<div id="cobalt">'+
      '<div class ="cells"><div class="cell left"><div class="inner"><span class="icon"></span><input type="text" id="cobalt-input" /><label></label></div></div>'+
      '<div class="cell right"><div class="inner"><input type="text" id="cobalt-handler-input" /><label></label></div></div></div>'+
      '<ol class="cobalt-paging"></ol><ul class="cobalt-autocomplete"></ul><ul class="cobalt-actions"></ul></div>').appendTo('body').hide();
    var cobalt_input = $('#cobalt-input');
    var cobalt_h_input = $('#cobalt-handler-input');
    var cobalt_ac = $('#cobalt .cobalt-autocomplete');
    var cobalt_actions = $('#cobalt .cobalt-actions');
    var cobalt_paging = $('#cobalt .cobalt-paging');
    $('#cobalt .right label').hide();

    // Check if we need to update anything before initializing
    db.transaction(function (transaction) {
      transaction.executeSql('SELECT name, version FROM versions', [], function(transaction, results) {
        var v = {};
        for (var i=0; i<results.rows.length; i++) {
          var vi = results.rows.item(i);
          v[vi.name] = vi.version;
        }

        db.transaction(function (transaction) {
          var plugin_count = plugin_names.length;
          for (var i=0; i<plugin_count; i++) {
            var n=plugin_names[i];
            if (typeof(v[n])=='undefined') {
              transaction.executeSql('INSERT INTO versions(name, version) VALUES(?,?)', [ n, plugins[n].version ], nullDataHandler,cobalt.dbErrorHandler);
            }
            else if (v[n]<plugins[n].version) {
              required_updates.push([n, v[n], plugins[n].version]);
            }
          }

          if (required_updates.length) {
            var update_notice = function () {
              var update_url = Drupal.settings.basePath + 'cobalt/update';
              for (var i=0; i<required_updates.length; i++) {
                var u = required_updates[i];
                update_url += '/' + u[0] + '/' + u[1] + '/' + u[2];
              }
             cobalt.showHtml('<h1>' + Drupal.t('Update required') + '</h1>' +
              '<p>' + Drupal.t('Cobalt must be updated before it can be used') + '</p>' +
              '<p><a class="cobalt-update-link" href="' + update_url + '">' + Drupal.t('Click here to update') + '</a></p>');
            };
            $(document).bind('click', function(){ toggle_output('hide'); });
            if (Drupal && Drupal.settings && Drupal.settings.cobalt) {
              var bindings = Drupal.settings.cobalt.bindings,
                bind_count = bindings.length, i;
              for (i=0; i<bind_count; i++) {
                $(document).bind('keydown', bindings[i], update_notice);
              }
            }
            else {
              $(document).bind('keydown', 'Alt+space', update_notice)
                .bind('keydown', 'Ctrl+space', update_notice);
            }
          }
          else {
            init();
          }
        });
      },cobalt.dbErrorHandler);
    });
  });
})(jQuery);
