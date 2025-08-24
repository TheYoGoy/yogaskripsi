<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Product;
use App\Models\User;
use App\Models\StockIn;
use App\Models\StockOut;
use App\Models\PurchaseTransaction;
use App\Models\Supplier;
use App\Models\Category;
use App\Models\SalesTransaction;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class DashboardController extends Controller
{
    // Cache TTL in minutes
    private const CACHE_TTL = 5;
    private const CHART_CACHE_TTL = 15;

    public function index(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user) {
                Log::warning('DASHBOARD: No authenticated user');
                return redirect()->route('login')
                    ->with('error', 'Silakan login terlebih dahulu.');
            }

            $canAccessDashboard = $this->checkDashboardPermission($user);
            if (!$canAccessDashboard) {
                return redirect()->route('login')
                    ->with('error', 'Anda tidak memiliki izin untuk mengakses dashboard.');
            }

            Log::info('DASHBOARD: Starting dashboard load', [
                'user_id' => $user->id,
                'user_email' => $user->email,
                'timestamp' => now()->toDateTimeString()
            ]);

            $userRole = $this->getUserRole($user);
            $cacheKey = "dashboard_data_{$userRole}_{$user->id}";

            return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($user, $userRole) {
                // ✅ REAL DATA: Get actual data from database
                $lowStockProducts = $this->getLowStockProducts();
                $dashboardData = $this->getDashboardDataByRole($user, $userRole);

                $eoqReminderData = $this->getEOQReminderData();

                $baseData = [
                    'auth' => [
                        'user' => $this->prepareUserData($user),
                    ],
                    'userRole' => $userRole,
                    'userPermissions' => $this->getUserPermissions($user),
                    'lowStockProducts' => $lowStockProducts,
                    'eoqReminderData' => $eoqReminderData,
                ];

                Log::info('DASHBOARD: Sending data to frontend', [
                    'user_id' => $user->id,
                    'role' => $userRole,
                ]);

                return Inertia::render('Dashboard', array_merge($baseData, $dashboardData));
            });
        } catch (\Exception $e) {
            Log::error('DASHBOARD: Error loading dashboard', [
                'user_id' => $request->user() ? $request->user()->id : 'unknown',
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return Inertia::render('Dashboard', [
                'auth' => ['user' => $request->user()],
                'userRole' => 'staff',
                'lowStockProducts' => [],
                'summaryData' => $this->getDefaultSummaryData(),
                'error' => 'Terjadi kesalahan saat memuat dashboard. Silakan refresh halaman.',
            ]);
        }
    }

    /**
     * ✅ FIXED: Check dashboard permission with fallback
     */
    private function checkDashboardPermission($user): bool
    {
        try {
            if (method_exists($user, 'hasPermissionTo')) {
                return $user->hasPermissionTo('view-dashboard');
            }
            return true;
        } catch (\Exception $e) {
            Log::error('DASHBOARD: Error checking permission', ['error' => $e->getMessage()]);
            return true;
        }
    }

    /**
     * ✅ FIXED: Get user role with safe handling
     */
    private function getUserRole($user): string
    {
        try {
            // Method 1: Spatie roles
            if (method_exists($user, 'roles') && $user->roles->count() > 0) {
                $roleName = $user->roles->first()->name;
                return strtolower($roleName);
            }

            // Method 2: Legacy role column
            if (isset($user->role) && !empty($user->role)) {
                return strtolower(trim($user->role));
            }

            return 'staff';
        } catch (\Exception $e) {
            Log::error('DASHBOARD: Error getting user role', [
                'error' => $e->getMessage(),
                'user_id' => $user->id ?? 'unknown'
            ]);
            return 'staff';
        }
    }

    /**
     * ✅ FIXED: Get user permissions with safe handling
     */
    private function getUserPermissions($user): array
    {
        try {
            if (method_exists($user, 'getAllPermissions')) {
                return $user->getAllPermissions()->pluck('name')->toArray();
            }

            $role = $this->getUserRole($user);
            return $this->getBasicPermissionsByRole($role);
        } catch (\Exception $e) {
            Log::error('DASHBOARD: Error getting permissions', ['error' => $e->getMessage()]);
            return ['view-dashboard'];
        }
    }

    /**
     * ✅ FIXED: Basic permissions mapping for fallback
     */
    private function getBasicPermissionsByRole(string $role): array
    {
        $permissions = [
            'admin' => [
                'view-dashboard',
                'view-products',
                'create-products',
                'edit-products',
                'delete-products',
                'view-stock',
                'stock-in',
                'stock-out',
                'view-purchases',
                'approve-purchases',
                'view-reports',
                'export-reports',
                'view-users',
                'view-settings'
            ],
            'manager' => [
                'view-dashboard',
                'view-products',
                'create-products',
                'edit-products',
                'view-stock',
                'stock-in',
                'stock-out',
                'view-purchases',
                'approve-purchases',
                'view-reports',
                'export-reports'
            ],
            'staff' => [
                'view-dashboard',
                'view-products',
                'view-stock',
                'stock-in',
                'stock-out',
                'view-purchases'
            ]
        ];

        return $permissions[$role] ?? $permissions['staff'];
    }

    /**
     * ✅ FIXED: Prepare user data for frontend
     */
    private function prepareUserData($user)
    {
        try {
            $userData = [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'email_verified_at' => $user->email_verified_at,
            ];

            // Add roles array for frontend
            if (method_exists($user, 'roles') && $user->roles) {
                $userData['roles'] = $user->roles->pluck('name')->toArray();
            } else {
                $userData['roles'] = [$this->getUserRole($user)];
            }

            return $userData;
        } catch (\Exception $e) {
            Log::error('DASHBOARD: Error preparing user data', ['error' => $e->getMessage()]);
            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'roles' => ['staff'],
            ];
        }
    }

    /**
     * ✅ REAL DATA: Get dashboard data based on user role
     */
    private function getDashboardDataByRole($user, $role)
    {
        switch ($role) {
            case 'admin':
                return $this->getAdminDashboardData($user);
            case 'manager':
                return $this->getManagerDashboardData($user);
            case 'staff':
            default:
                return $this->getStaffDashboardData($user);
        }
    }

    /**
     * ✅ REAL DATA: Admin Dashboard Data
     */
    private function getAdminDashboardData($user)
    {
        return [
            'summaryData' => $this->getAdminSummaryData(),
            'chartData' => [
                'stockMovements' => $this->getStockMovementData(),
                'topProducts' => $this->getTopUsedProducts(),
                'purchaseTrend' => $this->getPurchaseTrendData(),
                'stockAnalysis' => $this->getStockAnalysisData(),
                'salesTrend' => $this->getSalesTrendData(),
            ],
            'recentActivity' => $this->getRecentTransactions(10),
            'systemStats' => $this->getSystemStats(),
            'pendingApprovals' => $this->getPendingApprovals(),
            'notifications' => $this->getNotificationsData($user),
        ];
    }

    /**
     * ✅ REAL DATA: Manager Dashboard Data
     */
    private function getManagerDashboardData($user)
    {
        return [
            'summaryData' => $this->getManagerSummaryData(),
            'chartData' => [
                'stockMovements' => $this->getStockMovementData(),
                'topProducts' => $this->getTopUsedProducts(5),
                'stockAnalysis' => $this->getStockAnalysisData(),
                'purchaseTrend' => $this->getPurchaseTrendData(),
            ],
            'pendingApprovals' => $this->getPendingApprovals(),
            'recentActivity' => $this->getRecentTransactions(5),
            'notifications' => $this->getNotificationsData($user),
        ];
    }

    /**
     * ✅ REAL DATA: Staff Dashboard Data
     */
    private function getStaffDashboardData($user)
    {
        return [
            'summaryData' => $this->getStaffSummaryData($user),
            'todayActivity' => $this->getTodayTransactions($user->id),
            'urgentStock' => $this->getUrgentStockForUser(),
            'myTasks' => $this->getUserTasks($user->id),
            'chartData' => [
                'myActivity' => $this->getUserActivityChart($user->id),
                'urgentItems' => $this->getUrgentItemsChart(),
            ],
        ];
    }

    /**
     * ✅ REAL DATA: Get low stock products
     */
    private function getLowStockProducts()
    {
        return Cache::remember('low_stock_products', self::CACHE_TTL, function () {
            return Product::with(['category', 'unit'])
                ->whereColumn('current_stock', '<=', 'rop')
                ->select(['id', 'name', 'current_stock', 'rop', 'sku', 'category_id', 'unit_id'])
                ->orderBy('current_stock', 'asc')
                ->limit(10)
                ->get()
                ->map(function ($product) {
                    return [
                        'id' => $product->id,
                        'name' => $product->name,
                        'sku' => $product->sku,
                        'current_stock' => $product->current_stock,
                        'rop' => $product->rop,
                        'category' => $product->category->name ?? 'N/A',
                        'unit' => $product->unit->name ?? 'pcs',
                        'urgency' => $product->current_stock <= ($product->rop * 0.5) ? 'critical' : 'low',
                    ];
                });
        });
    }

    /**
     * ✅ REAL DATA: Admin Summary Data
     */
    private function getAdminSummaryData()
    {
        return Cache::remember('admin_summary', self::CACHE_TTL, function () {
            $totalProducts = Product::count();
            $lowStockCount = Product::whereColumn('current_stock', '<=', 'rop')->count();
            $monthlyUsage = $this->getMonthlyUsage();
            $monthlyPurchases = $this->getMonthlyPurchaseValue();
            $totalUsers = User::count();
            $totalSuppliers = Supplier::count();
            $pendingPurchases = PurchaseTransaction::where('status', 'pending')->count();
            $totalCategories = Category::count();

            return [
                'totalProducts' => $totalProducts,
                'lowStockCount' => $lowStockCount,
                'monthlyUsage' => $monthlyUsage,
                'monthlyPurchases' => $monthlyPurchases,
                'totalUsers' => $totalUsers,
                'totalSuppliers' => $totalSuppliers,
                'pendingPurchases' => $pendingPurchases,
                'totalCategories' => $totalCategories,
                'inventoryValue' => $this->getTotalInventoryValue(),
                'monthlySales' => $this->getMonthlySalesValue(),
            ];
        });
    }

    /**
     * ✅ REAL DATA: Manager Summary Data
     */
    private function getManagerSummaryData()
    {
        return Cache::remember('manager_summary', self::CACHE_TTL, function () {
            return [
                'totalProducts' => Product::count(),
                'lowStockCount' => Product::whereColumn('current_stock', '<=', 'rop')->count(),
                'monthlyUsage' => $this->getMonthlyUsage(),
                'inventoryValue' => $this->getTotalInventoryValue(),
                'pendingApprovals' => PurchaseTransaction::where('status', 'pending')->count(),
                'usageTrend' => $this->getUsageTrendPercentage(),
                'criticalStock' => Product::whereColumn('current_stock', '<=', DB::raw('rop * 0.5'))->count(),
                'monthlyPurchases' => $this->getMonthlyPurchaseValue(),
            ];
        });
    }

    /**
     * ✅ REAL DATA: Staff Summary Data
     */
    private function getStaffSummaryData($user)
    {
        $userId = $user->id;
        return Cache::remember("staff_summary_{$userId}", self::CACHE_TTL, function () use ($userId) {
            return [
                'todayStockIn' => $this->getTodayStockInByUser($userId),
                'todayStockOut' => $this->getTodayStockOutByUser($userId),
                'urgentItems' => Product::whereColumn('current_stock', '<=', DB::raw('rop * 0.5'))->count(),
                'completedTasks' => $this->getCompletedTasksToday($userId),
                'weeklyTasks' => $this->getWeeklyTasksByUser($userId),
                'assignedProducts' => $this->getAssignedProductsCount($userId),
            ];
        });
    }

    /**
     * ✅ REAL DATA: Get monthly usage from database
     */
    private function getMonthlyUsage()
    {
        try {
            return Cache::remember('monthly_usage_' . Carbon::now()->format('Y_m'), self::CACHE_TTL, function () {
                return StockOut::whereMonth('transaction_date', Carbon::now()->month)
                    ->whereYear('transaction_date', Carbon::now()->year)
                    ->sum('quantity') ?? 0;
            });
        } catch (\Exception $e) {
            Log::error('Get Monthly Usage Error: ' . $e->getMessage());
            return 0;
        }
    }

    /**
     * ✅ REAL DATA: Get monthly purchase value
     */
    private function getMonthlyPurchaseValue()
    {
        try {
            return Cache::remember('monthly_purchase_' . Carbon::now()->format('Y_m'), self::CACHE_TTL, function () {
                return PurchaseTransaction::whereMonth('transaction_date', Carbon::now()->month)
                    ->whereYear('transaction_date', Carbon::now()->year)
                    ->where('status', 'approved')
                    ->sum('total_price') ?? 0;
            });
        } catch (\Exception $e) {
            Log::error('Get Monthly Purchase Value Error: ' . $e->getMessage());
            return 0;
        }
    }

    /**
     * ✅ REAL DATA: Get monthly sales value
     */
    private function getMonthlySalesValue()
    {
        try {
            return Cache::remember('monthly_sales_' . Carbon::now()->format('Y_m'), self::CACHE_TTL, function () {
                return SalesTransaction::whereMonth('transaction_date', Carbon::now()->month)
                    ->whereYear('transaction_date', Carbon::now()->year)
                    ->sum('total_amount') ?? 0;
            });
        } catch (\Exception $e) {
            Log::error('Get Monthly Sales Value Error: ' . $e->getMessage());
            return 0;
        }
    }

    /**
     * ✅ REAL DATA: Get total inventory value
     */
    private function getTotalInventoryValue()
    {
        try {
            return Cache::remember('inventory_value', self::CACHE_TTL, function () {
                return Product::sum(DB::raw('current_stock * COALESCE(purchase_price, 0)')) ?? 0;
            });
        } catch (\Exception $e) {
            Log::error('Get Total Inventory Value Error: ' . $e->getMessage());
            return 0;
        }
    }

    /**
     * ✅ REAL DATA: Get stock movement data for charts
     */
    private function getStockMovementData()
    {
        try {
            $cacheKey = 'stock_movement_' . Carbon::today()->format('Y_m_d');
            return Cache::remember($cacheKey, self::CHART_CACHE_TTL, function () {
                $days = collect();

                for ($i = 6; $i >= 0; $i--) {
                    $date = Carbon::now()->subDays($i);
                    $dateString = $date->format('Y-m-d');

                    $stockIn = StockIn::whereDate('transaction_date', $dateString)->sum('quantity') ?? 0;
                    $stockOut = StockOut::whereDate('transaction_date', $dateString)->sum('quantity') ?? 0;

                    $days->push([
                        'date' => $dateString,
                        'day' => $date->format('D'),
                        'stock_in' => $stockIn,
                        'stock_out' => $stockOut,
                        'net_movement' => $stockIn - $stockOut,
                    ]);
                }

                return $days;
            });
        } catch (\Exception $e) {
            Log::error('Get Stock Movement Data Error: ' . $e->getMessage());
            return collect();
        }
    }

    /**
     * ✅ REAL DATA: Get top used products
     */
    private function getTopUsedProducts($limit = 10)
    {
        try {
            $cacheKey = 'top_products_' . Carbon::now()->format('Y_m');
            return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($limit) {
                return StockOut::select('product_id', DB::raw('SUM(quantity) as total_usage'))
                    ->whereMonth('transaction_date', Carbon::now()->month)
                    ->whereYear('transaction_date', Carbon::now()->year)
                    ->with('product:id,name,sku')
                    ->groupBy('product_id')
                    ->orderBy('total_usage', 'desc')
                    ->limit($limit)
                    ->get()
                    ->map(function ($item) {
                        return [
                            'product_id' => $item->product_id,
                            'product_name' => $item->product->name ?? 'Unknown',
                            'sku' => $item->product->sku ?? 'N/A',
                            'total_usage' => $item->total_usage,
                        ];
                    });
            });
        } catch (\Exception $e) {
            Log::error('Get Top Used Products Error: ' . $e->getMessage());
            return collect();
        }
    }

    /**
     * ✅ REAL DATA: Get purchase trend data
     */
    private function getPurchaseTrendData()
    {
        try {
            return Cache::remember('purchase_trend', self::CHART_CACHE_TTL, function () {
                $months = collect();

                for ($i = 5; $i >= 0; $i--) {
                    $date = Carbon::now()->subMonths($i);
                    $total = PurchaseTransaction::whereYear('transaction_date', $date->year)
                        ->whereMonth('transaction_date', $date->month)
                        ->where('status', 'approved')
                        ->sum('total_price') ?? 0;

                    $months->push([
                        'month' => $date->format('M'),
                        'year' => $date->format('Y'),
                        'total' => $total,
                    ]);
                }

                return $months;
            });
        } catch (\Exception $e) {
            Log::error('Get Purchase Trend Data Error: ' . $e->getMessage());
            return collect();
        }
    }

    /**
     * ✅ REAL DATA: Get stock analysis data
     */
    private function getStockAnalysisData()
    {
        try {
            return Cache::remember('stock_analysis', self::CACHE_TTL, function () {
                return [
                    'overstock' => Product::whereColumn('current_stock', '>', DB::raw('rop * 3'))->count() ?? 0,
                    'normal' => Product::whereColumn('current_stock', '>', 'rop')
                        ->whereColumn('current_stock', '<=', DB::raw('rop * 3'))->count() ?? 0,
                    'low' => Product::whereColumn('current_stock', '<=', 'rop')
                        ->whereColumn('current_stock', '>', DB::raw('rop * 0.5'))->count() ?? 0,
                    'critical' => Product::whereColumn('current_stock', '<=', DB::raw('rop * 0.5'))->count() ?? 0,
                ];
            });
        } catch (\Exception $e) {
            Log::error('Get Stock Analysis Data Error: ' . $e->getMessage());
            return ['overstock' => 0, 'normal' => 0, 'low' => 0, 'critical' => 0];
        }
    }

    /**
     * ✅ REAL DATA: Get sales trend data
     */
    private function getSalesTrendData()
    {
        try {
            return Cache::remember('sales_trend', self::CHART_CACHE_TTL, function () {
                $months = collect();

                for ($i = 5; $i >= 0; $i--) {
                    $date = Carbon::now()->subMonths($i);
                    $total = SalesTransaction::whereYear('transaction_date', $date->year)
                        ->whereMonth('transaction_date', $date->month)
                        ->sum('total_amount') ?? 0;

                    $months->push([
                        'month' => $date->format('M'),
                        'year' => $date->format('Y'),
                        'total' => $total,
                    ]);
                }

                return $months;
            });
        } catch (\Exception $e) {
            Log::error('Get Sales Trend Data Error: ' . $e->getMessage());
            return collect();
        }
    }

    /**
     * ✅ REAL DATA: Get recent transactions
     */
    private function getRecentTransactions($limit = 5)
    {
        try {
            $cacheKey = "recent_transactions_{$limit}";
            return Cache::remember($cacheKey, 3, function () use ($limit) {
                $stockIns = StockIn::with(['product:id,name,sku', 'user:id,name'])
                    ->select('id', 'product_id', 'quantity', 'transaction_date', 'user_id', 'supplier')
                    ->latest('transaction_date')
                    ->limit($limit)
                    ->get()
                    ->map(function ($item) {
                        return [
                            'id' => $item->id,
                            'type' => 'stock_in',
                            'product_name' => $item->product->name ?? 'Unknown',
                            'sku' => $item->product->sku ?? 'N/A',
                            'quantity' => $item->quantity,
                            'supplier' => $item->supplier ?? 'N/A',
                            'user_name' => $item->user->name ?? 'Unknown',
                            'date' => $item->transaction_date,
                        ];
                    });

                $stockOuts = StockOut::with(['product:id,name,sku', 'user:id,name'])
                    ->select('id', 'product_id', 'quantity', 'transaction_date', 'user_id', 'customer')
                    ->latest('transaction_date')
                    ->limit($limit)
                    ->get()
                    ->map(function ($item) {
                        return [
                            'id' => $item->id,
                            'type' => 'stock_out',
                            'product_name' => $item->product->name ?? 'Unknown',
                            'sku' => $item->product->sku ?? 'N/A',
                            'quantity' => $item->quantity,
                            'customer' => $item->customer ?? 'N/A',
                            'user_name' => $item->user->name ?? 'Unknown',
                            'date' => $item->transaction_date,
                        ];
                    });

                return $stockIns->merge($stockOuts)
                    ->sortByDesc('date')
                    ->take($limit)
                    ->values();
            });
        } catch (\Exception $e) {
            Log::error('Get Recent Transactions Error: ' . $e->getMessage());
            return collect();
        }
    }

    // ... (continue with remaining helper methods)

    private function getDefaultSummaryData()
    {
        return [
            'totalProducts' => 0,
            'lowStockCount' => 0,
            'monthlyUsage' => 0,
            'monthlyPurchases' => 0,
            'todayTasks' => 0,
            'todayStockIn' => 0,
            'todayStockOut' => 0,
            'urgentItems' => 0,
        ];
    }

    private function getSystemStats()
    {
        return [
            'active_users' => User::whereDate('updated_at', '>=', Carbon::now()->subDays(7))->count(),
            'total_transactions' => StockIn::count() + StockOut::count(),
            'server_status' => 'online',
        ];
    }

    private function getPendingApprovals()
    {
        return PurchaseTransaction::where('status', 'pending')
            ->with(['user:id,name', 'supplier:id,name'])
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();
    }

    private function getNotificationsData($user)
    {
        return [
            'lowStock' => Product::whereColumn('current_stock', '<=', 'rop')->count(),
            'urgentStock' => Product::whereColumn('current_stock', '<=', DB::raw('rop * 0.5'))->count(),
            'pendingApprovals' => PurchaseTransaction::where('status', 'pending')->count(),
        ];
    }

    private function getTodayStockInByUser($userId)
    {
        return StockIn::whereDate('transaction_date', Carbon::today())
            ->where('user_id', $userId)
            ->sum('quantity') ?? 0;
    }

    private function getTodayStockOutByUser($userId)
    {
        return StockOut::whereDate('transaction_date', Carbon::today())
            ->where('user_id', $userId)
            ->sum('quantity') ?? 0;
    }

    private function getCompletedTasksToday($userId)
    {
        return StockIn::whereDate('transaction_date', Carbon::today())
            ->where('user_id', $userId)
            ->count() +
            StockOut::whereDate('transaction_date', Carbon::today())
            ->where('user_id', $userId)
            ->count();
    }

    private function getWeeklyTasksByUser($userId)
    {
        return StockIn::whereBetween('transaction_date', [Carbon::now()->startOfWeek(), Carbon::now()->endOfWeek()])
            ->where('user_id', $userId)
            ->count() +
            StockOut::whereBetween('transaction_date', [Carbon::now()->startOfWeek(), Carbon::now()->endOfWeek()])
            ->where('user_id', $userId)
            ->count();
    }

    private function getAssignedProductsCount($userId)
    {
        // This could be based on which products the user has interacted with
        return Product::whereHas('stockIns', function ($query) use ($userId) {
            $query->where('user_id', $userId);
        })->orWhereHas('stockOuts', function ($query) use ($userId) {
            $query->where('user_id', $userId);
        })->distinct()->count();
    }

    private function getTodayTransactions($userId = null)
    {
        try {
            $query = StockIn::with(['product:id,name,sku', 'user:id,name'])
                ->whereDate('transaction_date', Carbon::today());

            if ($userId) {
                $query->where('user_id', $userId);
            }

            return $query->latest('transaction_date')->limit(5)->get();
        } catch (\Exception $e) {
            Log::error('Get Today Transactions Error: ' . $e->getMessage());
            return collect();
        }
    }

    private function getUrgentStockForUser()
    {
        return Product::with(['category', 'unit'])
            ->whereColumn('current_stock', '<=', DB::raw('rop * 0.5'))
            ->orderBy('current_stock', 'asc')
            ->limit(5)
            ->select(['id', 'name', 'sku', 'current_stock', 'rop', 'category_id', 'unit_id'])
            ->get();
    }

    private function getUserTasks($userId)
    {
        return [
            'today' => $this->getCompletedTasksToday($userId),
            'week' => $this->getWeeklyTasksByUser($userId),
            'pending' => 0, // Could be implemented based on your task system
        ];
    }

    private function getUserActivityChart($userId)
    {
        $days = collect();
        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::now()->subDays($i);
            $stockIn = StockIn::whereDate('transaction_date', $date)->where('user_id', $userId)->sum('quantity');
            $stockOut = StockOut::whereDate('transaction_date', $date)->where('user_id', $userId)->sum('quantity');

            $days->push([
                'date' => $date->format('Y-m-d'),
                'day' => $date->format('D'),
                'stock_in' => $stockIn,
                'stock_out' => $stockOut,
            ]);
        }
        return $days;
    }

    private function getUrgentItemsChart()
    {
        return [
            'critical' => Product::whereColumn('current_stock', '<=', DB::raw('rop * 0.5'))->count(),
            'low' => Product::whereColumn('current_stock', '<=', 'rop')
                ->whereColumn('current_stock', '>', DB::raw('rop * 0.5'))->count(),
            'normal' => Product::whereColumn('current_stock', '>', 'rop')->count(),
        ];
    }

    private function getUsageTrendPercentage()
    {
        try {
            $currentMonth = $this->getMonthlyUsage();
            $previousMonth = StockOut::whereMonth('transaction_date', Carbon::now()->subMonth()->month)
                ->whereYear('transaction_date', Carbon::now()->subMonth()->year)
                ->sum('quantity') ?? 0;

            if ($previousMonth > 0) {
                return round((($currentMonth - $previousMonth) / $previousMonth) * 100, 1);
            }

            return $currentMonth > 0 ? 100 : 0;
        } catch (\Exception $e) {
            Log::error('Get Usage Trend Percentage Error: ' . $e->getMessage());
            return 0;
        }
    }

    /**
     * Clear dashboard cache
     */
    public function clearCache()
    {
        try {
            Cache::flush();
            return response()->json(['message' => 'Cache cleared successfully']);
        } catch (\Exception $e) {
            Log::error('Clear Cache Error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to clear cache'], 500);
        }
    }

    // API endpoints untuk AJAX calls dari frontend
    public function getSummaryData(Request $request)
    {
        try {
            $user = $request->user();
            $userRole = $this->getUserRole($user);

            switch ($userRole) {
                case 'admin':
                    return response()->json($this->getAdminSummaryData());
                case 'manager':
                    return response()->json($this->getManagerSummaryData());
                case 'staff':
                default:
                    return response()->json($this->getStaffSummaryData($user));
            }
        } catch (\Exception $e) {
            Log::error('Dashboard Summary API Error: ' . $e->getMessage());
            return response()->json(['error' => 'Unable to fetch summary data'], 500);
        }
    }

    public function getChartsData(Request $request)
    {
        try {
            $user = $request->user();
            $userRole = $this->getUserRole($user);

            $data = [
                'stockMovements' => $this->getStockMovementData(),
                'stockAnalysis' => $this->getStockAnalysisData(),
            ];

            if (in_array($userRole, ['admin', 'manager'])) {
                $data['topProducts'] = $this->getTopUsedProducts();
                $data['purchaseTrend'] = $this->getPurchaseTrendData();
            }

            if ($userRole === 'admin') {
                $data['salesTrend'] = $this->getSalesTrendData();
            }

            return response()->json($data);
        } catch (\Exception $e) {
            Log::error('Dashboard Charts API Error: ' . $e->getMessage());
            return response()->json(['error' => 'Unable to fetch charts data'], 500);
        }
    }

    public function getNotifications(Request $request)
    {
        try {
            $user = $request->user();
            return response()->json($this->getNotificationsData($user));
        } catch (\Exception $e) {
            Log::error('Dashboard Notifications API Error: ' . $e->getMessage());
            return response()->json(['error' => 'Unable to fetch notifications'], 500);
        }
    }

    private function getEOQReminderData()
    {
        try {
            Log::info('Fetching EOQ Reminder Data...'); // Debug log

            $data = Product::select([
                'id',
                'name as nama',
                'eoq',
                'current_stock as stok',
                'rop',
                'sku'
            ])
                ->whereNotNull('current_stock')
                ->limit(10) // Ambil 10 produk dulu untuk testing
                ->get()
                ->map(function ($product) {
                    return [
                        'id' => $product->id,
                        'nama' => $product->nama,
                        'eoq' => $product->eoq ?? 0,
                        'stok' => $product->stok ?? 0,
                        'rop' => $product->rop ?? 0,
                        'rekomendasi' => ($product->stok ?? 0) <= ($product->rop ?? 0) ? 'Segera pesan' : 'Stok aman',
                        'status' => ($product->stok ?? 0) <= (($product->rop ?? 0) * 0.5) ? 'critical' : 'safe'
                    ];
                });

            Log::info('EOQ Data Count: ' . $data->count()); // Debug log

            return $data;
        } catch (\Exception $e) {
            Log::error('Get EOQ Reminder Data Error: ' . $e->getMessage());
            return collect();
        }
    }
}
