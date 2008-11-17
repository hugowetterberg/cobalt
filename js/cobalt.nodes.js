$(document).bind('cobalt-load', function(evt, cobalt) {  
  var plugin = {
    'version': 0,
    'catalogs': {},
    'handlers': []
  };
  
  // Utility function for fetching data from the server
  // Used by the updater and the current node check
  var get_node_data = function (op, value, callback) {
    $.getJSON(Drupal.settings.basePath + 'cobalt/data/nodes_' + op + '/' + value, {}, function (data) {
      
      if (typeof(data.nodes)!='undefined') {
        var num_nodes = data.nodes.length;
        for (var i=0; i<num_nodes; i++) {
         cobalt.addEntry(data.nodes[i][0], data.nodes[i][1], {'perm': data.nodes[i][2]}, 'nodes', 'node');
        }
      }
      
      if (typeof(data.deleted)!='undefined') {
        var num_deletes = data.deleted.length;
        for (var i=0; i<num_deletes; i++) {
         cobalt.deleteEntry('nodes', data.deleted[i]);
        }
      }
      
      if (typeof(callback)=='function') {
        callback();
      }
    });
  };
  
  plugin['catalogs']['nodes'] = {
    'update': function(last_update, callback) {
      get_node_data('update', Math.round((last_update/1000)), function(){ callback(true); });
    },
    'install': function() {
    },
    'uninstall': function() {
    },
    'item_formatter': function(item) {
      return item.name + ' <small>node/' + item.id + '</small>';
    },
    'update_rate': 60000
  };
  
  plugin['handlers'].push({
    'id': 'node_view',
    'name': 'View',
    'data_class': 'node',
    'applicable': function(text, item) {
      return item.information.perm.indexOf('r') >= 0;
    },
    'handler': function(text, item) {
      window.location.href = Drupal.settings.basePath + 'cobalt/alias/node/' + item.id;
    }
  });
  
  plugin['handlers'].push({
    'id': 'node_edit',
    'name': 'Edit',
    'data_class': 'node',
    'applicable': function(text, item) {
      return item.information.perm.indexOf('w') >= 0;
    },
    'handler': function(text, item) {
      window.location.href = Drupal.settings.basePath + 'node/' + item.id + '/edit?destination=' + Drupal.settings.cobalt.path;
    }
  });
  
  plugin['handlers'].push({
    'id': 'node_delete',
    'name': 'Delete',
    'data_class': 'node',
    'applicable': function(text, item) {
      return item.information.perm.indexOf('d') >= 0;
    },
    'handler': function(text, item) {
      window.location.href = Drupal.settings.basePath + 'node/' + item.id + '/delete?destination=' + Drupal.settings.cobalt.path;
    }
  });
  
  cobalt.registerPlugin('cobalt_nodes', plugin);
  
  //Run the current-node-check on init
  $(document).bind('cobalt-init', function(evt, q) {  
    // Make sure that we have the current node among our entries, this is a easy
    // way to make sure that we have the nodes the user expects
    if (typeof(Drupal.settings.cobalt.nodes_current) != 'undefined') {
      var nid = Drupal.settings.cobalt.nodes_current;
     cobalt.loadEntry('nodes', nid, function(item) {
        if (!item) {
          get_node_data('single', nid);
        }
      });
    }
  });
});