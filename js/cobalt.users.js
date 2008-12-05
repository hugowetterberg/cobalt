$(document).bind('cobalt-load', function(evt, cobalt) {
  var plugin = {
    'version': 0,
    'catalogs': {},
    'handlers': []
  };
  
  plugin['catalogs']['users'] = {
    'update': function(last_update, callback) {
      $.getJSON(Drupal.settings.basePath + 'cobalt/data/users_json/' + Math.round((last_update/1000)), {}, function (data) {
        var num_nodes = data.length;
        for (var i=0; i<num_nodes; i++) {
         cobalt.addEntry(data[i][0], data[i][1], {'perm': data[i][2]}, 'users', 'user');
        }
        callback(true);
      });
    },
    'install': function() {
    },
    'uninstall': function() {
    },
    'update_rate': 300000
  };
  
  // Add handlers
  plugin['handlers'].push({
    'id': 'user_view',
    'name': 'View',
    'data_class': 'user',
    'applicable': function(text, item) {
      return item.information.perm.indexOf('r') >= 0;
    },
    'handler': function(text, item) {
      window.location.href = Drupal.settings.basePath + 'user/' + item.id;
    }
  });
  
  plugin['handlers'].push({
    'id': 'user_edit',
    'name': 'Edit',
    'data_class': 'user',
    'applicable': function(text, item) {
      return item.information.perm.indexOf('w') >= 0;
    },
    'handler': function(text, item) {
      window.location.href = Drupal.settings.basePath + 'user/' + item.id + '/edit?destination=' + Drupal.settings.cobalt.path;
    }
  });
  
  plugin['handlers'].push({
    'id': 'user_delete',
    'name': 'Delete',
    'data_class': 'user',
    'applicable': function(text, item) {
      return item.information.perm.indexOf('d') >= 0;
    },
    'handler': function(text, item) {
      window.location.href = Drupal.settings.basePath + 'user/' + item.id + '/delete?destination=' + Drupal.settings.cobalt.path;
    }
  });
  
  cobalt.registerPlugin('cobaltusers', plugin);
});