$(document).bind('quicksilver-init', function(evt, q) {  
  var get_node_data = function (op, value, callback) {
    $.getJSON(Drupal.settings.basePath + 'quicksilver/data/nodes_' + op + '/' + value, {}, function (data) {
      var num_nodes = data.length;
      for (var i=0; i<num_nodes; i++) {
        q.addEntry(data[i][0], data[i][1], {'perm': data[i][2]}, 'nodes', 'node');
      }
      if (typeof(callback)=='function') {
        callback();
      }
    });
  };
  
  var nodes = {
    'update': function(last_update, callback) {
      get_node_data('update', Math.round((last_update/1000)), function(){ callback(true); });
    },
    'install': function() {
    },
    'uninstall': function() {
    },
    'item_formatter': function(item) {
      return item.name + ' <small>id: ' + item.id + '</small>';
    },
    'update_rate': 300000
  };
  
  // Registering catalog
  q.registerCatalog('nodes', nodes);
  
  // Make sure that we have the current node among our entries, this is a easy
  // way to make sure that we have the nodes the user expects
  if (typeof(Drupal.settings.quicksilver.nodes_current) != 'undefined') {
    var nid = Drupal.settings.quicksilver.nodes_current;
    q.loadEntry('nodes', nid, function(item) {
      if (!item) {
        get_node_data('single', nid);
      }
    });
  }
  
  // Register handlers
  q.registerHandler({
    'id': 'node_view',
    'name': 'View',
    'applicable': function(text, item) {
      return item.information.perm.indexOf('r') >= 0;
    },
    'handler': function(text, item) {
      window.location.href = Drupal.settings.basePath + 'node/' + item.id;
    }
  }, 'node');
  
  q.registerHandler({
    'id': 'node_edit',
    'name': 'Edit',
    'applicable': function(text, item) {
      return item.information.perm.indexOf('w') >= 0;
    },
    'handler': function(text, item) {
      window.location.href = Drupal.settings.basePath + 'node/' + item.id + '/edit';
    }
  }, 'node');
  
  q.registerHandler({
    'id': 'node_delete',
    'name': 'Delete',
    'applicable': function(text, item) {
      return item.information.perm.indexOf('d') >= 0;
    },
    'handler': function(text, item) {
      window.location.href = Drupal.settings.basePath + 'node/' + item.id + '/delete';
    }
  }, 'node');
});