<?php

function cobalt_js_update() {
  $settings = array();
  $out = 'Updating the following: <ul>';
  for ($i=2; arg($i); $i+=3) {
    $module = arg($i);
    $from = arg($i+1);
    $to = arg($i+2);
    
    $settings[$module] = array($from, $to);
    
    $up_file = drupal_get_path('module', $module) . '/' . $module . '_update.inc.php';
    if (file_exists($up_file)) {
      require_once($up_file);
    }
    
    $up_function = $module . '_cobalt_js_update';
    if (is_callable($up_function)) {
      call_user_func($up_function, $from, $to);
    }
    
    $out .= "<li>{$module} from {$from} to {$to}</li>";
  }
  $out .= '</ul>';
  
  drupal_add_js(array('cobalt'=>array('update'=>$settings)), 'setting');
  return $out;
}