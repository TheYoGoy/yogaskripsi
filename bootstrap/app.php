<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Console\Scheduling\Schedule;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // INERTIA MIDDLEWARE
        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
        ]);

        // Custom middleware aliases
        $middleware->alias([
            'check.role' => \App\Http\Middleware\CheckRole::class,
            'check.permission' => \App\Http\Middleware\CheckPermission::class,
            'role' => \Spatie\Permission\Middleware\RoleMiddleware::class,
            'permission' => \Spatie\Permission\Middleware\PermissionMiddleware::class,
            'role_or_permission' => \Spatie\Permission\Middleware\RoleOrPermissionMiddleware::class,
        ]);
    })
    ->withSchedule(function (Schedule $schedule) {
        // Cek low stock setiap 4 jam
        $schedule->command('stock:check-low')
            ->everyFourHours()
            ->withoutOverlapping();
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
