<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Category;
use App\Models\Unit;
use App\Models\Supplier;
use App\Models\Product;
use App\Models\PurchaseTransaction;
use App\Models\StockIn;
use App\Models\StockOut;
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

        // Seed master data
        $this->seedCategories();
        $this->seedUnits();
        $this->seedSuppliers();
        $this->seedProducts();

        // Simulate business operations with realistic calculations
        $this->simulateInventoryOperations();

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
            ['name' => 'Kertas HVS A4 80gsm', 'code' => 'HVS-A4-80', 'sku' => 'PRD-0001', 'category_id' => 1, 'unit_id' => 2, 'supplier_id' => 2, 'price' => 45000, 'lead_time' => 3, 'expected_monthly_demand' => 50],
            ['name' => 'Banner Flexi 280gr', 'code' => 'BNR-FLX-280', 'sku' => 'PRD-0007', 'category_id' => 4, 'unit_id' => 5, 'supplier_id' => 5, 'price' => 25000, 'lead_time' => 5, 'expected_monthly_demand' => 200],
            ['name' => 'Tinta Epson Original Black', 'code' => 'TNT-EPS-BLK', 'sku' => 'PRD-0004', 'category_id' => 2, 'unit_id' => 4, 'supplier_id' => 3, 'price' => 320000, 'lead_time' => 10, 'expected_monthly_demand' => 15],

            // Medium-moving items
            ['name' => 'Kertas Art Paper A3 150gsm', 'code' => 'ART-A3-150', 'sku' => 'PRD-0002', 'category_id' => 1, 'unit_id' => 2, 'supplier_id' => 2, 'price' => 125000, 'lead_time' => 5, 'expected_monthly_demand' => 20],
            ['name' => 'Plastik Laminating A4 Glossy', 'code' => 'LAM-A4-GLS', 'sku' => 'PRD-0010', 'category_id' => 3, 'unit_id' => 6, 'supplier_id' => 4, 'price' => 65000, 'lead_time' => 5, 'expected_monthly_demand' => 25],
            ['name' => 'Vinyl Cutting Putih', 'code' => 'VNL-CUT-WHT', 'sku' => 'PRD-0008', 'category_id' => 4, 'unit_id' => 5, 'supplier_id' => 5, 'price' => 35000, 'lead_time' => 3, 'expected_monthly_demand' => 80],

            // Slow-moving items (low demand)
            ['name' => 'Kertas Photo Paper A4 Premium', 'code' => 'PHT-A4-PRM', 'sku' => 'PRD-0003', 'category_id' => 1, 'unit_id' => 6, 'supplier_id' => 1, 'price' => 85000, 'lead_time' => 7, 'expected_monthly_demand' => 8],
            ['name' => 'Tinta Canon Color Set CMYK', 'code' => 'TNT-CAN-CMYK', 'sku' => 'PRD-0005', 'category_id' => 2, 'unit_id' => 6, 'supplier_id' => 3, 'price' => 450000, 'lead_time' => 10, 'expected_monthly_demand' => 6],
            ['name' => 'Spiral Binding Putih 8mm', 'code' => 'SPR-WHT-8MM', 'sku' => 'PRD-0011', 'category_id' => 3, 'unit_id' => 6, 'supplier_id' => 4, 'price' => 45000, 'lead_time' => 3, 'expected_monthly_demand' => 12],
            ['name' => 'Ring Binder A4 2 Ring', 'code' => 'RNG-A4-2R', 'sku' => 'PRD-0012', 'category_id' => 3, 'unit_id' => 7, 'supplier_id' => 4, 'price' => 15000, 'lead_time' => 2, 'expected_monthly_demand' => 10],
            ['name' => 'Amplop Putih A4', 'code' => 'AMP-A4-WHT', 'sku' => 'PRD-0013', 'category_id' => 5, 'unit_id' => 6, 'supplier_id' => 2, 'price' => 25000, 'lead_time' => 2, 'expected_monthly_demand' => 15],
            ['name' => 'Clear Folder A4', 'code' => 'CLR-FLD-A4', 'sku' => 'PRD-0014', 'category_id' => 5, 'unit_id' => 6, 'supplier_id' => 4, 'price' => 35000, 'lead_time' => 3, 'expected_monthly_demand' => 8],
            ['name' => 'Business Card Holder', 'code' => 'BCH-CRD-HLD', 'sku' => 'PRD-0015', 'category_id' => 5, 'unit_id' => 7, 'supplier_id' => 4, 'price' => 18000, 'lead_time' => 4, 'expected_monthly_demand' => 5],
        ];

        foreach ($products as $productData) {
            $expectedMonthlyDemand = $productData['expected_monthly_demand'];
            unset($productData['expected_monthly_demand']);

            $product = Product::create(array_merge($productData, [
                'current_stock' => 0,
                'daily_usage_rate' => round($expectedMonthlyDemand / 30, 2), // Convert monthly to daily
                'description' => "Produk untuk percetakan digital - Expected demand: {$expectedMonthlyDemand}/month",
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]));

            // Store expected demand for simulation
            $product->expected_monthly_demand = $expectedMonthlyDemand;
        }
    }

    private function simulateInventoryOperations()
    {
        echo "🔄 Simulating realistic inventory operations...\n";

        // Simulate 3 months of operations
        $startDate = Carbon::now()->subMonths(3);
        $currentDate = Carbon::now();

        $products = Product::all();

        foreach ($products as $product) {
            echo "  📦 Simulating operations for: {$product->name}\n";

            $monthlyDemand = $product->expected_monthly_demand;
            $dailyDemand = $monthlyDemand / 30;

            // Calculate initial stock needed (ROP + EOQ logic)
            $leadTime = $product->lead_time;
            $safetyStock = max(5, round($dailyDemand * 2)); // 2 days safety stock
            $initialROP = round($dailyDemand * $leadTime + $safetyStock);
            $initialEOQ = $this->calculateEOQ($dailyDemand * 365);

            // Start with enough stock
            $currentStock = max($initialROP + $initialEOQ, round($monthlyDemand * 1.5));

            // Simulate initial purchase
            $this->createPurchaseTransaction($product, $currentStock, $startDate);
            $this->createStockIn($product, $currentStock, $startDate, 'purchase');

            // Simulate daily operations over 3 months
            $simulationDate = $startDate->copy();
            $totalDaysSimulated = 0;
            $totalStockOut = 0;

            while ($simulationDate->lte($currentDate) && $totalDaysSimulated < 90) {
                // Random daily demand around expected (±30% variation)
                $dailyVariation = rand(70, 130) / 100; // 0.7 to 1.3
                $todayDemand = round($dailyDemand * $dailyVariation);

                // Only create stock out if there's demand and stock available
                if ($todayDemand > 0 && $currentStock > 0) {
                    $actualDemand = min($todayDemand, $currentStock);

                    if ($actualDemand > 0) {
                        $this->createStockOut($product, $actualDemand, $simulationDate);
                        $currentStock -= $actualDemand;
                        $totalStockOut += $actualDemand;
                    }
                }

                // Check if need reorder (when stock hits ROP)
                $currentROP = round($dailyDemand * $leadTime + $safetyStock);
                if ($currentStock <= $currentROP && rand(1, 100) <= 70) { // 70% chance to reorder
                    $orderQuantity = max($initialEOQ, round($monthlyDemand * 0.5));
                    $deliveryDate = $simulationDate->copy()->addDays($leadTime);

                    if ($deliveryDate->lte($currentDate)) {
                        $this->createPurchaseTransaction($product, $orderQuantity, $simulationDate);
                        $this->createStockIn($product, $orderQuantity, $deliveryDate, 'purchase');
                        $currentStock += $orderQuantity;
                    }
                }

                $simulationDate->addDay();
                $totalDaysSimulated++;
            }

            // Update final product data - ONLY business data, no calculations
            $actualDailyUsage = $totalDaysSimulated > 0 ? $totalStockOut / $totalDaysSimulated : $dailyDemand;

            $product->update([
                'current_stock' => $currentStock,
                'daily_usage_rate' => round($actualDailyUsage, 2),
                // NO 'rop' and 'eoq' - let the system calculate these!
            ]);

            // Display calculated values for info (but don't store them)
            $systemROP = $product->calculateRop();
            $systemEOQ = $product->calculateEoq();

            echo "    ✓ Final: Stock={$currentStock}, Daily Use={$actualDailyUsage}, System ROP={$systemROP}, System EOQ={$systemEOQ}\n";
        }
    }

    private function calculateEOQ($annualDemand)
    {
        $orderingCost = 50000; // Rp 50k per order
        $holdingCost = 2000;   // Rp 2k per unit per year

        if ($annualDemand <= 0 || $holdingCost <= 0) {
            return 1;
        }

        return max(1, round(sqrt((2 * $annualDemand * $orderingCost) / $holdingCost)));
    }

    private function createPurchaseTransaction($product, $quantity, $date)
    {
        static $invoiceCounter = 1;

        PurchaseTransaction::create([
            'invoice_number' => 'INV-BDP-' . str_pad($invoiceCounter++, 3, '0', STR_PAD_LEFT),
            'supplier_id' => $product->supplier_id,
            'product_id' => $product->id,
            'quantity' => $quantity,
            'price_per_unit' => $product->price * 0.8, // 20% markup assumed
            'total_price' => $quantity * ($product->price * 0.8),
            'transaction_date' => $date,
            'user_id' => 1,
            'notes' => "Auto-generated purchase based on demand simulation",
            'status' => 'completed',
            'created_at' => $date,
            'updated_at' => $date,
        ]);
    }

    private function createStockIn($product, $quantity, $date, $source = 'purchase')
    {
        static $stockInCounter = 1;

        StockIn::create([
            'code' => 'STI-' . str_pad($stockInCounter++, 3, '0', STR_PAD_LEFT),
            'product_id' => $product->id,
            'quantity' => $quantity,
            'supplier' => $product->supplier->name ?? 'Unknown Supplier',
            'transaction_date' => $date,
            'source' => $source,
            'user_id' => 1,
            'purchase_transaction_id' => $source === 'purchase' ? PurchaseTransaction::latest()->first()->id : null,
            'created_at' => $date,
            'updated_at' => $date,
        ]);
    }

    private function createStockOut($product, $quantity, $date)
    {
        $customers = [
            'PT Maju Berkah Indonesia',
            'CV Sinar Terang',
            'Apotek Sehat Sentosa',
            'Yayasan Pendidikan Harapan',
            'Toko Elektronik Jaya',
            'Studio Foto Memories',
            'Rumah Makan Padang Sederhana',
            'Event Organizer Kreativa',
            null, // Internal use
        ];

        StockOut::create([
            'product_id' => $product->id,
            'quantity' => $quantity,
            'customer' => $customers[array_rand($customers)],
            'date' => $date,
            'user_id' => 1,
            'created_at' => $date,
            'updated_at' => $date,
        ]);
    }
}
