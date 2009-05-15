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
      action_callback({
        'executeSql': function(query, params, callback, on_error) {
          try {
            var res = gears_db.execute(query, params);
            callback(null, wrap_results(res));
          }
          catch (err) {
            if (on_error) {
              on_error(null, err);
            }
          }
        }
      });
    }
  };
}