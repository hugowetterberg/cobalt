$(document).bind('cobalt-load', function(evt, cobalt) {  
  var plugin = {
    'version': 0,
    'catalogs': {},
    'handlers': []
  };
  
  plugin['catalogs']['vocabularies'] = {
    'update': function(last_update, callback) {
      $.getJSON(Drupal.settings.basePath + 'cobalt/data/taxonomy_json', {}, function (data) {
       cobalt.emptyCatalog('vocabularies');
        var access = data.access ? 'w' : '';
        for (var id in data.vocabularies) {
         cobalt.addEntry(id, data.vocabularies[id], access, 'vocabularies', 'vocabulary');
        }
       cobalt.emptyCatalog('terms');
        for (var id in data.terms) {
         cobalt.addEntry(id, data.terms[id][0], {'perm': access, 'vid': data.terms[id][1]}, 'terms', 'term');
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
  
  // Insert empty catalog, the update function is handled for both catalogs in
  // the vocabularies catalog.
  plugin['catalogs']['terms'] = {};
  
  
  // Register handlers
  plugin['handlers'].push({
    'id': 'vocabulary_list',
    'name': 'List terms',
    'data_class': 'vocabulary',
    'applicable': function(text, item) {
      return item.information == 'w';
    },
    'handler': function(text, item) {
      window.location.href = Drupal.settings.basePath + 'admin/content/taxonomy/' + item.id;
    }
  });
  
  plugin['handlers'].push({
    'id': 'vocabulary_edit',
    'name': 'Edit',
    'data_class': 'vocabulary',
    'applicable': function(text, item) {
      return item.information == 'w';
    },
    'handler': function(text, item) {
      window.location.href = Drupal.settings.basePath + 'admin/content/taxonomy/edit/vocabulary/' + item.id + '?destination=' + Drupal.settings.cobalt.path;
    }
  });
  
  plugin['handlers'].push({
    'id': 'vocabulary_add',
    'name': 'Add terms',
    'data_class': 'vocabulary',
    'applicable': function(text, item) {
      return item.information == 'w';
    },
    'handler': function(text, item) {
      window.location.href = Drupal.settings.basePath + 'admin/content/taxonomy/' + item.id + '/add/term';
    }
  });
  
  plugin['handlers'].push({
    'id': 'term_view',
    'name': 'View',
    'data_class': 'term',
    'handler': function(text, item) {
      window.location.href = Drupal.settings.basePath + 'taxonomy/term/' + item.id;
    }
  });
  
  plugin['handlers'].push({
    'id': 'term_edit',
    'name': 'Edit',
    'data_class': 'term',
    'applicable': function(text, item) {
      return item.information.perm == 'w';
    },
    'handler': function(text, item) {
      window.location.href = Drupal.settings.basePath + 'admin/content/taxonomy/edit/term/' + item.id + '?destination=' + Drupal.settings.cobalt.path;
    }
  });
  
  cobalt.registerPlugin('cobalt_taxonomy', plugin);
});

