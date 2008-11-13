$(document).bind('quicksilver-init', function(evt, q) {  
  var nodes = {
    'update': function(last_update, callback) {
      $.getJSON(Drupal.settings.basePath + 'quicksilver/nodes_json/' + Math.round((last_update/1000)), {}, function (data) {
        var num_nodes = data.length;
        for (var i=0; i<num_nodes; i++) {
          q.addEntry(data[i][0], data[i][1], {'perm': data[i][2]}, 'nodes', 'node');
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
  q.registerCatalog('nodes', nodes);
  
  // Register handlers
  q.registerHandler({
    'name': 'View',
    'applicable': function(text, item) {
      return item.information.perm.indexOf('r') >= 0;
    },
    'handler': function(text, item) {
      window.location.href = Drupal.settings.basePath + 'node/' + item.id;
    }
  }, 'node');
  
  q.registerHandler({
    'name': 'Edit',
    'applicable': function(text, item) {
      return item.information.perm.indexOf('w') >= 0;
    },
    'handler': function(text, item) {
      window.location.href = Drupal.settings.basePath + 'node/' + item.id + '/edit';
    }
  }, 'node');
  
  q.registerHandler({
    'name': 'Delete',
    'applicable': function(text, item) {
      return item.information.perm.indexOf('r') >= 0;
    },
    'handler': function(text, item) {
      window.location.href = Drupal.settings.basePath + 'node/' + item.id + '/delete';
    }
  }, 'node');
});