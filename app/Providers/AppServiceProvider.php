<?php

namespace App\Providers;

use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Models\Product;
use Carbon\Carbon;
use Illuminate\Support\Facades\View;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use Illuminate\Database\Eloquent\Relations\Relation;
use App\Models\User;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // Polymorphic relation mapping
        Relation::morphMap([
            'users' => User::class,
        ]);

        Vite::prefetch(concurrency: 3);

        // Settings share
        if (Schema::hasTable('settings')) {
            $settings = \App\Models\Setting::first();
            Inertia::share('settings', $settings);
        }

        // Register Observer
        \App\Models\Product::observe(\App\Observers\ProductObserver::class);

        // NOTIFICATIONS - menggunakan data dari database notifications
        // Ganti bagian ropWarnings di AppServiceProvider.php:
        Inertia::share('ropWarnings', function () {
            $user = request()->user();

            if (!$user || !Schema::hasTable('notifications')) {
                return [];
            }

            // Ambil SEMUA notifications (tidak hanya unread)
            return $user->notifications()
                ->where('type', \App\Notifications\LowStockNotification::class)
                ->latest()
                ->take(5)
                ->get()
                ->map(function ($notification) {
                    $data = $notification->data;
                    return [
                        'id' => $notification->id,
                        'product_id' => $data['product_id'],
                        'name' => $data['product_name'],
                        'sku' => $data['product_sku'],
                        'stock' => $data['current_stock'],
                        'rop' => $data['rop'],
                        'urgency_level' => $data['urgency_level'],
                        'urgency_label' => $data['urgency_label'],
                        'color' => $data['color'],
                        'message' => $data['message'],
                        'created_at' => $notification->created_at->diffForHumans(),
                    ];
                });
        });

        Inertia::share('unreadNotificationsCount', function () {
            $user = request()->user();

            if (!$user || !Schema::hasTable('notifications')) {
                return 0;
            }

            return $user->unreadNotifications()
                ->where('type', \App\Notifications\LowStockNotification::class)
                ->count();
        });
    }
}
