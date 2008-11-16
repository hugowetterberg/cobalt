$(document).bind('cobalt-load', function(evt, cobalt) {  
  var taxonomy = {
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
  
 cobalt.registerPlugin('cobalt_taxonomy', {'version':0});
  
  // Registering catalog
 cobalt.registerCatalog('vocabularies', taxonomy);
  // Insert empty catalog, the update function is handled for both catalogs in
  // the vocabularies catalog.
 cobalt.registerCatalog('terms', {});
  
  // Register handlers
 cobalt.registerHandler({
    'id': 'vocabulary_list',
    'name': 'List terms',
    'applicable': function(text, item) {
      return item.information == 'w';
    },
    'handler': function(text, item) {
      window.location.href = Drupal.settings.basePath + 'admin/content/taxonomy/' + item.id;
    }
  }, 'vocabulary');
  
 cobalt.registerHandler({
    'id': 'vocabulary_edit',
    'name': 'Edit',
    'applicable': function(text, item) {
      return item.information == 'w';
    },
    'handler': function(text, item) {
      window.location.href = Drupal.settings.basePath + 'admin/content/taxonomy/edit/vocabulary/' + item.id + '?destination=' + Drupal.settings.cobalt.path;
    }
  }, 'vocabulary');
  
 cobalt.registerHandler({
    'id': 'vocabulary_add',
    'name': 'Add terms',
    'applicable': function(text, item) {
      return item.information == 'w';
    },
    'handler': function(text, item) {
      window.location.href = Drupal.settings.basePath + 'admin/content/taxonomy/' + item.id + '/add/term';
    }
  }, 'vocabulary');
  
 cobalt.registerHandler({
    'id': 'term_view',
    'name': 'View',
    'handler': function(text, item) {
      window.location.href = Drupal.settings.basePath + 'taxonomy/term/' + item.id;
    }
  }, 'term');
  
 cobalt.registerHandler({
    'id': 'term_edit',
    'name': 'Edit',
    'applicable': function(text, item) {
      return item.information.perm == 'w';
    },
    'handler': function(text, item) {
      window.location.href = Drupal.settings.basePath + 'admin/content/taxonomy/edit/term/' + item.id + '?destination=' + Drupal.settings.cobalt.path;
    }
  }, 'term');
});

