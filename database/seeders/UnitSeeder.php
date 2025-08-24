<?php

namespace Database\Seeders;

use App\Models\Unit;
use Illuminate\Database\Seeder;

class UnitSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $units = [
            ['name' => 'Piece', 'symbol' => 'pcs', 'description' => 'Satuan unit per piece', 'is_active' => true],
            ['name' => 'Kilogram', 'symbol' => 'kg', 'description' => 'Satuan berat dalam kilogram', 'is_active' => true],
            ['name' => 'Gram', 'symbol' => 'g', 'description' => 'Satuan berat dalam gram', 'is_active' => true],
            ['name' => 'Liter', 'symbol' => 'l', 'description' => 'Satuan volume dalam liter', 'is_active' => true],
            ['name' => 'Milliliter', 'symbol' => 'ml', 'description' => 'Satuan volume dalam milliliter', 'is_active' => true],
            ['name' => 'Meter', 'symbol' => 'm', 'description' => 'Satuan panjang dalam meter', 'is_active' => true],
            ['name' => 'Centimeter', 'symbol' => 'cm', 'description' => 'Satuan panjang dalam centimeter', 'is_active' => true],
            ['name' => 'Millimeter', 'symbol' => 'mm', 'description' => 'Satuan panjang dalam millimeter', 'is_active' => true],
            ['name' => 'Box', 'symbol' => 'box', 'description' => 'Satuan unit per box', 'is_active' => true],
            ['name' => 'Pack', 'symbol' => 'pack', 'description' => 'Satuan unit per pack', 'is_active' => true],
            ['name' => 'Dozen', 'symbol' => 'doz', 'description' => 'Satuan unit per dozen', 'is_active' => true],
            ['name' => 'Can', 'symbol' => 'can', 'description' => 'Satuan unit per can', 'is_active' => true],
            ['name' => 'Bottle', 'symbol' => 'btl', 'description' => 'Satuan unit per bottle', 'is_active' => true],
            ['name' => 'Roll', 'symbol' => 'roll', 'description' => 'Satuan unit per roll', 'is_active' => true],
            ['name' => 'Sheet', 'symbol' => 'sht', 'description' => 'Satuan unit per sheet', 'is_active' => true],
            ['name' => 'Set', 'symbol' => 'set', 'description' => 'Satuan unit per set', 'is_active' => true],
            ['name' => 'Bag', 'symbol' => 'bag', 'description' => 'Satuan unit per bag', 'is_active' => true],
            ['name' => 'Tube', 'symbol' => 'tube', 'description' => 'Satuan unit per tube', 'is_active' => true],
            ['name' => 'Pair', 'symbol' => 'pair', 'description' => 'Satuan unit per pair', 'is_active' => true],
            ['name' => 'Bundle', 'symbol' => 'bdl', 'description' => 'Satuan unit per bundle', 'is_active' => true],
            ['name' => 'Jar', 'symbol' => 'jar', 'description' => 'Satuan unit per jar', 'is_active' => true],
            ['name' => 'Carton', 'symbol' => 'ctn', 'description' => 'Satuan unit per carton', 'is_active' => true],
            ['name' => 'Sack', 'symbol' => 'sack', 'description' => 'Satuan unit per sack', 'is_active' => true],
            ['name' => 'Foot', 'symbol' => 'ft', 'description' => 'Satuan panjang dalam foot', 'is_active' => true],
            ['name' => 'Inch', 'symbol' => 'in', 'description' => 'Satuan panjang dalam inch', 'is_active' => true],
        ];

        foreach ($units as $unit) {
            Unit::updateOrCreate(
                ['symbol' => $unit['symbol']],
                $unit
            );
        }
    }
}
