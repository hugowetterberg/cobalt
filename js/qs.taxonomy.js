$(document).bind('quicksilver-init', function(evt, q) {  
  var taxonomy = {
    'update': function(last_update, callback) {
      $.getJSON(Drupal.settings.basePath + 'quicksilver/data/taxonomy_json', {}, function (data) {
        q.emptyCatalog('vocabularies');
        var access = data.access ? 'w' : '';
        for (var id in data.vocabularies) {
          q.addEntry(id, data.terms[id], access, 'vocabularies', 'vocabulary');
        }
        q.emptyCatalog('terms');
        for (var id in data.terms) {
          q.addEntry(id, data.terms[id][0], {'perm': access, 'vid': data.terms[id][1]}, 'terms', 'term');
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
  q.registerCatalog('vocabularies', taxonomy);
  q.registerCatalog('terms', taxonomy);
  
  // Register handlers
  q.registerHandler({
    'id': 'vocabulary_list',
    'name': 'List terms',
    'applicable': function(text, item) {
      return item.information == 'w';
    },
    'handler': function(text, item) {
      window.location.href = Drupal.settings.basePath + 'admin/content/taxonomy/' + item.id;
    }
  }, 'vocabulary');
  
  q.registerHandler({
    'id': 'vocabulary_edit',
    'name': 'Edit',
    'applicable': function(text, item) {
      return item.information == 'w';
    },
    'handler': function(text, item) {
      window.location.href = Drupal.settings.basePath + 'admin/content/taxonomy/edit/vocabulary/' + item.id;
    }
  }, 'vocabulary');
  
  q.registerHandler({
    'id': 'vocabulary_add',
    'name': 'Add terms',
    'applicable': function(text, item) {
      return item.information == 'w';
    },
    'handler': function(text, item) {
      window.location.href = Drupal.settings.basePath + 'admin/content/taxonomy/' + item.id + '/add/term';
    }
  }, 'vocabulary');
  
  q.registerHandler({
    'id': 'term_view',
    'name': 'View',
    'handler': function(text, item) {
      window.location.href = Drupal.settings.basePath + 'taxonomy/term/' + item.id;
    }
  }, 'term');
  
  q.registerHandler({
    'id': 'term_edit',
    'name': 'Edit',
    'applicable': function(text, item) {
      return item.information.perm == 'w';
    },
    'handler': function(text, item) {
      window.location.href = Drupal.settings.basePath + 'admin/content/taxonomy/edit/term/' + item.id;
    }
  }, 'term');
});

