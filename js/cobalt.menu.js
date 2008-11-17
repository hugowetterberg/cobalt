$(document).bind('cobalt-load', function(evt, cobalt) {  
  var plugin = {
    'version': 0,
    'catalogs': {},
    'handlers': []
  };
  
  plugin['catalogs']['menu'] = {
    'update': function(last_update, callback) {
      $.getJSON(Drupal.settings.basePath + 'cobalt/data/menu_json', {}, function (data) {
       cobalt.emptyCatalog('menu');
        for (var id in data) {
         cobalt.addEntry(id, data[id][1], data[id][0], 'menu', 'url_data');
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
  
  plugin['handlers'].push({
    'id': 'menu_goto',
    'name': 'Go to',
    'data_class': 'url_data',
    'handler': function(text, item) {
      var path = item.information;
      if (path=='<front>') {
        path = '';
      }
      window.location.href = Drupal.settings.basePath + path + '?destination=' + Drupal.settings.cobalt.path;
    }
  });
  
  cobalt.registerPlugin('cobalt_menu', plugin);
});