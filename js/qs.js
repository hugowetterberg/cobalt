$(document).ready(function(){
  // Initialize database
  if (window.openDatabase) {
    var db = openDatabase('quicksilver', '1.0', 'Quicksilver Database', 1024000);
  }
  else if (google.gears) {
    var gdb = google.gears.factory.create('beta.database');
    gdb.open('quicksilver');
    var db = gears_db_html5_wrapper(gdb);
  }
  
  if (!db) {
    if (window.console) {
      console.error('Quicksilver requires either Safari or a browser with Google Gears');
    }
    return;
  }
  var nullDataHandler = function(transaction, results) { }, 
    catalogs = {}, global_handlers = [], handlers = {}, update_queue = [];
    
  // Initialize Quicksilver
  var q = {
    'dbErrorHandler': function(transaction, error)
    {
      $(document).trigger('quicksilver-db-error');
      if (window.console) {
        console.error(error.message+' (Code: '+error.code+')');
      }
      return false;
    },
    'registerCatalog': function(name, catalog) {
      catalogs[name] = catalog;
    },
    'catalogUpdated': function(catalog, updated) {
      if (typeof(updated)=='undefined') {
        updated = new Date().getTime();
      }
      db.transaction(function (transaction) {
        transaction.executeSql("UPDATE catalogs SET updated=?, state=? WHERE name = ?;", [ updated, Drupal.settings.quicksilver.state, catalog ], nullDataHandler, q.dbErrorHandler);
      });
    },
    'emptyCatalog': function(name) {
      db.transaction(function (transaction) {
        transaction.executeSql("DELETE FROM entries WHERE catalog=?;", [ name ], nullDataHandler, q.dbErrorHandler);
      });
    },
    'addKeyBinding': function(binding, catalog, id, handler, active, state) {
      if (typeof(state)=='undefined') {
        state = Drupal.settings.quicksilver.state;
      }
      if (typeof(active)=='undefined') {
        active = 1;
      }
      bind_key(binding, catalog, id, handler);
      db.transaction(function (transaction) {
        transaction.executeSql("INSERT OR REPLACE INTO key_bindings(binding, catalog, id, handler, active, state) VALUES(?,?,?,?,?,?);", [ binding, catalog, id, handler, active, state ], nullDataHandler, q.dbErrorHandler);
      });
    },
    'loadEntry': function(catalog, id, callback) {
      if (typeof(state)=='undefined') {
        state = Drupal.settings.quicksilver.state;
      }
      db.transaction(function (transaction) {
        transaction.executeSql("SELECT * FROM entries WHERE catalog=? AND id=? AND state=?;", [ catalog, id, state ], function(transaction, results) {
          var item = null;
          if (results.rows.length) {
            item = results.rows.item(0);
            item.information = $.evalJSON(item.data);
          }
          callback(item);
        }, q.dbErrorHandler);
      });
    },
    'addEntry': function(id, name, information, catalog, classname, active, state) {
      if (typeof(state)=='undefined') {
        state = Drupal.settings.quicksilver.state;
      }
      if (typeof(active)=='undefined') {
        active = 1;
      }
      db.transaction(function (transaction) {
        transaction.executeSql("INSERT OR REPLACE INTO entries(id, name, data, catalog, data_class, state, active) VALUES(?,?,?,?,?,?,?);", [ id, name, $.toJSON(information), catalog, classname, state, active], nullDataHandler, q.dbErrorHandler);
      });
    },
    'registerUse': function(text, item) {
      if (item.weight == null) {
        db.transaction(function (transaction) {
          transaction.executeSql("INSERT INTO usage_data(catalog, id, weight, abbreviation) VALUES(?,?,?,?)", 
            [item.catalog, item.id, 1, text], nullDataHandler, q.dbErrorHandler);
        });
      } 
      else {
        db.transaction(function (transaction) {
          transaction.executeSql("UPDATE usage_data SET weight=weight+1, abbreviation=? WHERE catalog=? AND id=?", 
            [text, item.catalog, item.id], nullDataHandler, q.dbErrorHandler);
        });
      }
    },
    'registerHandler': function(handler, data_class) {
      if (typeof(data_class)=='undefined') {
        global_handlers.push(handler);
      }
      else {
        if (!handlers[data_class]) {
          handlers[data_class] = [];
        }
        handlers[data_class].push(handler);
      }
    },
    'actionCandidates': function(item) {
      return action_candidates(item);
    },
    'showHtml': function(html) {
      if (typeof(html) == 'string') {
        qs_output.html(html);
      }
      else {
        qs_output.empty().append(html);
      }
      
      if (!qs_out_visible) {
        toggle_output();
      }
    }
  };
  
  var bind_key = function (binding, catalog, id, handler) {
    q.loadEntry(catalog, id, function(item) {
      if (item) {
        $(document).bind('keydown', binding, function(){
          var cand = q.actionCandidates(item);
          var cand_count = cand.length;
          for(var i=0; i<cand_count; i++) {
            if (cand[i].id == handler) {
              cand[i].handler(item.name, item);
            }
          }
        });
      }
    });
  };
  
  q.registerHandler({
    'id': 'qs_show',
    'name': 'Show',
    'handler': function(text, item) {
      q.showHtml('<h2>' + item.name + '</h2>' +
        'text: <i>' + text + '</i><br/>' + 
        'id: ' + item.id + '<br/>' + 
        'catalog: ' + item.catalog + '<br/>' + 
        'class: ' + item.data_class + '<br/>' + 
        'data: ' + item.data + '<br/>' + 
        'weight: ' + item.weight);
    }
  });
  
  q.registerHandler({
    'id': 'qs_abbrev',
    'name': 'Assign shortcut',
    'handler': function(text, item) {
      var cand = q.actionCandidates(item);
      var out = $('<div class="shortcut-add"><h2>' + item.name + '</h2>' + 
        'The keys <input class="key-combo" type="text" value="Ctrl+"/> should trigger the action:<br/> <select class="action-select"></select>' + 
        '<button class="ok">Ok</button></div>');
      var actions = $(out).find('.action-select');
      var key_combo = $(out).find('.key-combo').css('width',50);
      var cand_count = cand.length;
      for(var i=0; i<cand_count; i++) {
        actions.append('<option value="' + cand[i].id + '">' + cand[i].name + '</option>');
      }
      
      $(out).find('button.ok').bind('click',function(){
        toggle_output('hide');
        q.addKeyBinding(key_combo.val(), item.catalog, item.id, actions.val());
      });
      
      q.showHtml(out);
    }
  });
  
  // Load key bindings
  db.transaction(function (transaction) {
    transaction.executeSql('SELECT binding, catalog, id, handler FROM key_bindings', [], function(transaction, results) {
      for (var i=0; i<results.rows.length; i++) {
        var b = results.rows.item(i);
        bind_key(b.binding, b.catalog, b.id, b.handler);
      }
    }, q.dbErrorHandler);
  });
  
  $(document).trigger('quicksilver-pre-init', q);
  
  db.transaction(function (transaction) {
    transaction.executeSql('CREATE TABLE IF NOT EXISTS entries(' +
      'catalog TEXT NOT NULL, id TEXT NOT NULL, name TEXT NOT NULL, data TEXT NOT NULL DEFAULT "", data_class TEXT NOT NULL, ' + 
      'state INTEGER NOT NULL DEFAULT 0, active INTEGER NOT NULL DEFAULT 1, ' + 
      'CONSTRAINT pk_entries PRIMARY KEY(catalog, id));', [], nullDataHandler, q.dbErrorHandler);
    transaction.executeSql('CREATE TABLE IF NOT EXISTS key_bindings(' +
      'binding TEXT NOT NULL, catalog TEXT NOT NULL, id TEXT NOT NULL, handler TEXT NOT NULL, ' + 
      'state INTEGER NOT NULL DEFAULT 0, active INTEGER NOT NULL DEFAULT 1, ' + 
      'CONSTRAINT pk_bindings PRIMARY KEY(binding, state));', [], nullDataHandler, q.dbErrorHandler);
    transaction.executeSql('CREATE TABLE IF NOT EXISTS usage_data(catalog TEXT NOT NULL, id TEXT NOT NULL, ' + 
      'weight INTEGER NOT NULL DEFAULT 0, abbreviation TEXT NOT NULL DEFAULT "",' +
      'CONSTRAINT pk_usage_data PRIMARY KEY(catalog, id));', [], nullDataHandler, q.dbErrorHandler);
    transaction.executeSql('CREATE INDEX IF NOT EXISTS idx_entries_catalog ON entries(catalog);', [], nullDataHandler, q.dbErrorHandler);
    transaction.executeSql('CREATE INDEX IF NOT EXISTS idx_entries_abbreviation ON usage_data(abbreviation);', [], nullDataHandler, q.dbErrorHandler);
    transaction.executeSql('CREATE INDEX IF NOT EXISTS idx_entries_active ON entries(active DESC);', [], nullDataHandler, q.dbErrorHandler);
    transaction.executeSql('CREATE INDEX IF NOT EXISTS idx_entries_weight ON usage_data(weight DESC);', [], nullDataHandler, q.dbErrorHandler);
    transaction.executeSql('CREATE TABLE IF NOT EXISTS catalogs(' +
      'name TEXT NOT NULL PRIMARY KEY, updated INTEGER NOT NULL DEFAULT 0, state INTEGER NOT NULL DEFAULT 0, active INTEGER NOT NULL DEFAULT 1, uninstall INTEGER NOT NULL DEFAULT 0);', [], nullDataHandler, q.dbErrorHandler);
  });
  
  $(document).trigger('quicksilver-init', q);
  
  db.transaction(function (transaction) {
    transaction.executeSql("SELECT * FROM catalogs ORDER BY updated;", [ ], function(transaction, results) {
      var info = {};
      
      // Queue catalogs for update
      for (var i = 0; i < results.rows.length; i++) {
        var item = results.rows.item(i);
        info[item.name] = item;
        update_queue.push(item);
      }
      
      // Install new catalogs and queue them for updates
      for (var key in catalogs) {
        (function(key) {
          if (!info[key]) {
            if (catalogs[key]['install']) {
              catalogs[key].install();
            }
            db.transaction(function (transaction) {
              transaction.executeSql("INSERT INTO catalogs(name) VALUES(?)", [key], nullDataHandler, q.dbErrorHandler);
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
                  q.catalogUpdated(inf.name);

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
    }, q.dbErrorHandler);
  });
  
  $(document).trigger('quicksilver-post-init', q);
  
  // Initialize GUI
  var qs = $('<div id="qs">'+
    '<div class="cell left"><div class="inner"><input type="text" id="qs-input" /><label></label></div></div>'+ 
    '<div class="cell right"><div class="inner"><input type="text" id="qs-handler-input" /><label></label></div></div>'+
    '<ul class="qs-autocomplete"></ul><ul class="qs-actions"></ul></div>').appendTo('body').hide();
  var qs_output = $('<div id="qs_out"></div>').appendTo('body').hide();
  var qs_input = $('#qs-input');
  var qs_h_input = $('#qs-handler-input');
  var qs_ac = $('#qs .qs-autocomplete');
  $('#qs .right label').hide();
  
  var keypress_time = 200,
      wait_until = 0,
      lookup_pending = false,
      qs_visible = false, qs_out_visible = false,
      matches = [], match_idx = 0, handler_idx = 0, 
      current_text, handler, item, actions;
  
  var keypress_reaction = function() {
    if(qs_input.val()==current_text) {
      return;
    }
    current_text = qs_input.val();
    
    if($.trim(current_text)!='') {
      wait_until = new Date().getTime() + keypress_time;
      schedule_lookup();
    }
    else {
      clear_ac();
    }
  };
  
  var clear_ac = function() {
    match_idx = 0;
    current_text = '';
    $('#qs .left label').hide();
    qs_ac.empty().hide();
  };
  
  var schedule_lookup = function() {
    var time = new Date().getTime();
    if (!lookup_pending) {
      lookup_pending = true;
      setTimeout(lookup, wait_until - time + 50);
    }
  };
  
  var lookup = function() {
    var time = new Date().getTime();
    if (time < wait_until) {
      lookup_pending = false;
      schedule_lookup();
    }
    else if(current_text == '') {
      lookup_pending = false;
    }
    else {
      var like_expr = '%' + current_text + '%';
      db.transaction(function (transaction) {
        transaction.executeSql("SELECT e.*, u.weight FROM entries AS e " + 
          "LEFT OUTER JOIN usage_data AS u ON (e.catalog=u.catalog AND e.id=u.id) " +
          "WHERE e.active=1 AND (u.abbreviation = ? OR e.name LIKE ?) " + 
          "ORDER BY nullif(?,u.abbreviation), nullif(?,e.name), u.weight DESC LIMIT 5;", [ 
          current_text, like_expr, current_text, current_text ], lookup_finished, q.dbErrorHandler);
      });
    }
  };
  
  var lookup_finished = function(transaction, results) {
    lookup_pending = false;
    
    match_idx = 0;
    $('#qs .left label').hide();
    qs_ac.empty().hide();
    
    if (results.rows.length) {
      for (var i=0; i<results.rows.length; i++) {
        var item = results.rows.item(i);
        $('<li class="ac-opt-' + i + '"></li>').text(item.name).appendTo(qs_ac);
      }
      matches = results.rows;
      qs_ac.show();
    }
    else {
      if (matches.length) {
        var old_item = matches.item(match_idx);
        $('#qs .left .inner').removeClass(old_item['data_class']);
      }      
      matches = [];
    }
    
    ac_select(0);
  };
  
  var ac_select = function(idx) {
    if (idx<0 || idx >= matches.length) {
      item = null;
      return;
    }
    
    item = matches.item(idx);
    item.information = $.evalJSON(item.data);
    var old_item = matches.item(match_idx);
    
    $('#qs .ac-opt-' + match_idx).removeClass('active');
    match_idx = idx;
    $('#qs .left .inner').attr('class','inner qs-item-' + item.data_class);
    $('#qs .left label').text(item.name).show();
    $('#qs .ac-opt-' + match_idx).addClass('active');
    
    actions = action_candidates(item);
    set_handler(0);
  };
  
  var action_candidates = function(item) {
    var candidates = [];
    var add_applicable = function(handler) {
      if (typeof(handler['applicable'])=='undefined' || handler.applicable(current_text, item)) {
        candidates.push(handler);
      }
    };
    
    if (typeof(handlers[item.data_class])!='undefined') {
      var cls_count = handlers[item.data_class].length;
      for (var i=0; i<cls_count; i++) {
        add_applicable(handlers[item.data_class][i]);
      }
    }
    
    var g_count = global_handlers.length;
    for (var i=0; i<g_count; i++) {
      add_applicable(global_handlers[i]);
    }
    
    return candidates;
  };
  
  var handler_class = function() {
    if (handler) {
      return handler['class'] ? handler['class'] : 'default';
    }
  };
  
  var set_handler = function(idx) {
    if (idx<0 || idx >= actions.length) {
      return;
    }
    
    handler_idx = idx;
    var new_handler = actions[idx];
    
    handler = new_handler;
    if (handler) {
      var newClass = handler_class();
      $('#qs .right .inner').attr('class','inner qs-action-' +newClass);
      $('#qs .right label').text(handler.name).show();
    }
  };
  
  var run_handler = function() {
    if (item && typeof(handler['handler']) == 'function') {
      var text = $.trim(qs_input.val());
      q.registerUse(text, item);
      handler.handler(text, item);
    }
    hide();
  };
  
  var toggle = function(arg) {
    if (qs_visible || arg=='hide') {
      qs.hide();
      qs_visible = false;
    }
    else {
      toggle_output('hide');
      clear_ac();
      qs_input.val($.trim(qs_input.val()));
      qs.css({
        'top': $(window).height()/2 + document.body.scrollTop - qs.height()/2,
        'left': $(window).width()/2 - qs.width()/2
      }).show();
      qs_visible = true;
      setTimeout(function(){ qs_input.focus(); qs_input.select(); }, 100);
    }
  };
  
  var toggle_output = function(arg) {
    if (qs_out_visible || arg=='hide') {
      qs_output.hide();
      qs_out_visible = false;
    }
    else {
      qs_output.css({
        'top': $(window).height()/2 + document.body.scrollTop - qs_output.height()/2,
        'left': $(window).width()/2 - qs_output.width()/2
      }).show();
      qs_out_visible = true;
    }
  };
  
  var hide = function() {
    toggle('hide');
  };
  
  qs.bind('click', function(e){ return false; }).
    bind('keydown', 'esc', function(){ toggle('hide'); toggle_output('hide'); }).
    bind('keydown', 'return', function(){ run_handler(); });
  qs_input.bind('keydown', 'up', function(){ ac_select(match_idx-1); }).
    bind('keydown', 'down', function(){ ac_select(match_idx+1); }).
    bind('keyup', function(){ setTimeout(keypress_reaction, 10); });
  qs_h_input.bind('keydown', 'up', function(){ set_handler(handler_idx-1); }).
    bind('keydown', 'down', function(){ set_handler(handler_idx+1); });
  qs_output.bind('click', function(e){ return false; });
  
  $(document).bind('click', function(){ toggle('hide'); toggle_output('hide'); })
    .bind('keydown', 'Alt+space', toggle)
    .bind('keydown', 'Ctrl+space', toggle);
});