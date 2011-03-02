(function($) {
  $(document).bind('cobalt-update', function(evt, cobalt, db, updates) {
    if (typeof(updates['cobalt'])!='undefined') {
      var update = updates.cobalt;
      switch (parseInt(update[0], 10)) {
        case 0:
          // Update to version 1.
          db.transaction(function (transaction) {
            transaction.executeSql('ALTER TABLE entries ADD COLUMN extra TEXT DEFAULT ""', [], function(){}, cobalt.dbErrorHandler);
            transaction.executeSql('ALTER TABLE usage_data ADD COLUMN last INTEGER', [], function(){}, cobalt.dbErrorHandler);
            cobalt.updateVersion(transaction, 'cobalt', 1);
          });
      }
    }
  });
})(jQuery);
