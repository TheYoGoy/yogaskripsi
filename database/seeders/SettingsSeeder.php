<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;
use App\Models\Unit; // Import Unit model jika Anda menggunakannya

class SettingsSeeder extends Seeder
{
    public function run(): void
    {
        // Pastikan ada unit default untuk default_unit_id
        $defaultUnit = Unit::first();
        if (!$defaultUnit) {
            // Jika tidak ada unit, buat satu untuk menghindari error foreign key
            $defaultUnit = Unit::firstOrCreate(
                ['name' => 'Piece'],
                ['symbol' => 'pcs', 'description' => 'Default unit']
            );
        }

        // Gunakan firstOrCreate untuk membuat atau memperbarui satu baris pengaturan
        Setting::firstOrCreate(
            [], // Kriteria pencarian kosong, akan selalu menemukan yang pertama atau membuat yang baru
            [
                'company_name' => 'Inventory Management System',
                'company_logo' => null, // Path logo awal, bisa null
                'stock_prefix_in' => 'IN-',
                'stock_prefix_out' => 'OUT-',
                'stock_min_threshold' => 10,
                'default_lead_time' => 7,
                'default_ordering_cost' => 50000,
                'default_holding_cost' => 0.2,
                'default_unit_id' => $defaultUnit->id, // Gunakan ID dari unit yang ada
                'date_format' => 'DD-MM-YYYY',
                'timezone' => 'Asia/Jakarta',
                'dark_mode' => false,
            ]
        );
    }
}
