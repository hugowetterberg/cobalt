$(document).bind('cobalt-load', function(evt, q) {  
  var menu = {
    'update': function(last_update, callback) {
      $.getJSON(Drupal.settings.basePath + 'cobalt/data/menu_json', {}, function (data) {
        q.emptyCatalog('menu');
        for (var id in data) {
          q.addEntry(id, data[id][1], data[id][0], 'menu', 'url_data');
        }
        callback(false);
      });
    },
    'install': function() {
    },
    'uninstall': function() {
    },
    'item_formatter': function(item) {
      return item.name + ' <small>' + item.information + '</small>';
    },
    'update_rate': 60000
  };
  
  q.registerPlugin('cobalt_menu', {'version':0});
  
  // Registering catalog
  q.registerCatalog('menu', menu);
  
  // Register handlers
  q.registerHandler({
    'id': 'menu_goto',
    'name': 'Go to',
    'handler': function(text, item) {
      var path = item.information;
      if (path=='<front>') {
        path = '';
      }
      window.location.href = Drupal.settings.basePath + path + '?destination=' + Drupal.settings.cobalt.path;
    }
  }, 'url_data');
});