var sample_ac = [
  'aliquam', 'tortor', 'nisl', 'lobortis at', 'semper vitae', 'gravida ut', 'est', 'praesent ut', 'justo quis', 
  'magna auctor', 'sollicitudin', 'duis auctor', 'venenatis tortor', 'donec', 'dapibus', 'mi at quam', 
  'nunc pretium', 'eros quis', 'dignissim', 'pharetra', 'velit diam', 'vulputate mi', 'ut euismod', 
  'arcu eros ut metus', 'duis aliquet', 'varius pede'
];


$(document).ready(function(){
  $('<div id="qs"><div class="left"><input type="text" id="qs-input" /></div><div class="right"></div><ul class="qs-autocomplete"></ul></div>').appendTo('body').hide();
  var qs = $('#qs');
  var qs_input = $('#qs-input');
  var qs_ac = $('#qs .qs-autocomplete');
  
  var schedule_lookup, lookup, keypress_reaction, 
      keypress_time = 200,
      last_keypress = 0,
      lookup_pending = false,
      qs_visible = false,
      matches = [], match_idx = 0, current_text;
  
  var keypress_reaction = function() {
    if(qs_input.val()==current_text) {
      return;
    }
    current_text = qs_input.val();
    
    if($.trim(current_text)!='') {
      last_keypress = new Date().getTime();
      schedule_lookup();
    }
    else {
      clear_ac();
    }
  };
  
  var clear_ac = function() {
    match_idx = 0;
    current_text = "";
    qs_ac.empty().hide();
  };
  
  var schedule_lookup = function() {
    var time = new Date().getTime();
    if (!lookup_pending) {
      lookup_pending = true;
      setTimeout(lookup, keypress_time - (time - last_keypress));
    }
  };
  
  var lookup = function() {
    var time = new Date().getTime();
    if (time > keypress_time + last_keypress) {
      lookup_pending = false;
      schedule_lookup();
    }
    else {
      // Dummy lookup process
      matches = [];
      for (var i=0; i<sample_ac.length; i++) {
        if (sample_ac[i].indexOf(current_text)==0) {
          matches.push(sample_ac[i]);
        }
      }
      lookup_finished();
    }
  };
  
  var lookup_finished = function() {
    lookup_pending = false;
    qs_ac.empty();
    
    if (matches.length) {
      for (var i=0; i<matches.length; i++) {
        $('<li class="ac-opt-' + i + '"></li>').text(matches[i]).appendTo(qs_ac);
      }
      qs_ac.show();
    }
    
    ac_select(0);
  };
  
  var ac_select = function(idx) {
    if (idx<0 || idx >= matches.length) {
      return;
    }
    
    $('#qs .ac-opt-' + match_idx).removeClass('active');
    match_idx = idx;
    $('#qs .ac-opt-' + match_idx).addClass('active');
  };
  
  var toggle = function(arg) {
    if (qs_visible || arg=='hide') {
      qs.hide();
      qs_visible = false;
    }
    else {
      clear_ac();
      qs_input.val($.trim(qs_input.val()));
      qs.css({
        'top': $(window).height()/4 + document.body.scrollTop - qs.height()/2,
        'left': $(window).width()/4 - qs.width()/2
      }).show();
      qs_visible = true;
      setTimeout(function(){ qs_input.focus(); qs_input.select(); }, 100);
    }
  };
  
  var hide = function() {
    toggle('hide');
  };
  
  qs.bind('click', function(e){ return false; });
  qs.bind('keydown', 'up', function(){ ac_select(match_idx-1); });
  qs.bind('keydown', 'down', function(){ ac_select(match_idx+1); });
  qs_input.bind('keyup', keypress_reaction);
  
  $(document).bind('click', hide);
  $(document).bind('keydown', 'Alt+space', toggle);
});