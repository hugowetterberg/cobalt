function gears_db_html5_wrapper(gears_db) {
  var wrap_results = function(res) {
    var items = [];
    var fieldCount = res.fieldCount();
    while (res.isValidRow()) {
      var item = {};
      for (var i=0; i<fieldCount; i++) {
        item[res.fieldName(i)] = res.field(i);
      }
      items.push(item);
      res.next();
    }
    res.close();
    
    return {
      'rows': {
        'length': items.length,
        'item': function(idx) {
          return items[idx];
        }
      }
    };
  };
  
  return {
    'transaction': function(action_callback) {
      var fatal_failure = false;
      
      gears_db.execute('BEGIN');
      
      action_callback({
        'executeSql': function(query, params, callback, on_error) {
          if (fatal_failure) {
            return false;
          }
          
          try {
            var res = wrap_results(gears_db.execute(query, params));
            
            setTimeout(function() {
              callback(null, res);
            }, 1);
            
            return true;
          }
          catch (err) {
            fatal_failure = true;
            if (typeof(on_error)=='function') {
              fatal_failure = on_error(null, err);
            }
            
            if(fatal_failure) {
              gears_db.execute('ROLLBACK');
            }
            return false;
          }
        }
      });
      
      if (!fatal_failure) {
        gears_db.execute('COMMIT');
      }
    }
  };
}