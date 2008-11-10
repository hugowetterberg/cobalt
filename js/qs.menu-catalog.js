$(document).bind('quicksilver-init', function(evt, q) {
  console.log('Dummy catalog init');
  
  var menu = {
    'update': function(callback) {
      console.log('Dummy should have updated');
      callback();
    },
    'install': function() {
      console.log('Installing dummy entries');
      for (var i=0; i<sample_ac.length; i++) {
        q.addEntry(sample_ac[i], 'dummy', 'dummy');
      }
    },
    'uninstall': function() {
      console.log('Removing dummy entries');
    }
  };
  
  // Registering catalog
  q.registerCatalog('dummy', dummy);
  
  // Register handler
  q.registerHandler({
    'name': 'Dummy action',
    'handler': function(text, item) {
      dummy_out.text(item.name);
    }
  }, 'dummy');
});