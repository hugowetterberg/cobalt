$(document).bind('quicksilver-init', function(evt, q) {  
  var nodes = {
    'update': function(last_update, callback) {
      $.getJSON(Drupal.settings.basePath + 'quicksilver/data/users_json/' + Math.round((last_update/1000)), {}, function (data) {
        var num_nodes = data.length;
        for (var i=0; i<num_nodes; i++) {
          q.addEntry(data[i][0], data[i][1], {'perm': data[i][2]}, 'users', 'user');
        }
        callback(true);
      });
    },
    'install': function() {
    },
    'uninstall': function() {
    },
    'update_rate': 60000
  };
  
  // Registering catalog
  q.registerCatalog('users', nodes);
  
  // Register handlers
  q.registerHandler({
    'name': 'View',
    'applicable': function(text, item) {
      return item.information.perm.indexOf('r') >= 0;
    },
    'handler': function(text, item) {
      window.location.href = Drupal.settings.basePath + 'user/' + item.id;
    }
  }, 'user');
  
  q.registerHandler({
    'name': 'Edit',
    'applicable': function(text, item) {
      return item.information.perm.indexOf('w') >= 0;
    },
    'handler': function(text, item) {
      window.location.href = Drupal.settings.basePath + 'user/' + item.id + '/edit';
    }
  }, 'user');
  
  q.registerHandler({
    'name': 'Delete',
    'applicable': function(text, item) {
      return item.information.perm.indexOf('d') >= 0;
    },
    'handler': function(text, item) {
      window.location.href = Drupal.settings.basePath + 'user/' + item.id + '/delete';
    }
  }, 'user');
});