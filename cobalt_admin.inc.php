<?php
// $Id: cobalt_admin.inc.php,v 1.4 2009/02/20 17:30:14 hugowetterberg Exp $

function cobalt_settings() {
  $form = array();

  $themes = cobalt_themes();
  $theme_options = array();
  foreach ($themes as $key => $info) {
    $theme_options[$key] = $info['name'];
  }

  $form['cobalt_theme'] = array(
    '#type' => 'select',
    '#options' => $theme_options,
    '#default_value' => variable_get('cobalt_theme', ''),
    '#title' => t('Select a theme for cobalt'),
  );

  $form['javascript_includes'] = array(
    '#type' => 'fieldset',
    '#title' => t('Javascript includes'),
  );

  $form['javascript_includes']['cobalt_gears_init'] = array(
    '#type' => 'checkbox',
    '#default_value' => variable_get('cobalt_gears_init', 1),
    '#title' => t('Include the Google Gears init javascript'),
  );

  $form['javascript_includes']['cobalt_jquery_json'] = array(
    '#type' => 'checkbox',
    '#default_value' => variable_get('cobalt_jquery_json', 1),
    '#title' => t('Include the jQuery JSON plugin'),
  );

  $form['javascript_includes']['cobalt_jquery_hotkeys'] = array(
    '#type' => 'checkbox',
    '#default_value' => variable_get('cobalt_jquery_hotkeys', 1),
    '#title' => t('Include the jQuery Hotkeys plugin'),
  );

  return system_settings_form($form);
}