<?php

namespace App\Providers;

use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Models\Product;
//use App\Models\Setting;
use Carbon\Carbon;
use Illuminate\Support\Facades\View;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use Illuminate\Database\Eloquent\Relations\Relation;
use App\Models\User;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
{
    // 🔧 Ini penting untuk polymorphic relation Spatie agar bisa kerja
    Relation::morphMap([
        'users' => User::class,
    ]);

    Vite::prefetch(concurrency: 3);

    if (Schema::hasTable('settings')) {
        $settings = \App\Models\Setting::first();
        Inertia::share('settings', $settings);
    }

    Inertia::share('ropWarnings', function () {
        return Product::whereColumn('current_stock', '<', 'rop')
            ->get(['id', 'name', 'current_stock as stock', 'rop']);
    });
}

}
