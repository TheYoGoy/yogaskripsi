<?php

namespace Database\Seeders;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Panggil seeder Anda di sini dalam urutan yang benar (dependencies first)
        $this->call([
            // Setup roles dan permissions terlebih dahulu
            RolePermissionSeeder::class,

            // User seeder (yang akan menggunakan roles dari RolePermissionSeeder)
            UserSeeder::class,                    // ✅ UNCOMMENT INI!

            // Master data
            BrawijayaDigitalPrintSeeder::class,
            //CategorySeeder::class,
            //UnitSeeder::class,
            //SupplierSeeder::class,
            //ProductSeeder::class,

            // Settings dan data lainnya
            //SettingsSeeder::class,

            // Optional: Sample data untuk testing (uncomment jika diperlukan)
            // StockInSeeder::class,
            // StockOutSeeder::class,
            // PurchaseTransactionSeeder::class,
        ]);
    }
}
