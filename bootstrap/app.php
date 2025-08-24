<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // INERTIA MIDDLEWARE - INI YANG KURANG!
        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
        ]);

        // Custom middleware aliases
        $middleware->alias([
            // Custom role/permission middleware (tambahan untuk Spatie)
            'check.role' => \App\Http\Middleware\CheckRole::class,
            'check.permission' => \App\Http\Middleware\CheckPermission::class,

            // Spatie Permission middleware
            'role' => \Spatie\Permission\Middleware\RoleMiddleware::class,
            'permission' => \Spatie\Permission\Middleware\PermissionMiddleware::class,
            'role_or_permission' => \Spatie\Permission\Middleware\RoleOrPermissionMiddleware::class,
        ]);

        // CATATAN: Laravel Breeze sudah handle:
        // - 'auth' middleware
        // - 'guest' middleware  
        // - 'verified' middleware
        // - Web middleware group (session, csrf, etc)
        // Jadi kita tidak perlu define ulang!
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
