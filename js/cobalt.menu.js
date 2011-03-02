(function($) {
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
            cobalt.addEntry({id:id, name:data[id][1], extra:data[id][0], information: data[id][0], catalog:'menu', classname:'url_data'});
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

    var uri_from_item = function(item, omitDestination) {
      var path = item.information;
      var destination = Drupal.settings.cobalt.path;
      if (typeof(path) == 'object') {
        destination = path.destination;
        path = path.path;
      }

      if (path=='<front>') {
        path = '';
      }

      if (destination && !omitDestination) {
        path = path + '?destination=' + destination;
      }

      return Drupal.settings.basePath + path;
    };

    plugin['handlers'].push({
      'id': 'menu_goto',
      'name': Drupal.t('Go to and return'),
      'data_class': 'url_data',
      'handler': function(text, item) {
        window.location.href = uri_from_item(item);
      }
    });

    plugin['handlers'].push({
      'id': 'menu_goto_stay',
      'name': Drupal.t('Go to'),
      'data_class': 'url_data',
      'handler': function(text, item) {
        window.location.href = uri_from_item(item, true);
      }
    });

    plugin['handlers'].push({
      'id': 'menu_open_in_new_window',
      'name': Drupal.t('Open in new window'),
      'data_class': 'url_data',
      'handler': function(text, item) {
        var form = document.createElement("form");
        $(form).attr({
          'method': 'GET',
          'action': uri_from_item(item),
          'target': '_blank'
        }).appendTo('body');

        try {
          form.submit();
        }
        catch(e) {
          var message = $('<div></div>');
          message.append('<h1>' + Drupal.t('Could not open window') + '</h1>');
          message.append('<p>' + Drupal.t('You might be using a popup blocker, which stopped Cobalt from opening a new window.') + '</p>');
          cobalt.showHtml(message);
        }

        $(form).remove();
      }
    });

    cobalt.registerPlugin('cobalt_menu', plugin);
  });
})(jQuery);
