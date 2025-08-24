<?php

// app/Providers/AuthServiceProvider.php
namespace App\Providers;

// Impor semua model dan policy yang relevan
use App\Models\User;
use App\Models\Category;
use App\Models\Unit;
use App\Models\Product;
use App\Models\Supplier;
use App\Models\PurchaseTransaction;
use App\Models\StockIn;
use App\Models\StockOut;

use App\Policies\CategoryPolicy;
use App\Policies\UnitPolicy;
use App\Policies\ProductPolicy;
use App\Policies\SupplierPolicy;
use App\Policies\PurchaseTransactionPolicy;
use App\Policies\StockInPolicy;
use App\Policies\StockOutPolicy;
use App\Policies\UserPolicy; // Untuk manajemen user oleh admin
use App\Policies\EoqRopPolicy;
use App\Policies\ReportPolicy;

use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate; // Untuk Gate 'manage-settings'

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The model to policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        Category::class => CategoryPolicy::class,
        Unit::class => UnitPolicy::class,
        Product::class => ProductPolicy::class,
        Supplier::class => SupplierPolicy::class,
        PurchaseTransaction::class => PurchaseTransactionPolicy::class,
        StockIn::class => StockInPolicy::class,
        StockOut::class => StockOutPolicy::class,
        User::class => UserPolicy::class, // Untuk manajemen user
        // Product::class => EoqRopPolicy::class, // EOQ & ROP policy bisa merujuk ke Product
        // Product::class => ReportPolicy::class, // Report policy bisa merujuk ke Product
        // Catatan: Jika ada dua policy untuk satu model (misal Product),
        // Laravel akan menjalankan keduanya. Lebih baik buat policy spesifik
        // atau gunakan Gate untuk halaman yang tidak terkait langsung dengan CRUD model.
        // Untuk EoqRop dan Report, kita bisa menggunakan satu policy yang merujuk ke Product,
        // atau membuat policy generik jika tidak ada model spesifik.
        // Saya akan menggunakan EoqRopPolicy dan ReportPolicy yang dibuat terpisah
        // dan mengotorisasinya di controller secara manual jika tidak menggunakan authorizeResource.
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        // Daftarkan Gate untuk pengaturan aplikasi
        Gate::define('manage-settings', function (User $user) {
            return $user->isAdmin(); // Hanya Admin yang bisa mengelola pengaturan
        });
    }
}
