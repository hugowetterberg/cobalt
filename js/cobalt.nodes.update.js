/* Remove this line if you want to try out the updating mechanism
//Sample update script that covers the scenario of a plugin that previously
//have been updated to v.1 but currently is v.2
$(document).bind('cobalt-update', function(evt, cobalt, db, updates) {
  if (typeof(updates['cobaltnodes'])!='undefined') {
    var update = updates.cobaltnodes;
    switch (parseInt(update[0], 10)) {
      case 0:
        db.transaction(function (transaction) {
          //Do some changes needed to upgrade to rev 1
          console.log('Updating to v.1');
         cobalt.updateVersion(transaction, 'cobaltnodes', 1);
        });
      case 1:
        db.transaction(function (transaction) {
          //Do some changes needed to upgrade to rev 2
          console.log('Updating to v.2');
         cobalt.updateVersion(transaction, 'cobaltnodes', 2);
        });
    }
  }
});
//*/