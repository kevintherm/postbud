<?php

declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| Test Case
|--------------------------------------------------------------------------
|
| The closure you provide here will be run before each of your test files.
|
*/

// uses(\PHPUnit\Framework\TestCase::class)->in('Unit', 'Feature');

if (file_exists(__DIR__ . '/../vendor/stout/stout/tests/Pest.php')) {
    require_once __DIR__ . '/../vendor/stout/stout/tests/Pest.php';
}

