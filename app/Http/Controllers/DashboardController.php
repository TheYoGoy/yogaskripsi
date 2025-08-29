<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Product;
use App\Models\StockIn;
use App\Models\StockOut;
use App\Models\PurchaseTransaction;
use App\Models\SalesTransaction;
use App\Models\Supplier;
use App\Models\Category;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        try {
            $user = $request->user();
            $userRole = $this->getUserRole($user);

            return Inertia::render('Dashboard', [
                'summaryData' => $this->getSummaryData(),
                'eoqReminderData' => $this->getMinimumStockData(),
                'chartData' => $this->getChartData(),
                'recentActivities' => $this->getRecentMutations(),
                'userRole' => $userRole,
                'auth' => ['user' => $this->prepareUserData($user)],
            ]);
        } catch (\Exception $e) {
            Log::error('Dashboard Error: ' . $e->getMessage());
            return $this->getEmptyDashboard($user);
        }
    }

    /**
     * Summary Data - Using model methods and proper field names
     */
    private function getSummaryData()
    {
        $today = Carbon::today();
        $thisMonth = Carbon::now();

        // Cari data bulan ini dulu
        $monthlyPurchases = PurchaseTransaction::whereMonth('transaction_date', $thisMonth->month)
            ->whereYear('transaction_date', $thisMonth->year)
            ->sum('total_price');

        // Jika bulan ini kosong, ambil dari bulan dengan data terbanyak
        if ($monthlyPurchases == 0) {
            $monthlyPurchases = PurchaseTransaction::selectRaw('YEAR(transaction_date) as year, MONTH(transaction_date) as month, SUM(total_price) as total')
                ->groupBy('year', 'month')
                ->orderBy('total', 'desc')
                ->first()->total ?? 0;
        }

        return [
            'totalProducts' => Product::count(),
            'lowStockCount' => $this->getLowStockCount(),
            'todayStockIn' => $this->getTodayStockIn($today),
            'todayStockOut' => $this->getTodayStockOut($today),
            'monthlyPurchases' => $monthlyPurchases,
            'monthlySales' => $this->getMonthlySalesFromStockOut($thisMonth),
            'monthlyUsage' => $this->getMonthlyUsage($thisMonth),
            'totalSuppliers' => Supplier::count(),
            'urgentItems' => $this->getCriticalItemsCount(),
        ];
    }

    /**
     * Get low stock count using ROP calculations
     */
    private function getLowStockCount()
    {
        $count = 0;
        $products = Product::select(['id', 'current_stock', 'lead_time', 'daily_usage_rate'])->get();

        foreach ($products as $product) {
            if ($product->needsReorder()) {
                $count++;
            }
        }

        return $count;
    }

    /**
     * Get today's stock in with proper date field handling
     */
    private function getTodayStockIn($today)
    {
        return StockIn::where(function ($query) use ($today) {
            $query->whereDate('transaction_date', $today)
                ->orWhereDate('date', $today);
        })->sum('quantity');
    }

    /**
     * Get today's stock out with proper date field handling  
     */
    private function getTodayStockOut($today)
    {
        return StockOut::where(function ($query) use ($today) {
            $query->whereDate('transaction_date', $today)
                ->orWhereDate('date', $today);
        })->sum('quantity');
    }

    /**
     * Get monthly purchases
     */
    private function getMonthlyPurchases($thisMonth)
    {
        return PurchaseTransaction::whereMonth('transaction_date', $thisMonth->month)
            ->whereYear('transaction_date', $thisMonth->year)
            ->sum('total_price');
    }

    /**
     * Get monthly sales
     */
    private function getMonthlySales($thisMonth)
    {
        return SalesTransaction::whereMonth('transaction_date', $thisMonth->month)
            ->whereYear('transaction_date', $thisMonth->year)
            ->sum('total_price');
    }

    /**
     * Get monthly usage (stock out quantity)
     */
    private function getMonthlyUsage($thisMonth)
    {
        return StockOut::where(function ($query) use ($thisMonth) {
            $query->whereMonth('transaction_date', $thisMonth->month)
                ->whereYear('transaction_date', $thisMonth->year)
                ->orWhere(function ($subQuery) use ($thisMonth) {
                    $subQuery->whereMonth('date', $thisMonth->month)
                        ->whereYear('date', $thisMonth->year);
                });
        })->sum('quantity');
    }

    /**
     * Get critical items count using model methods
     */
    private function getCriticalItemsCount()
    {
        $count = 0;
        $products = Product::select(['id', 'current_stock', 'lead_time', 'daily_usage_rate'])->get();

        foreach ($products as $product) {
            $stockStatus = $product->getStockStatus();
            if (in_array($stockStatus['status'], ['critical', 'out_of_stock'])) {
                $count++;
            }
        }

        return $count;
    }

    /**
     * EOQ Reminder Data - Using model ROP/EOQ calculations
     */
    private function getMinimumStockData()
    {
        $products = Product::with(['category', 'unit'])
            ->select(['id', 'name', 'sku', 'code', 'current_stock', 'lead_time', 'daily_usage_rate', 'category_id', 'unit_id'])
            ->get();

        $lowStockProducts = collect();

        foreach ($products as $product) {
            if ($product->needsReorder()) {
                $rop = $product->calculateRop();
                $eoq = $product->calculateEoq();
                $stockStatus = $product->getStockStatus();

                $lowStockProducts->push([
                    'id' => $product->id,
                    'nama' => $product->name,
                    'sku' => $product->sku ?: $product->code,
                    'stok' => $product->current_stock,
                    'rop' => $rop,
                    'eoq' => $eoq,
                    'rekomendasi' => $stockStatus['status'] === 'critical' ? 'Segera pesan' : 'Perlu perhatian',
                    'status' => $stockStatus['status'] === 'critical' ? 'critical' : 'warning',
                ]);
            }
        }

        return $lowStockProducts->sortBy('stok')->take(3)->values();
    }

    /**
     * Chart Data
     */
    private function getChartData()
    {
        return [
            'stockMovements' => $this->getStockMovementData(),
            'topProducts' => $this->getTopProductsData(),
            'purchaseTrend' => $this->getPurchaseTrendData(),
            'stockAnalysis' => $this->getStockAnalysisData(),
        ];
    }

    /**
     * Stock Movement Chart - Using proper date field handling
     */
    private function getStockMovementData()
    {
        $movements = collect();

        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::now()->subDays($i);

            $stockIn = StockIn::where(function ($query) use ($date) {
                $query->whereDate('transaction_date', $date)
                    ->orWhereDate('date', $date);
            })->sum('quantity') ?? 0;

            $stockOut = StockOut::where(function ($query) use ($date) {
                $query->whereDate('transaction_date', $date)
                    ->orWhereDate('date', $date);
            })->sum('quantity') ?? 0;

            $movements->push([
                'date' => $date->format('Y-m-d'),
                'day' => $date->format('D'),
                'stock_in' => $stockIn,
                'stock_out' => $stockOut,
                'net_movement' => $stockIn - $stockOut,
            ]);
        }

        return $movements;
    }

    /**
     * Top Products Data - Using proper date field handling
     */
    private function getTopProductsData()
    {
        $thisMonth = Carbon::now();

        return StockOut::select('product_id', DB::raw('SUM(quantity) as total_usage'))
            ->where(function ($query) use ($thisMonth) {
                $query->whereMonth('transaction_date', $thisMonth->month)
                    ->whereYear('transaction_date', $thisMonth->year)
                    ->orWhere(function ($subQuery) use ($thisMonth) {
                        $subQuery->whereMonth('date', $thisMonth->month)
                            ->whereYear('date', $thisMonth->year);
                    });
            })
            ->with('product:id,name,sku,code')
            ->groupBy('product_id')
            ->orderBy('total_usage', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($item) {
                return [
                    'product_name' => $item->product->name ?? 'Unknown',
                    'sku' => $item->product->sku ?: $item->product->code ?: '',
                    'total_usage' => $item->total_usage,
                ];
            });
    }

    /**
     * Purchase Trend Data
     */
    private function getPurchaseTrendData()
    {
        $trends = collect();

        for ($i = 5; $i >= 0; $i--) {
            $date = Carbon::now()->subMonths($i);

            $total = PurchaseTransaction::whereYear('transaction_date', $date->year)
                ->whereMonth('transaction_date', $date->month)
                ->sum('total_price') ?? 0;

            $trends->push([
                'month' => $date->format('M'),
                'year' => $date->format('Y'),
                'total' => $total,
            ]);
        }

        return $trends;
    }

    /**
     * Stock Analysis - Using model methods for accurate status
     */
    private function getStockAnalysisData()
    {
        $products = Product::select(['id', 'current_stock', 'lead_time', 'daily_usage_rate'])->get();

        $normal = 0;
        $low = 0;
        $critical = 0;

        foreach ($products as $product) {
            $stockStatus = $product->getStockStatus();

            switch ($stockStatus['status']) {
                case 'normal':
                    $normal++;
                    break;
                case 'low':
                case 'medium':
                    $low++;
                    break;
                case 'critical':
                case 'out_of_stock':
                    $critical++;
                    break;
                default:
                    $low++;
                    break;
            }
        }

        return [
            'normal' => $normal,
            'low' => $low,
            'critical' => $critical,
        ];
    }

    /**
     * Recent Mutations - Using proper date and field handling
     */
    private function getRecentMutations()
    {
        $stockIns = StockIn::with(['product:id,name,sku,code', 'user:id,name'])
            ->select(['id', 'product_id', 'quantity', 'supplier', 'transaction_date', 'date', 'user_id'])
            ->orderByRaw('COALESCE(transaction_date, date) DESC')
            ->limit(5)
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'type' => 'stock_in',
                    'product_name' => $item->product->name ?? 'Unknown',
                    'sku' => $item->product->sku ?: $item->product->code ?: '',
                    'quantity' => $item->quantity,
                    'supplier' => $item->supplier ?? '',
                    'user_name' => $item->user->name ?? 'Unknown',
                    'date' => $item->transaction_date ?: $item->date,
                ];
            });

        $stockOuts = StockOut::with(['product:id,name,sku,code', 'user:id,name'])
            ->select(['id', 'product_id', 'quantity', 'customer', 'transaction_date', 'date', 'user_id'])
            ->orderByRaw('COALESCE(transaction_date, date) DESC')
            ->limit(5)
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'type' => 'stock_out',
                    'product_name' => $item->product->name ?? 'Unknown',
                    'sku' => $item->product->sku ?: $item->product->code ?: '',
                    'quantity' => $item->quantity,
                    'customer' => $item->customer ?? '',
                    'user_name' => $item->user->name ?? 'Unknown',
                    'date' => $item->transaction_date ?: $item->date,
                ];
            });

        return $stockIns->merge($stockOuts)
            ->sortByDesc('date')
            ->take(10)
            ->values();
    }

    /**
     * Helper Methods
     */
    private function getUserRole($user): string
    {
        try {
            if (method_exists($user, 'roles') && $user->roles->count() > 0) {
                return strtolower($user->roles->first()->name);
            }

            if (isset($user->role) && !empty($user->role)) {
                return strtolower(trim($user->role));
            }

            return 'staff';
        } catch (\Exception $e) {
            Log::error('Error getting user role: ' . $e->getMessage());
            return 'staff';
        }
    }

    private function prepareUserData($user)
    {
        try {
            $userData = [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'email_verified_at' => $user->email_verified_at,
            ];

            if (method_exists($user, 'roles') && $user->roles) {
                $userData['roles'] = $user->roles->pluck('name')->toArray();
            } else {
                $userData['roles'] = [$this->getUserRole($user)];
            }

            return $userData;
        } catch (\Exception $e) {
            Log::error('Error preparing user data: ' . $e->getMessage());
            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'roles' => ['staff'],
            ];
        }
    }

    private function getEmptyDashboard($user)
    {
        return Inertia::render('Dashboard', [
            'summaryData' => [
                'totalProducts' => 0,
                'lowStockCount' => 0,
                'todayStockIn' => 0,
                'todayStockOut' => 0,
                'monthlyPurchases' => 0,
                'monthlySales' => 0,
                'monthlyUsage' => 0,
                'totalSuppliers' => 0,
                'urgentItems' => 0,
            ],
            'eoqReminderData' => [],
            'chartData' => [
                'stockMovements' => [],
                'topProducts' => [],
                'purchaseTrend' => [],
                'stockAnalysis' => ['normal' => 0, 'low' => 0, 'critical' => 0],
            ],
            'recentActivities' => [],
            'userRole' => 'staff',
            'auth' => ['user' => $user],
            'error' => 'Terjadi kesalahan saat memuat dashboard.',
        ]);
    }

    private function getMonthlySalesFromStockOut($thisMonth)
    {
        // Jika tidak ada tabel sales_transactions, gunakan stock_outs dengan estimasi harga
        return StockOut::join('products', 'stock_outs.product_id', '=', 'products.id')
            ->where(function ($query) use ($thisMonth) {
                $query->whereMonth('stock_outs.transaction_date', $thisMonth->month)
                    ->whereYear('stock_outs.transaction_date', $thisMonth->year)
                    ->orWhere(function ($subQuery) use ($thisMonth) {
                        $subQuery->whereMonth('stock_outs.date', $thisMonth->month)
                            ->whereYear('stock_outs.date', $thisMonth->year);
                    });
            })
            ->sum(DB::raw('stock_outs.quantity * products.price'));
    }
}
