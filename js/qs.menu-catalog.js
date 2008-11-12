$(document).bind('quicksilver-init', function(evt, q) {  
  var menu = {
    'update': function(last_update, callback) {
      $.getJSON(Drupal.settings.basePath + 'quicksilver/menu_json', {}, function (data) {
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
    'update_rate': 60000
  };
  
  // Registering catalog
  q.registerCatalog('menu', menu);
  
  // Register handler
  q.registerHandler({
    'name': 'Go to',
    'handler': function(text, item) {
      var path = item.data;
      if (path=='<front>') {
        path = '';
      }
      window.location.href = Drupal.settings.basePath + path;
    }
  }, 'url_data');
});