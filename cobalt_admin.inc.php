<?php

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

  $form['cobalt_shortcuts'] = array(
    '#type' => 'textfield',
    '#default_value' => variable_get('cobalt_shortcuts', 'Alt+space, Ctrl+space'),
    '#title' => t('Shortcuts for activating cobalt'),
    '#description' => t('The shortcuts that can be used to activate Cobalt should be separated by a comma, like this: "Alt+space, Ctrl+space".') . ' ' . l(t('See the live demo for jshotkeys to get some help'), 'http://jshotkeys.googlepages.com/test-static-01.html'),
  );

  $form['javascript_includes'] = array(
    '#type' => 'fieldset',
    '#title' => t('Javascript includes'),
    '#description' => t('All the following libraries are needed for Cobalt to function properly. These options are here if you need Cobalt to play nice with any other modules or themes that use the same javascript libraries.'),
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

function _cobalt_clear_cache() {
  drupal_flush_all_caches();
  drupal_set_message(t('Cache cleared.'));
  drupal_goto();
}

function _cobalt_rebuild_permissions() {
  node_access_rebuild();
  drupal_goto();
}