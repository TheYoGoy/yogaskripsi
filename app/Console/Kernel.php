<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;
use App\Models\Product;
use App\Models\User;
use App\Notifications\LowStockNotification;
use App\Console\Commands\SendLowStockNotification; // <--- Tambahka

class Kernel extends ConsoleKernel
{
    /**
     * Mendaftarkan custom artisan commands
     */
    protected $commands = [
        \App\Console\Commands\CalculateEoqRop::class,
        SendLowStockNotification::class, // <--- Tambahkan baris ini
    ];

    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule): void
    {
        $schedule->call(function () {
            logger('🔔 Schedule check triggered at ' . now());

            $productsToReorder = Product::whereColumn('current_stock', '<=', 'rop')->get();
            $usersToNotify = User::whereIn('role', ['admin', 'manager'])->get();

            foreach ($productsToReorder as $product) {
                foreach ($usersToNotify as $user) {
                    $user->notify(new LowStockNotification($product));
                }
            }
        })->everyMinute()->withoutOverlapping();
    }

    /**
     * Register the commands for the application.
     */
    protected function commands(): void
    {
        $this->load(__DIR__ . '/Commands');

        require base_path('routes/console.php');
    }

    // app/Http/Kernel.php

    protected $middlewareGroups = [
        'web' => [
            // ... middleware lain ...
            \App\Http\Middleware\HandleInertiaRequests::class,
            \Illuminate\Foundation\Http\Middleware\ConvertEmptyStringsToNull::class,

        ],

        'api' => [
            // ...
        ],
    ];
}
