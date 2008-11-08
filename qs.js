$(document).ready(function(){
  // Initialize database
  if (window.openDatabase) {
    var db = openDatabase('quicksilver', '1.0', 'Quicksilver Database', 1024000);
  }
  else if (google.gears) {
    var dbman = google.gears.factory.create('beta.databasemanager');
    var db = dbman.open('quicksilver', '1.0', 'Quicksilver Database', 1024000);
  }
  
  if (!db) {
    if (window.console) {
      console.error('Quicksilver requires either Safari or a browser with Google Gears');
    }
    return;
  }
  var nullDataHandler = function(transaction, results) { };
  
  // Initialize Quicksilver
  var catalogs = {};
  var update_queue = [];
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
        transaction.executeSql("UPDATE catalogs SET updated=? WHERE name = ?;", [ updated, name ], nullDataHandler, q.dbErrorHandler);
      });
    },
    'addEntry': function(name, catalog, classname, active) {
      if (typeof(active)=='undefined') {
        active = 1;
      }
      db.transaction(function (transaction) {
        transaction.executeSql("INSERT INTO entries(name, catalog, class, active) VALUES(?,?,?,?);", [ name, catalog, classname, active], nullDataHandler, q.dbErrorHandler);
      });
    }
  };
  
  $(document).trigger('quicksilver-pre-init', q);
  
  db.transaction(function (transaction) {
    transaction.executeSql('CREATE TABLE IF NOT EXISTS entries(' +
      'name TEXT NOT NULL, catalog TEXT NOT NULL, class TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1, weight INTEGER NOT NULL DEFAULT 0, abbreviation TEXT NOT NULL DEFAULT "");', [], nullDataHandler, q.dbErrorHandler);
    transaction.executeSql('CREATE INDEX IF NOT EXISTS idx_entries_catalog ON entries(catalog);', [], nullDataHandler, q.dbErrorHandler);
    transaction.executeSql('CREATE INDEX IF NOT EXISTS idx_entries_abbreviation ON entries(abbreviation);', [], nullDataHandler, q.dbErrorHandler);
    transaction.executeSql('CREATE INDEX IF NOT EXISTS idx_entries_active ON entries(active DESC);', [], nullDataHandler, q.dbErrorHandler);
    transaction.executeSql('CREATE INDEX IF NOT EXISTS idx_entries_weight ON entries(weight DESC);', [], nullDataHandler, q.dbErrorHandler);
    transaction.executeSql('CREATE TABLE IF NOT EXISTS catalogs(' +
      'name TEXT NOT NULL PRIMARY KEY, updated INTEGER NOT NULL DEFAULT 0, active INTEGER NOT NULL DEFAULT 1, uninstall INTEGER NOT NULL DEFAULT 0);', [], nullDataHandler, q.dbErrorHandler);
  });
  
  $(document).trigger('quicksilver-init', q);
  
  db.transaction(function (transaction) {
    transaction.executeSql("SELECT * FROM catalogs ORDER BY updated;", [ ], function(transaction, results) {
      var info = {};
      
      // Queue catalogs for update
      for (var i = 0; i < results.rows.length; i++) {
        var item = results.rows.item(i);
        info[item.name] = item;
        update_queue.push(item.name);
      }
      
      // Install new catalogs and queue them for updates
      for (var key in catalogs) {
        if (!info[key] && catalogs[key]['install']) {
          catalogs[key].install();
          db.transaction(function (transaction) {
            transaction.executeSql("INSERT INTO catalogs(name) VALUES(?)", [key], nullDataHandler);
          });
          update_queue.unshift(key);
        }
      }
    }, q.dbErrorHandler);
  });
  
  // Initialize GUI
  var qs = $('<div id="qs"><div class="left"><input type="text" id="qs-input" /></div><div class="right"></div><ul class="qs-autocomplete"></ul></div>').appendTo('body').hide();
  var qs_input = $('#qs-input');
  var qs_ac = $('#qs .qs-autocomplete');
  
  var schedule_lookup, lookup, keypress_reaction, 
      keypress_time = 200,
      last_keypress = 0,
      lookup_pending = false,
      qs_visible = false,
      matches = [], match_idx = 0, current_text;
  
  var keypress_reaction = function() {
    if(qs_input.val()==current_text) {
      return;
    }
    current_text = qs_input.val();
    
    if($.trim(current_text)!='') {
      last_keypress = new Date().getTime();
      schedule_lookup();
    }
    else {
      clear_ac();
    }
  };
  
  var clear_ac = function() {
    match_idx = 0;
    current_text = "";
    qs_ac.empty().hide();
  };
  
  var schedule_lookup = function() {
    var time = new Date().getTime();
    if (!lookup_pending) {
      lookup_pending = true;
      setTimeout(lookup, keypress_time - (time - last_keypress));
    }
  };
  
  var lookup = function() {
    var time = new Date().getTime();
    if (time > keypress_time + last_keypress) {
      lookup_pending = false;
      schedule_lookup();
    }
    else {
      db.transaction(function (transaction) {
        transaction.executeSql("SELECT * FROM entries WHERE active=1 AND (abbreviation = ? OR name LIKE ?) ORDER BY nullif(name,?), nullif(abbreviation,?), weight DESC;", [ 
          current_text, current_text+'%', current_text, current_text ], lookup_finished, q.dbErrorHandler);
      });
    }
  };
  
  var lookup_finished = function(transaction, results) {
    lookup_pending = false;
    clear_ac();
    
    if (results.rows.length) {
      for (var i=0; i<results.rows.length; i++) {
        var item = results.rows.item(i);
        $('<li class="ac-opt-' + i + '"></li>').text(item.name).appendTo(qs_ac);
      }
      qs_ac.show();
    }
    
    ac_select(0);
  };
  
  var ac_select = function(idx) {
    if (idx<0 || idx >= matches.length) {
      return;
    }
    
    $('#qs .ac-opt-' + match_idx).removeClass('active');
    match_idx = idx;
    $('#qs .ac-opt-' + match_idx).addClass('active');
  };
  
  var toggle = function(arg) {
    if (qs_visible || arg=='hide') {
      qs.hide();
      qs_visible = false;
    }
    else {
      clear_ac();
      qs_input.val($.trim(qs_input.val()));
      qs.css({
        'top': $(window).height()/4 + document.body.scrollTop - qs.height()/2,
        'left': $(window).width()/4 - qs.width()/2
      }).show();
      qs_visible = true;
      setTimeout(function(){ qs_input.focus(); qs_input.select(); }, 100);
    }
  };
  
  var hide = function() {
    toggle('hide');
  };
  
  qs.bind('click', function(e){ return false; });
  qs.bind('keydown', 'up', function(){ ac_select(match_idx-1); });
  qs.bind('keydown', 'down', function(){ ac_select(match_idx+1); });
  qs_input.bind('keyup', keypress_reaction);
  
  $(document).bind('click', hide);
  $(document).bind('keydown', 'Alt+space', toggle);
});