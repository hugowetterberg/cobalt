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
  
  plugin['handlers'].push({
    'id': 'menu_open_in_new_window',
    'name': 'Open in new window',
    'data_class': 'url_data',
    'handler': function(text, item) {
      var path = item.information;
      if (path=='<front>') {
        path = '';
      }
      
      var form = document.createElement("form");
      $(form).attr({
        'method': 'GET',
        'action': Drupal.settings.basePath + path,
        'target': '_blank'
      }).appendTo('body');
      
      try {
        form.submit();
      }
      catch(e) {
        var message = $('<div></div>');
        message.append('<h1>Could not open window</h1>');
        message.append('<p>You might be using a popup blocker, which stopped Cobalt from opening a new window.</p>');
        cobalt.showHtml(message);
      }
      
      $(form).remove();
    }
  });
  
  cobalt.registerPlugin('cobalt_menu', plugin);
});