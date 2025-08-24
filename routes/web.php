<?php

use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\Request;
use Inertia\Inertia;

// TAMBAHAN IMPORTS untuk fix "Undefined type 'DB'" error
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Artisan;

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\UnitController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\PurchaseTransactionController;
use App\Http\Controllers\StockInController;
use App\Http\Controllers\StockOutController;
use App\Http\Controllers\EoqRopController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\SettingController;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
*/

// Landing page, bisa diakses semua
Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

// Routes yang memerlukan autentikasi dan verifikasi email
Route::middleware(['auth', 'verified'])->group(function () {

    // Dashboard bisa diakses semua role yang punya permission view-dashboard
    Route::get('/dashboard', [DashboardController::class, 'index'])
        ->middleware('check.permission:view-dashboard')
        ->name('dashboard');

    // Profile dan notifikasi bisa diakses semua role
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // DEBUGGING ROUTES - BREEZE COMPATIBLE
    Route::prefix('debug')->name('debug.')->group(function () {
        Route::get('/user-role', [DashboardController::class, 'debugUserRole'])->name('user-role');

        Route::get('/dashboard-data', function (Request $request) {
            try {
                $user = $request->user();

                if (!$user) {
                    return response()->json(['error' => 'User not authenticated'], 401);
                }

                // Safe Spatie method calls
                $spatieData = [];
                try {
                    $spatieData = [
                        'has_admin_role' => method_exists($user, 'hasRole') ? $user->hasRole('admin') : false,
                        'has_manager_role' => method_exists($user, 'hasRole') ? $user->hasRole('manager') : false,
                        'has_staff_role' => method_exists($user, 'hasRole') ? $user->hasRole('staff') : false,
                        'has_view_dashboard' => method_exists($user, 'hasPermissionTo') ? $user->hasPermissionTo('view-dashboard') : true,
                    ];
                } catch (\Exception $e) {
                    $spatieData = ['spatie_error' => $e->getMessage()];
                }

                $rolesData = [];
                $permissionsData = [];
                try {
                    if (method_exists($user, 'getRoleName')) {
                        $rolesData['primary_role'] = $user->getRoleName();
                    }
                    if (isset($user->roles)) {
                        $rolesData['all_roles'] = $user->roles->pluck('name');
                    }
                    if (method_exists($user, 'getAllPermissions')) {
                        $permissionsData = $user->getAllPermissions()->pluck('name');
                    }
                } catch (\Exception $e) {
                    $rolesData = ['roles_error' => $e->getMessage()];
                    $permissionsData = ['permissions_error' => $e->getMessage()];
                }

                return response()->json([
                    'authenticated' => true,
                    'user' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'roles_data' => $rolesData,
                        'permissions_data' => $permissionsData,
                    ],
                    'spatie_data' => $spatieData,
                ]);
            } catch (\Exception $e) {
                return response()->json([
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ], 500);
            }
        })->name('dashboard-data');

        Route::get('/clear-all-cache', function () {
            try {
                \Illuminate\Support\Facades\Cache::flush();
                \Illuminate\Support\Facades\Artisan::call('cache:clear');
                \Illuminate\Support\Facades\Artisan::call('config:clear');
                \Illuminate\Support\Facades\Artisan::call('view:clear');
                \Illuminate\Support\Facades\Artisan::call('route:clear');

                // Clear Spatie permission cache
                try {
                    app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();
                } catch (\Exception $e) {
                    // Ignore if Spatie not ready
                }

                return response()->json(['message' => 'All caches cleared successfully']);
            } catch (\Exception $e) {
                return response()->json(['error' => 'Failed to clear cache: ' . $e->getMessage()], 500);
            }
        })->name('clear-all-cache');

        Route::get('/user-info', function (Request $request) {
            try {
                $user = $request->user();

                if (!$user) {
                    return response()->json([
                        'authenticated' => false,
                        'error' => 'User not authenticated'
                    ], 401);
                }

                // Safe data collection
                $userInfo = [
                    'id' => $user->id,
                    'email' => $user->email,
                    'name' => $user->name,
                ];

                // Safe Spatie data collection
                try {
                    if (method_exists($user, 'getRoleName')) {
                        $userInfo['primary_role'] = $user->getRoleName();
                    }
                    if (isset($user->roles)) {
                        $userInfo['all_roles'] = $user->roles->pluck('name');
                        $userInfo['roles_count'] = $user->roles->count();
                    }
                    if (method_exists($user, 'getAllPermissions')) {
                        $userInfo['permissions_count'] = $user->getAllPermissions()->count();
                        $userInfo['sample_permissions'] = $user->getAllPermissions()->take(5)->pluck('name');
                    }
                } catch (\Exception $e) {
                    $userInfo['spatie_error'] = $e->getMessage();
                }

                return response()->json([
                    'authenticated' => true,
                    'user_exists' => true,
                    'user_info' => $userInfo,
                    'database_info' => [
                        'roles_table_exists' => \Illuminate\Support\Facades\Schema::hasTable('roles'),
                        'permissions_table_exists' => \Illuminate\Support\Facades\Schema::hasTable('permissions'),
                        'model_has_roles_exists' => \Illuminate\Support\Facades\Schema::hasTable('model_has_roles'),
                    ]
                ]);
            } catch (\Exception $e) {
                return response()->json([
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ], 500);
            }
        })->name('user-info');
    });

    // Notification routes
    Route::prefix('app-notifications')->name('app.notifications.')->group(function () {
        Route::get('/unread', function (Request $request) {
            $user = $request->user();
            if (!$user) return response()->json(['message' => 'Unauthenticated.'], 401);

            $notifications = $user->unreadNotifications()
                ->where('type', 'App\Notifications\LowStockNotification')
                ->get()
                ->map(function ($notification) {
                    if (isset($notification->data['product_id'])) {
                        $product = \App\Models\Product::find($notification->data['product_id']);
                        if ($product) {
                            $notification->data['product'] = $product->only(['id', 'name', 'sku']);
                        }
                    }
                    return $notification;
                });

            return response()->json([
                'notifications' => $notifications,
                'unread_count' => $notifications->count(),
            ]);
        });

        Route::patch('/{notification}/mark-as-read', function (Request $request, $notificationId) {
            $request->user()->notifications()->findOrFail($notificationId)->markAsRead();
            return response()->json(['message' => 'Notification marked as read.']);
        })->name('mark-as-read');

        Route::post('/mark-all-as-read', function (Request $request) {
            $request->user()->unreadNotifications->markAsRead();
            return response()->json(['message' => 'All notifications marked as read.']);
        })->name('mark-all-as-read');
    });

    /*
    |--------------------------------------------------------------------------
    | Routes berdasarkan PERMISSIONS (Spatie Permission System)
    |--------------------------------------------------------------------------
    */

    // User Management dan Settings - hanya admin
    Route::middleware(['check.role:admin'])->group(function () {
        Route::resource('users', UserController::class)
            ->middleware('check.permission:view-users');

        Route::get('/settings', [SettingController::class, 'index'])
            ->middleware('check.permission:view-settings')
            ->name('settings.index');

        Route::post('/settings', [SettingController::class, 'update'])
            ->middleware('check.permission:edit-settings')
            ->name('settings.update');

        Route::post('/settings/update-format', [SettingController::class, 'updateFormat'])
            ->middleware('check.permission:edit-settings')
            ->name('settings.update-format');

        // System management routes
        Route::prefix('system')->name('system.')->group(function () {
            Route::post('/clear-cache', [DashboardController::class, 'clearCache'])
                ->middleware('check.permission:system-configuration')
                ->name('clear-cache');

            Route::post('/clear-all-cache', function () {
                try {
                    \Illuminate\Support\Facades\Artisan::call('cache:clear');
                    \Illuminate\Support\Facades\Artisan::call('config:clear');
                    \Illuminate\Support\Facades\Artisan::call('view:clear');
                    \Illuminate\Support\Facades\Artisan::call('route:clear');

                    try {
                        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();
                    } catch (\Exception $e) {
                        // Ignore if Spatie not ready
                    }

                    return response()->json(['message' => 'All system cache cleared successfully']);
                } catch (\Exception $e) {
                    return response()->json(['error' => 'Failed to clear system cache'], 500);
                }
            })->middleware('check.permission:system-configuration')
                ->name('clear-all-cache');

            Route::get('/info', function () {
                return response()->json([
                    'php_version' => PHP_VERSION,
                    'laravel_version' => \Illuminate\Foundation\Application::VERSION,
                    'environment' => config('app.env'),
                    'debug' => config('app.debug'),
                    'cache_driver' => config('cache.default'),
                    'session_driver' => config('session.driver'),
                ]);
            })->middleware('check.permission:system-configuration')
                ->name('info');
        });
    });

    // Products Management - admin dan manager
    Route::middleware(['check.role:admin|manager'])->group(function () {
        Route::prefix('products')->name('products.')->group(function () {
            // View products
            Route::get('/', [ProductController::class, 'index'])
                ->middleware('check.permission:view-products')
                ->name('index');

            // Create products
            Route::get('/generate-code', [ProductController::class, 'generateCode'])
                ->middleware('check.permission:create-products')
                ->name('generate-code');

            Route::get('/create', [ProductController::class, 'create'])
                ->middleware('check.permission:create-products')
                ->name('create');

            Route::post('/', [ProductController::class, 'store'])
                ->middleware('check.permission:create-products')
                ->name('store');

            // Edit products
            Route::get('/{product}', [ProductController::class, 'show'])
                ->middleware('check.permission:view-products')
                ->name('show');

            Route::get('/{product}/edit', [ProductController::class, 'edit'])
                ->middleware('check.permission:edit-products')
                ->name('edit');

            Route::match(['put', 'patch'], '/{product}', [ProductController::class, 'update'])
                ->middleware('check.permission:edit-products')
                ->name('update');

            // Delete products
            Route::delete('/{product}', [ProductController::class, 'destroy'])
                ->middleware('check.permission:delete-products')
                ->name('destroy');

            Route::post('/bulk-delete', [ProductController::class, 'bulkDelete'])
                ->middleware('check.permission:delete-products')
                ->name('bulk-delete');

            // Barcode - view permission
            Route::get('/{product}/barcode', [ProductController::class, 'showBarcode'])
                ->middleware('check.permission:view-products')
                ->name('barcode');

            Route::get('/{product}/barcode/download', [ProductController::class, 'downloadBarcode'])
                ->middleware('check.permission:view-products')
                ->name('barcode.download');
        });

        // Categories Management
        Route::resource('categories', CategoryController::class)
            ->middleware('check.permission:view-categories');

        Route::post('/categories/bulk-delete', [CategoryController::class, 'bulkDelete'])
            ->middleware('check.permission:delete-categories')
            ->name('categories.bulk-delete');

        // Units Management
        Route::resource('units', UnitController::class)
            ->middleware('check.permission:view-units');

        Route::post('/units/bulk-delete', [UnitController::class, 'bulkDelete'])
            ->middleware('check.permission:delete-units')
            ->name('units.bulk-delete');

        // Suppliers Management
        Route::prefix('suppliers')->name('suppliers.')->group(function () {
            Route::get('/', [SupplierController::class, 'index'])
                ->middleware('check.permission:view-suppliers')
                ->name('index');

            Route::get('/generate-code', [SupplierController::class, 'generateCode'])
                ->middleware('check.permission:create-suppliers')
                ->name('generate-code');

            Route::get('/create', [SupplierController::class, 'create'])
                ->middleware('check.permission:create-suppliers')
                ->name('create');

            Route::post('/', [SupplierController::class, 'store'])
                ->middleware('check.permission:create-suppliers')
                ->name('store');

            Route::get('/{supplier}', [SupplierController::class, 'show'])
                ->middleware('check.permission:view-suppliers')
                ->name('show');

            Route::get('/{supplier}/edit', [SupplierController::class, 'edit'])
                ->middleware('check.permission:edit-suppliers')
                ->name('edit');

            Route::match(['put', 'patch'], '/{supplier}', [SupplierController::class, 'update'])
                ->middleware('check.permission:edit-suppliers')
                ->name('update');

            Route::delete('/{supplier}', [SupplierController::class, 'destroy'])
                ->middleware('check.permission:delete-suppliers')
                ->name('destroy');

            Route::post('/bulk-delete', [SupplierController::class, 'bulkDelete'])
                ->middleware('check.permission:delete-suppliers')
                ->name('bulk-delete');
        });

        // EOQ & ROP - view reports permission
        Route::get('/eoq-rop', [EoqRopController::class, 'index'])
            ->middleware('check.permission:view-advanced-reports')
            ->name('eoq-rop.index');
    });

    // ✅ SIMPLIFIED: REPORTS MANAGEMENT - Auth Only (Fixed 403 Issue)
    Route::prefix('reports')->name('reports.')->group(function () {
        // Report Index - accessible to all authenticated users
        Route::get('/', [ReportController::class, 'index'])->name('index');

        // ✅ STOCK REPORT
        Route::get('/stock', [ReportController::class, 'stockReport'])->name('stock');
        Route::get('/stock/export-pdf', [ReportController::class, 'exportStockPdf'])->name('stock.exportPdf');
        Route::get('/stock/export-excel', [ReportController::class, 'exportStockExcel'])->name('stock.exportExcel');

        // ✅ MUTATION REPORT
        Route::get('/mutation', [ReportController::class, 'mutationReport'])->name('mutation');
        Route::get('/mutation/export-pdf', [ReportController::class, 'exportMutationPdf'])->name('mutation.exportPdf');
        Route::get('/mutation/export-excel', [ReportController::class, 'exportMutationExcel'])->name('mutation.exportExcel');

        // ✅ MINIMUM STOCK REPORT
        Route::get('/minimum-stock', [ReportController::class, 'minimumStockReport'])->name('minimum-stock');
        Route::get('/minimum-stock/export-pdf', [ReportController::class, 'exportMinimumStockPdf'])->name('minimum-stock.exportPdf');
        Route::get('/minimum-stock/export-excel', [ReportController::class, 'exportMinimumStockExcel'])->name('minimum-stock.exportExcel');

        // ✅ PURCHASE HISTORY REPORT
        Route::get('/purchase-history', [ReportController::class, 'purchaseHistoryReport'])->name('purchase-history');
        Route::get('/purchase-history/export-pdf', [ReportController::class, 'exportPurchaseHistoryPdf'])->name('purchase-history.exportPdf');
        Route::get('/purchase-history/export-excel', [ReportController::class, 'exportPurchaseHistoryExcel'])->name('purchase-history.exportExcel');

        // ✅ SALES HISTORY REPORT
        Route::get('/sales-history', [ReportController::class, 'salesHistoryReport'])->name('sales-history');
        Route::get('/sales/export-pdf', [ReportController::class, 'exportSalesHistoryPdf'])->name('sales.exportPdf');
        Route::get('/sales/export-excel', [ReportController::class, 'exportSalesHistoryExcel'])->name('sales.exportExcel');

        // ✅ SUPPLIER REPORT
        Route::get('/suppliers', [ReportController::class, 'supplierReport'])->name('suppliers');
        Route::get('/suppliers/export-pdf', [ReportController::class, 'exportSupplierPdf'])->name('suppliers.exportPdf');
        Route::get('/suppliers/export-excel', [ReportController::class, 'exportSupplierExcel'])->name('suppliers.exportExcel');
    });

    // Stock Management - admin, manager, dan staff
    Route::middleware(['check.permission:view-stock'])->group(function () {
        // Stock In
        Route::resource('stock-ins', StockInController::class)
            ->except(['show', 'edit', 'update'])
            ->middleware('check.permission:stock-in');

        Route::post('stock-ins/bulk-delete', [StockInController::class, 'bulkDelete'])
            ->middleware('check.permission:stock-in')
            ->name('stock-ins.bulk-delete');

        // ✅ TAMBAHKAN ROUTE INI
        Route::get('stock-ins/autofill/{code}', [StockInController::class, 'autofill'])
            ->middleware('check.permission:stock-in')
            ->name('stock-ins.autofill');

        // Stock Out (lanjutkan seperti biasa)
        Route::resource('stock-outs', StockOutController::class)
            ->except(['show', 'edit', 'update'])
            ->middleware('check.permission:stock-out');

        Route::post('stock-outs/bulk-delete', [StockOutController::class, 'bulkDelete'])
            ->middleware('check.permission:stock-out')
            ->name('stock-outs.bulk-delete');
    });

    // Purchase Transactions - admin, manager, staff
    Route::middleware(['check.permission:view-purchases'])->group(function () {
        Route::resource('purchase-transactions', PurchaseTransactionController::class)
            ->except(['show']);

        // Bulk delete
        Route::post('purchase-transactions/bulk-delete', [PurchaseTransactionController::class, 'bulkDelete'])
            ->middleware('check.permission:delete-purchases')
            ->name('purchase-transactions.bulk-delete');

        // Transaction actions
        Route::post('purchase-transactions/{purchase_transaction}/cancel', [PurchaseTransactionController::class, 'cancel'])
            ->middleware('check.permission:edit-purchases')
            ->name('purchase-transactions.cancel');

        Route::post('purchase-transactions/{purchase_transaction}/approve', [PurchaseTransactionController::class, 'approve'])
            ->middleware('check.permission:approve-purchases')
            ->name('purchase-transactions.approve');

        // ✅ FIXED: Print invoice (ubah dari 'print' ke 'printInvoice')
        Route::get('purchase-transactions/{purchase_transaction}/print', [PurchaseTransactionController::class, 'printInvoice'])
            ->middleware('check.permission:view-purchases')
            ->name('purchase-transactions.print');

        // ✅ MISSING: Download invoice
        Route::get('purchase-transactions/{purchase_transaction}/download', [PurchaseTransactionController::class, 'downloadInvoice'])
            ->middleware('check.permission:view-purchases')
            ->name('purchase-transactions.download');

        // ✅ MISSING: Barcode routes
        Route::get('purchase-transactions/{purchase_transaction}/barcode', [PurchaseTransactionController::class, 'barcode'])
            ->middleware('check.permission:view-purchases')
            ->name('purchase-transactions.barcode');

        Route::get('purchase-transactions/{purchase_transaction}/barcode/generate', [PurchaseTransactionController::class, 'generateBarcode'])
            ->middleware('check.permission:view-purchases')
            ->name('purchase-transactions.barcode.generate');

        Route::get('purchase-transactions/{purchase_transaction}/barcode/download', [PurchaseTransactionController::class, 'downloadBarcode'])
            ->middleware('check.permission:view-purchases')
            ->name('purchase-transactions.barcode.download');
    });
    Route::middleware(['check.role:admin|manager'])->group(function () {
        Route::prefix('products')->name('products.')->group(function () {
            // View products
            Route::get('/', [ProductController::class, 'index'])
                ->middleware('check.permission:view-products')
                ->name('index');

            // Create products
            Route::get('/generate-code', [ProductController::class, 'generateCode'])
                ->middleware('check.permission:create-products')
                ->name('generate-code');

            Route::get('/create', [ProductController::class, 'create'])
                ->middleware('check.permission:create-products')
                ->name('create');

            Route::post('/', [ProductController::class, 'store'])
                ->middleware('check.permission:create-products')
                ->name('store');

            // ✅ TAMBAHKAN ROUTE INI - Search by code untuk barcode scanning
            Route::get('/search/{code}', [ProductController::class, 'searchByCode'])
                ->middleware('check.permission:view-products')
                ->name('searchByCode');

            // Edit products
            Route::get('/{product}', [ProductController::class, 'show'])
                ->middleware('check.permission:view-products')
                ->name('show');

            Route::get('/{product}/edit', [ProductController::class, 'edit'])
                ->middleware('check.permission:edit-products')
                ->name('edit');

            Route::match(['put', 'patch'], '/{product}', [ProductController::class, 'update'])
                ->middleware('check.permission:edit-products')
                ->name('update');

            // Delete products
            Route::delete('/{product}', [ProductController::class, 'destroy'])
                ->middleware('check.permission:delete-products')
                ->name('destroy');

            Route::post('/bulk-delete', [ProductController::class, 'bulkDelete'])
                ->middleware('check.permission:delete-products')
                ->name('bulk-delete');

            // Barcode - view permission
            Route::get('/{product}/barcode', [ProductController::class, 'showBarcode'])
                ->middleware('check.permission:view-products')
                ->name('barcode');

            Route::get('/{product}/barcode/download', [ProductController::class, 'downloadBarcode'])
                ->middleware('check.permission:view-products')
                ->name('barcode.download');
        });
    });

    // API routes untuk dashboard data
    Route::prefix('api/dashboard')->name('api.dashboard.')->group(function () {
        Route::get('/summary', [DashboardController::class, 'getSummaryData'])
            ->middleware('check.permission:view-dashboard')
            ->name('summary');

        Route::get('/charts', [DashboardController::class, 'getChartsData'])
            ->middleware('check.permission:view-reports')
            ->name('charts');

        Route::get('/notifications', [DashboardController::class, 'getNotifications'])
            ->middleware('check.permission:view-dashboard')
            ->name('notifications');
    });

    /*
    |--------------------------------------------------------------------------
    | TEST ROUTES - BREEZE COMPATIBLE
    |--------------------------------------------------------------------------
    */

    // Test 1: Basic auth test (tanpa middleware)
    Route::get('/test-auth-basic', function (Request $request) {
        try {
            return response()->json([
                'auth_check' => \Illuminate\Support\Facades\Auth::check(),
                'session_id' => session()->getId(),
                'session_driver' => config('session.driver'),
                'auth_guard' => config('auth.defaults.guard'),
                'auth_model' => config('auth.providers.users.model'),
                'user_count' => \App\Models\User::count(),
                'user_from_request' => $request->user() !== null,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage(),
                'line' => $e->getLine(),
                'file' => $e->getFile(),
            ]);
        }
    });

    // Test 2: Auth dengan middleware (harus login dulu)
    Route::middleware(['auth'])->get('/test-auth-middleware', function (Request $request) {
        try {
            $user = $request->user();

            $roles = [];
            try {
                if ($user && isset($user->roles)) {
                    $roles = $user->roles->pluck('name');
                }
            } catch (\Exception $e) {
                $roles = ['roles_error' => $e->getMessage()];
            }

            return response()->json([
                'success' => 'Auth middleware working!',
                'user_exists' => $user !== null,
                'user_id' => $user ? $user->id : null,
                'user_email' => $user ? $user->email : null,
                'user_name' => $user ? $user->name : null,
                'user_roles' => $roles,
                'auth_methods' => [
                    'request_user' => $request->user() !== null,
                    'auth_facade' => \Illuminate\Support\Facades\Auth::user() !== null,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Auth middleware error',
                'message' => $e->getMessage(),
                'line' => $e->getLine(),
                'file' => $e->getFile(),
            ]);
        }
    });

    // Test 3: Session info
    Route::get('/test-session', function () {
        try {
            return response()->json([
                'session_driver' => config('session.driver'),
                'session_id' => session()->getId(),
                'session_lifetime' => config('session.lifetime'),
                'session_path' => config('session.path'),
                'session_cookie' => config('session.cookie'),
                'session_data_count' => count(session()->all()),
                'has_login_session' => session()->has('login_web_' . sha1(config('app.key'))),
                'auth_session_key' => 'login_web_' . sha1(config('app.key')),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'session_error' => $e->getMessage()
            ]);
        }
    });

    // Test 4: Database connection
    Route::get('/test-database', function () {
        try {
            $connection = DB::connection()->getPdo();
            $users = \App\Models\User::count();

            $sessions = 0;
            try {
                $sessions = DB::table('sessions')->count();
            } catch (\Exception $e) {
                $sessions = 'sessions table not found';
            }

            return response()->json([
                'database_connected' => true,
                'users_count' => $users,
                'sessions_count' => $sessions,
                'connection_name' => config('database.default'),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'database_error' => $e->getMessage()
            ]);
        }
    });

    // Test 5: Spatie permissions test (harus login dulu)
    Route::middleware(['auth'])->get('/test-spatie', function (Request $request) {
        try {
            $user = $request->user();

            if (!$user) {
                return response()->json(['error' => 'Not authenticated']);
            }

            $spatieData = [];
            try {
                $spatieData = [
                    'user_id' => $user->id,
                    'roles_count' => isset($user->roles) ? $user->roles->count() : 0,
                    'roles' => isset($user->roles) ? $user->roles->pluck('name') : [],
                ];

                if (method_exists($user, 'getAllPermissions')) {
                    $spatieData['permissions_count'] = $user->getAllPermissions()->count();
                    $spatieData['sample_permissions'] = $user->getAllPermissions()->take(5)->pluck('name');
                }

                if (method_exists($user, 'hasRole')) {
                    $spatieData['has_admin_role'] = $user->hasRole('admin');
                }

                if (method_exists($user, 'hasPermissionTo')) {
                    $spatieData['has_view_dashboard_permission'] = $user->hasPermissionTo('view-dashboard');
                }

                if (method_exists($user, 'canAccessDashboard')) {
                    $spatieData['can_access_dashboard'] = $user->canAccessDashboard();
                }
            } catch (\Exception $e) {
                $spatieData['spatie_error'] = $e->getMessage();
            }

            return response()->json([
                'spatie_working' => true,
                'spatie_data' => $spatieData,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'spatie_error' => $e->getMessage(),
                'line' => $e->getLine(),
            ]);
        }
    });

    // Test 6: Manual login test (untuk debug)
    Route::get('/test-manual-login', function () {
        try {
            $user = \App\Models\User::first();

            if (!$user) {
                return response()->json(['error' => 'No users found']);
            }

            \Illuminate\Support\Facades\Auth::login($user);

            return response()->json([
                'manual_login' => 'success',
                'logged_in_user' => $user->email,
                'auth_check_after_login' => \Illuminate\Support\Facades\Auth::check(),
                'auth_id_after_login' => \Illuminate\Support\Facades\Auth::id(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'manual_login_error' => $e->getMessage()
            ]);
        }
    });

    // Test 7: Check Spatie data
    Route::get('/check-spatie-data', function () {
        try {
            return response()->json([
                'spatie_status' => [
                    'roles_count' => \Spatie\Permission\Models\Role::count(),
                    'permissions_count' => \Spatie\Permission\Models\Permission::count(),
                    'users_with_roles' => \App\Models\User::whereHas('roles')->count(),
                    'total_users' => \App\Models\User::count(),
                ],
                'sample_data' => [
                    'roles' => \Spatie\Permission\Models\Role::take(3)->pluck('name'),
                    'permissions' => \Spatie\Permission\Models\Permission::take(5)->pluck('name'),
                    'users_with_roles' => \App\Models\User::with('roles')->take(3)->get()->map(function ($user) {
                        return [
                            'id' => $user->id,
                            'email' => $user->email,
                            'roles' => $user->roles->pluck('name'),
                        ];
                    }),
                ],
                'seeder_status' => [
                    'need_to_run_seeder' => \Spatie\Permission\Models\Role::count() === 0,
                    'seeder_command' => 'php artisan db:seed --class=RolePermissionSeeder'
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to check Spatie data',
                'message' => $e->getMessage(),
            ]);
        }
    });

    // Test 8: Permission middleware test
    Route::middleware(['check.permission:view-dashboard'])->get('/test-permission-middleware', function () {
        return response()->json([
            'success' => 'Permission middleware test passed!',
            'message' => 'You have view-dashboard permission',
        ]);
    });

    // ✅ DEBUG ROUTES - Tambahkan setelah routes yang sudah ada
    Route::prefix('debug')->name('debug.')->group(function () {

        // Test data untuk Product Create
        Route::get('/product-create-data', function () {
            try {
                $categories = App\Models\Category::all();
                $units = App\Models\Unit::all();
                $suppliers = App\Models\Supplier::all();

                return response()->json([
                    'success' => true,
                    'timestamp' => now()->toDateTimeString(),
                    'counts' => [
                        'categories_count' => $categories->count(),
                        'units_count' => $units->count(),
                        'suppliers_count' => $suppliers->count(),
                    ],
                    'data' => [
                        'categories' => $categories->toArray(),
                        'units' => $units->toArray(),
                        'suppliers' => $suppliers->toArray(),
                    ],
                    'database_info' => [
                        'categories_table_exists' => Schema::hasTable('categories'),
                        'units_table_exists' => Schema::hasTable('units'),
                        'suppliers_table_exists' => Schema::hasTable('suppliers'),
                        'products_table_exists' => Schema::hasTable('products'),
                    ]
                ]);
            } catch (\Exception $e) {
                return response()->json([
                    'error' => true,
                    'message' => $e->getMessage(),
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                    'trace' => $e->getTraceAsString()
                ]);
            }
        });

        // Test Supplier data specifically
        Route::get('/suppliers-only', function () {
            try {
                $suppliers = App\Models\Supplier::all();

                return response()->json([
                    'success' => true,
                    'suppliers_count' => $suppliers->count(),
                    'suppliers_raw_data' => $suppliers->toArray(),
                    'first_supplier' => $suppliers->first(),
                    'table_exists' => Schema::hasTable('suppliers'),
                    'model_class' => get_class(new App\Models\Supplier),
                ]);
            } catch (\Exception $e) {
                return response()->json([
                    'error' => true,
                    'message' => $e->getMessage(),
                ]);
            }
        });
    });

    // Test 9: Role middleware test
    Route::middleware(['check.role:admin|manager|staff'])->get('/test-role-middleware', function () {
        return response()->json([
            'success' => 'Role middleware test passed!',
            'message' => 'You have access to this route',
        ]);
    });

    // Test 10: Assign test permissions
    Route::middleware(['auth'])->get('/assign-test-permissions', function (Request $request) {
        try {
            $user = $request->user();

            // Check if roles exist
            $adminRole = \Spatie\Permission\Models\Role::where('name', 'admin')->first();
            $staffRole = \Spatie\Permission\Models\Role::where('name', 'staff')->first();

            if (!$adminRole || !$staffRole) {
                return response()->json([
                    'error' => 'Roles not found. Run RolePermissionSeeder first',
                    'roles_count' => \Spatie\Permission\Models\Role::count(),
                    'permissions_count' => \Spatie\Permission\Models\Permission::count(),
                ]);
            }

            // Assign staff role if user has no roles
            if ($user->roles->count() === 0) {
                $user->assignRole('staff');
                $message = 'Assigned staff role to user';
            } else {
                $message = 'User already has roles: ' . $user->roles->pluck('name')->join(', ');
            }

            return response()->json([
                'success' => $message,
                'user_roles' => $user->fresh()->roles->pluck('name'),
                'user_permissions' => $user->fresh()->getAllPermissions()->pluck('name'),
                'next_step' => 'Now test the permission middleware routes'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to assign permissions',
                'message' => $e->getMessage(),
            ]);
        }
    });
});

require __DIR__ . '/auth.php';
