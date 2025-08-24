<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Product;
use App\Models\Category;
use App\Models\Unit;
use App\Models\Supplier;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $electronicsCategory = Category::where('name', 'Electronics')->first();
        $foodCategory = Category::where('name', 'Food & Beverages')->first();
        $apparelCategory = Category::where('name', 'Apparel')->first();
        $homeGoodsCategory = Category::where('name', 'Home Goods')->first();
        $officeSuppliesCategory = Category::where('name', 'Office Supplies')->first();

        $pcsUnit = Unit::where('name', 'Piece')->first();
        $kgUnit = Unit::where('name', 'Kilogram')->first();

        $electronicsSupplier = Supplier::where('name', 'PT. Elektronik Maju')->first();
        $foodSupplier = Supplier::where('name', 'CV. Makanan Sehat')->first();
        $apparelSupplier = Supplier::where('name', 'UD. Sandang Jaya')->first();
        $homeGoodsSupplier = Supplier::where('name', 'PT. Rumah Indah')->first();
        $officeSuppliesSupplier = Supplier::where('name', 'Toko ATK Sukses')->first();

        if (
            !$electronicsCategory || !$foodCategory || !$apparelCategory ||
            !$homeGoodsCategory || !$officeSuppliesCategory ||
            !$pcsUnit || !$kgUnit ||
            !$electronicsSupplier || !$foodSupplier || !$apparelSupplier || !$homeGoodsSupplier || !$officeSuppliesSupplier
        ) {
            $this->command->error('Categories, Units, or Suppliers not found. Please run CategorySeeder, UnitSeeder, and SupplierSeeder first.');
            return;
        }

        $products = [
            [
                'category_id' => $electronicsCategory->id,
                'unit_id' => $pcsUnit->id,
                'supplier_id' => $electronicsSupplier->id,
                'name' => 'Gaming Laptop ROG',
                'sku' => 'ELEC-ROG-001',
                'code' => 'PRD-0001',
                'description' => 'High-performance gaming laptop with RTX GPU.',
                'current_stock' => 20,
                'price' => 20000000,
                'lead_time' => 7,
                'daily_usage_rate' => 1,
                'holding_cost_percentage' => 0.1,
                'ordering_cost' => 25000,
            ],
            [
                'category_id' => $electronicsCategory->id,
                'unit_id' => $pcsUnit->id,
                'supplier_id' => $electronicsSupplier->id,
                'name' => 'Wireless Mouse Logitech',
                'sku' => 'ELEC-MOU-002',
                'code' => 'PRD-0002',
                'description' => 'Ergonomic wireless mouse.',
                'current_stock' => 100,
                'price' => 350000,
                'lead_time' => 3,
                'daily_usage_rate' => 2,
                'holding_cost_percentage' => 0.1,
                'ordering_cost' => 25000,
            ],
            [
                'category_id' => $foodCategory->id,
                'unit_id' => $kgUnit->id,
                'supplier_id' => $foodSupplier->id,
                'name' => 'Beras Premium 5kg',
                'sku' => 'FOOD-RICE-003',
                'code' => 'PRD-0003',
                'description' => 'Beras kualitas premium untuk kebutuhan rumah tangga.',
                'current_stock' => 150,
                'price' => 75000,
                'lead_time' => 4,
                'daily_usage_rate' => 5,
                'holding_cost_percentage' => 0.1,
                'ordering_cost' => 25000,
            ],
            [
                'category_id' => $apparelCategory->id,
                'unit_id' => $pcsUnit->id,
                'supplier_id' => $apparelSupplier->id,
                'name' => 'Kaos Polos Hitam',
                'sku' => 'APP-KPS-004',
                'code' => 'PRD-0004',
                'description' => 'Kaos polos warna hitam dengan bahan cotton combed 30s.',
                'current_stock' => 200,
                'price' => 50000,
                'lead_time' => 5,
                'daily_usage_rate' => 3,
                'holding_cost_percentage' => 0.1,
                'ordering_cost' => 25000,
            ],
            [
                'category_id' => $homeGoodsCategory->id,
                'unit_id' => $pcsUnit->id,
                'supplier_id' => $homeGoodsSupplier->id,
                'name' => 'Lampu LED 12W',
                'sku' => 'HOME-LED-005',
                'code' => 'PRD-0005',
                'description' => 'Lampu LED hemat energi untuk penerangan rumah.',
                'current_stock' => 300,
                'price' => 35000,
                'lead_time' => 3,
                'daily_usage_rate' => 4,
                'holding_cost_percentage' => 0.1,
                'ordering_cost' => 25000,
            ],
            [
                'category_id' => $officeSuppliesCategory->id,
                'unit_id' => $pcsUnit->id,
                'supplier_id' => $officeSuppliesSupplier->id,
                'name' => 'Pulpen Hitam',
                'sku' => 'OFF-PEN-006',
                'code' => 'PRD-0006',
                'description' => 'Pulpen tinta gel warna hitam untuk kantor.',
                'current_stock' => 500,
                'price' => 5000,
                'lead_time' => 2,
                'daily_usage_rate' => 6,
                'holding_cost_percentage' => 0.1,
                'ordering_cost' => 25000,
            ],
        ];

        foreach ($products as $productData) {
            $product = Product::create($productData);
            $product->rop = $product->calculateRop();
            $product->eoq = $product->calculateEoq();
            $product->save();
        }

        $this->command->info(count($products) . ' products seeded successfully with supplier, ROP & EOQ calculated.');
    }
}
