<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Category;
use App\Models\Unit;
use App\Models\Supplier;
use App\Models\Product;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class BrawijayaDigitalPrintSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        echo "🏭 Starting Brawijaya Digital Print Seeder...\n";

        // Seed master data only
        $this->seedCategories();
        $this->seedUnits();
        $this->seedSuppliers();
        $this->seedProducts();

        echo "✅ Brawijaya Digital Print Seeder completed successfully!\n";
    }

    private function seedCategories()
    {
        echo "📂 Seeding categories...\n";

        $categories = [
            ['name' => 'Kertas', 'description' => 'Berbagai jenis kertas untuk percetakan digital'],
            ['name' => 'Tinta', 'description' => 'Tinta dan toner untuk printer digital'],
            ['name' => 'Finishing', 'description' => 'Material untuk finishing seperti laminating, jilid'],
            ['name' => 'Media Cetak', 'description' => 'Banner, vinyl, stiker dan media cetak lainnya'],
            ['name' => 'Aksesoris', 'description' => 'Ring binder, folder, amplop dan aksesoris percetakan'],
            ['name' => 'Alat Cetak', 'description' => 'Spare parts dan peralatan mesin cetak'],
        ];

        foreach ($categories as $category) {
            Category::create(array_merge($category, [
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]));
        }
    }

    private function seedUnits()
    {
        echo "📏 Seeding units...\n";

        $units = [
            ['name' => 'Lembar', 'symbol' => 'lbr', 'description' => 'Satuan untuk menghitung per lembar kertas', 'is_active' => true],
            ['name' => 'Rim', 'symbol' => 'rim', 'description' => 'Satuan kertas 500 lembar', 'is_active' => true],
            ['name' => 'Botol', 'symbol' => 'btl', 'description' => 'Satuan untuk tinta refill', 'is_active' => true],
            ['name' => 'Cartridge', 'symbol' => 'cart', 'description' => 'Satuan untuk tinta cartridge', 'is_active' => true],
            ['name' => 'Meter', 'symbol' => 'm', 'description' => 'Satuan untuk banner dan vinyl per meter', 'is_active' => true],
            ['name' => 'Pack', 'symbol' => 'pck', 'description' => 'Satuan untuk kemasan pack', 'is_active' => true],
            ['name' => 'Piece', 'symbol' => 'pcs', 'description' => 'Satuan untuk aksesoris per buah', 'is_active' => true],
            ['name' => 'Roll', 'symbol' => 'roll', 'description' => 'Satuan untuk material dalam bentuk roll', 'is_active' => true],
        ];

        foreach ($units as $unit) {
            Unit::create(array_merge($unit, [
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]));
        }
    }

    private function seedSuppliers()
    {
        echo "🏢 Seeding suppliers...\n";

        $suppliers = [
            ['code' => 'SDP001', 'name' => 'PT Sinar Dunia Printing', 'contact_person' => 'Budi Santoso', 'phone' => '021-5551234', 'email' => 'sales@sinardunia.com', 'address' => 'Jl. Industri Raya No. 45, Jakarta Pusat 10120'],
            ['code' => 'MPI002', 'name' => 'CV Maju Paper Indonesia', 'contact_person' => 'Sari Wulandari', 'phone' => '021-8887654', 'email' => 'order@majupaper.co.id', 'address' => 'Jl. Gatot Subroto Km. 7, Tangerang 15117'],
            ['code' => 'TDS003', 'name' => 'Toko Tinta Digital Sejahtera', 'contact_person' => 'Ahmad Rahman', 'phone' => '0274-556789', 'email' => 'info@tintadigital.com', 'address' => 'Jl. Malioboro No. 123, Yogyakarta 55213'],
            ['code' => 'MGN004', 'name' => 'PT Media Grafika Nusantara', 'contact_person' => 'Lisa Permata', 'phone' => '031-7778888', 'email' => 'sales@mediagrafika.co.id', 'address' => 'Jl. Raya Industri No. 88, Surabaya 60183'],
            ['code' => 'BPS005', 'name' => 'Banner Print Supply', 'contact_person' => 'Riko Sutanto', 'phone' => '022-9991111', 'email' => 'contact@bannersupply.com', 'address' => 'Jl. Cihampelas No. 200, Bandung 40131'],
        ];

        foreach ($suppliers as $supplier) {
            Supplier::create(array_merge($supplier, [
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]));
        }
    }

    private function seedProducts()
    {
        echo "📦 Seeding products...\n";

        $products = [
            // Fast-moving items (high demand)
            ['name' => 'Kertas HVS A4 80gsm', 'code' => 'HVS-A4-80', 'sku' => 'PRD-0001', 'category_id' => 1, 'unit_id' => 2, 'supplier_id' => 2, 'price' => 45000, 'lead_time' => 3, 'daily_usage_rate' => 1.67],
            ['name' => 'Banner Flexi 280gr', 'code' => 'BNR-FLX-280', 'sku' => 'PRD-0007', 'category_id' => 4, 'unit_id' => 5, 'supplier_id' => 5, 'price' => 25000, 'lead_time' => 5, 'daily_usage_rate' => 6.67],
            ['name' => 'Tinta Epson Original Black', 'code' => 'TNT-EPS-BLK', 'sku' => 'PRD-0004', 'category_id' => 2, 'unit_id' => 4, 'supplier_id' => 3, 'price' => 320000, 'lead_time' => 10, 'daily_usage_rate' => 0.5],

            // Medium-moving items
            ['name' => 'Kertas Art Paper A3 150gsm', 'code' => 'ART-A3-150', 'sku' => 'PRD-0002', 'category_id' => 1, 'unit_id' => 2, 'supplier_id' => 2, 'price' => 125000, 'lead_time' => 5, 'daily_usage_rate' => 0.67],
            ['name' => 'Plastik Laminating A4 Glossy', 'code' => 'LAM-A4-GLS', 'sku' => 'PRD-0010', 'category_id' => 3, 'unit_id' => 6, 'supplier_id' => 4, 'price' => 65000, 'lead_time' => 5, 'daily_usage_rate' => 0.83],
            ['name' => 'Vinyl Cutting Putih', 'code' => 'VNL-CUT-WHT', 'sku' => 'PRD-0008', 'category_id' => 4, 'unit_id' => 5, 'supplier_id' => 5, 'price' => 35000, 'lead_time' => 3, 'daily_usage_rate' => 2.67],

            // Slow-moving items (low demand)
            ['name' => 'Kertas Photo Paper A4 Premium', 'code' => 'PHT-A4-PRM', 'sku' => 'PRD-0003', 'category_id' => 1, 'unit_id' => 6, 'supplier_id' => 1, 'price' => 85000, 'lead_time' => 7, 'daily_usage_rate' => 0.27],
            ['name' => 'Tinta Canon Color Set CMYK', 'code' => 'TNT-CAN-CMYK', 'sku' => 'PRD-0005', 'category_id' => 2, 'unit_id' => 6, 'supplier_id' => 3, 'price' => 450000, 'lead_time' => 10, 'daily_usage_rate' => 0.2],
            ['name' => 'Spiral Binding Putih 8mm', 'code' => 'SPR-WHT-8MM', 'sku' => 'PRD-0011', 'category_id' => 3, 'unit_id' => 6, 'supplier_id' => 4, 'price' => 45000, 'lead_time' => 3, 'daily_usage_rate' => 0.4],
            ['name' => 'Ring Binder A4 2 Ring', 'code' => 'RNG-A4-2R', 'sku' => 'PRD-0012', 'category_id' => 3, 'unit_id' => 7, 'supplier_id' => 4, 'price' => 15000, 'lead_time' => 2, 'daily_usage_rate' => 0.33],
            ['name' => 'Amplop Putih A4', 'code' => 'AMP-A4-WHT', 'sku' => 'PRD-0013', 'category_id' => 5, 'unit_id' => 6, 'supplier_id' => 2, 'price' => 25000, 'lead_time' => 2, 'daily_usage_rate' => 0.5],
            ['name' => 'Clear Folder A4', 'code' => 'CLR-FLD-A4', 'sku' => 'PRD-0014', 'category_id' => 5, 'unit_id' => 6, 'supplier_id' => 4, 'price' => 35000, 'lead_time' => 3, 'daily_usage_rate' => 0.27],
            ['name' => 'Business Card Holder', 'code' => 'BCH-CRD-HLD', 'sku' => 'PRD-0015', 'category_id' => 5, 'unit_id' => 7, 'supplier_id' => 4, 'price' => 18000, 'lead_time' => 4, 'daily_usage_rate' => 0.17],
        ];

        foreach ($products as $productData) {
            Product::create(array_merge($productData, [
                'current_stock' => 0, // Start with zero stock
                'description' => "Produk untuk percetakan digital",
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]));
        }
    }
}