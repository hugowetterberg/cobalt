<?php

function quicksilver_js_update() {
  $out = 'This is where the following modules would have been updated: <ul>';
  for ($i=2; arg($i); $i+=3) {
    $module = arg($i);
    $from = arg($i+1);
    $to = arg($i+2);
    $out .= "<li>{$module} from {$from} to {$to}</li>";
  }
  $out .= '</ul>';
  return $out;
}