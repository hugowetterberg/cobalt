var sample_ac = [
  'aliquam', 'tortor', 'nisl', 'lobortis at', 'semper vitae', 'gravida ut', 'est', 'praesent ut', 'justo quis', 
  'magna auctor', 'sollicitudin', 'duis auctor', 'venenatis tortor', 'donec', 'dapibus', 'mi at quam', 
  'nunc pretium', 'eros quis', 'dignissim', 'pharetra', 'velit diam', 'vulputate mi', 'ut euismod', 
  'arcu eros ut metus', 'duis aliquet', 'varius pede'
];


$(document).ready(function(){
  var qs_visible = false;
  $('<div id="qs"><div class="left"><textarea id="qs_input"></textarea></div><div class="right"></div><div class="autocomplete"></div></div>').appendTo('body').hide();
  var qs = $('#qs');
  var qs_input = $('#qs_input');
  
  var toggle = function(arg) {
    if (qs_visible || arg=='hide') {
      qs.hide();
      qs_visible = false;
    }
    else {
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
  
  $(qs).bind('click', function(e){ return false; });
  $(document).bind('click', hide);
  $(document).bind('keydown', 'Alt+space', toggle);
});