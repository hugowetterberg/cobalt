$(document).bind('quicksilver-init', function(evt, q) {  
  var menu = {
    'update': function(callback) {
      $.getJSON('/quicksilver/menu_json', {}, function (data) {
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
    }
  };
  
  // Registering catalog
  q.registerCatalog('menu', menu);
  
  // Register handler
  q.registerHandler({
    'name': 'Go to',
    'handler': function(text, item) {
      window.location.href = Drupal.settings.basePath + item.data;
    }
  }, 'url_data');
});