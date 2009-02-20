<?php
// $Id$

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
  drupal_set_message('Cache cleared.');
  drupal_goto();
}

function _cobalt_rebuild_permissions() {
  node_access_rebuild();
  drupal_set_message('Content permissions have been rebuilt.');
  drupal_goto();
}