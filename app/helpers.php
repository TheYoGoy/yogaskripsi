<?php

use App\Models\Setting;

if (!function_exists('setting')) {

    function setting($key, $default = null)
    {
        return Setting::get($key, $default);
    }
}

if (!function_exists('setting_bool')) {

    function setting_bool($key, $default = false)
    {
        return Setting::getBool($key, $default);
    }
}

if (!function_exists('setting_int')) {

    function setting_int($key, $default = 0)
    {
        return Setting::getInt($key, $default);
    }
}

if (!function_exists('setting_float')) {

    function setting_float($key, $default = 0.0)
    {
        return Setting::getFloat($key, $default);
    }
}

if (!function_exists('setting_array')) {
}
