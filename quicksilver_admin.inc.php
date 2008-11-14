<?php

function quicksilver_settings() {
  $form = array();
  
  $form['javascript_includes'] = array(
    '#type' => 'fieldset',
    '#title' => t('Javascript includes'),
  );
  
  $form['javascript_includes']['quicksilver_gears_init'] = array(
    '#type' => 'checkbox',
    '#default_value' => variable_get('quicksilver_gears_init',1),
    '#title' => t('Include the Google Gears init javascript'),
  );
  
  $form['javascript_includes']['quicksilver_jquery_json'] = array(
    '#type' => 'checkbox',
    '#default_value' => variable_get('quicksilver_jquery_json',1),
    '#title' => t('Include the jQuery JSON plugin'),
  );
  
  $form['javascript_includes']['quicksilver_jquery_hotkeys'] = array(
    '#type' => 'checkbox',
    '#default_value' => variable_get('quicksilver_jquery_hotkeys',1),
    '#title' => t('Include the jQuery Hotkeys plugin'),
  );
  
  return system_settings_form($form);
}