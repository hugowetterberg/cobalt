$(document).bind('cobalt-load', function(evt, cobalt) {
  console.log('Dummy catalog init');
  var dummy_out = $('<div class="dummy-result">Dummy results goes here</div>').appendTo('body');
  
  var sample_ac = [
    'aliquam', 'tortor', 'nisl via', 'nisl', 'nisl due', 'lobortis at', 'semper vitae', 'gravida ut', 'est', 'praesent ut', 'justo quis', 
    'magna auctor', 'sollicitudin', 'duis auctor', 'venenatis tortor', 'donec', 'dapibus', 'mi at quam', 
    'nunc pretium', 'eros quis', 'dignissim', 'pharetra', 'velit diam', 'vulputate mi', 'ut euismod', 
    'arcu eros ut metus', 'duis aliquet', 'varius pede'
  ];
  
  var dummy = {
    'update': function(last_updated, callback) {
      console.log('Dummy should have updated');
      callback();
    },
    'install': function() {
      console.log('Installing dummy entries');
      for (var i=0; i<sample_ac.length; i++) {
       cobalt.addEntry({id:i, name:sample_ac[i], information:'', catalog:'dummy', classname:'dummy'});
      }
    },
    'uninstall': function() {
      console.log('Removing dummy entries');
    }
  };
  
  // Registering catalog
 cobalt.registerCatalog('dummy', dummy);
  
  // Register handler
 cobalt.registerHandler({
    'name': 'Dummy action',
    'handler': function(text, item) {
      dummy_out.text(item.name);
    }
  }, 'dummy');
});