<?php

use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

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

// Landing page
Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

// Routes untuk semua authenticated users
Route::middleware(['auth', 'verified'])->group(function () {
    
    // Notifications - semua role
    Route::prefix('notifications')->name('notifications.')->group(function () {
        Route::get('/', [App\Http\Controllers\NotificationController::class, 'index'])->name('index');
        Route::patch('/{id}/read', [App\Http\Controllers\NotificationController::class, 'markAsRead'])->name('read');
        Route::patch('/read-all', [App\Http\Controllers\NotificationController::class, 'markAllAsRead'])->name('read-all');
        Route::delete('/{id}', [App\Http\Controllers\NotificationController::class, 'destroy'])->name('destroy');
        Route::get('/unread-count', [App\Http\Controllers\NotificationController::class, 'getUnreadCount'])->name('unread-count');
    });

    // Dashboard - semua role dengan permission
    Route::get('/dashboard', [DashboardController::class, 'index'])
        //->middleware('check.permission:view-dashboard')
        ->name('dashboard');

    // Profile - semua role
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // ==================== STAFF ACCESS ROUTES ====================
    // Products - SEMUA ROLE (staff, manager, admin) dengan permission
    Route::prefix('products')->name('products.')->middleware('check.permission:view-products')->group(function () {
        Route::get('/', [ProductController::class, 'index'])->name('index');
        
        Route::get('/generate-code', [ProductController::class, 'generateCode'])
            ->middleware('check.permission:create-products')->name('generate-code');
        
        Route::get('/search-by-code/{code}', [ProductController::class, 'searchByCode'])->name('searchByCode');
        Route::get('/search-by-code', [ProductController::class, 'searchByCode'])->name('searchByCode.query');
        
        Route::get('/create', [ProductController::class, 'create'])
            ->middleware('check.permission:create-products')->name('create');
        Route::post('/', [ProductController::class, 'store'])
            ->middleware('check.permission:create-products')->name('store');
        
        Route::post('/bulk-delete', [ProductController::class, 'bulkDelete'])
            ->middleware('check.permission:delete-products')->name('bulk-delete');
        
        Route::get('/{product}', [ProductController::class, 'show'])->name('show');
        Route::get('/{product}/edit', [ProductController::class, 'edit'])
            ->middleware('check.permission:edit-products')->name('edit');
        Route::match(['put', 'patch'], '/{product}', [ProductController::class, 'update'])
            ->middleware('check.permission:edit-products')->name('update');
        Route::delete('/{product}', [ProductController::class, 'destroy'])
            ->middleware('check.permission:delete-products')->name('destroy');
        
        // Barcode routes
        Route::get('/{product}/barcode', [ProductController::class, 'barcode'])->name('barcode');
        Route::get('/{product}/generate-barcode', [ProductController::class, 'generateBarcode'])->name('generate-barcode');
        Route::get('/{product}/download-barcode', [ProductController::class, 'downloadBarcode'])->name('download-barcode');
        Route::get('/{product}/generate-qr', [ProductController::class, 'generateQrCode'])->name('generate-qr');
        Route::get('/{product}/download-qr', [ProductController::class, 'downloadQrCode'])->name('download-qr');
    });

    // Purchase Transactions - SEMUA ROLE dengan permission
    Route::middleware(['check.permission:view-purchases'])->group(function () {
        Route::resource('purchase-transactions', PurchaseTransactionController::class)->except(['show']);
        
        Route::post('purchase-transactions/bulk-delete', [PurchaseTransactionController::class, 'bulkDelete'])
            ->middleware('check.permission:delete-purchases')->name('purchase-transactions.bulk-delete');
        
        Route::post('purchase-transactions/{purchase_transaction}/cancel', [PurchaseTransactionController::class, 'cancel'])
            ->middleware('check.permission:edit-purchases')->name('purchase-transactions.cancel');
        
        Route::post('purchase-transactions/{purchase_transaction}/approve', [PurchaseTransactionController::class, 'approve'])
            ->middleware('check.permission:approve-purchases')->name('purchase-transactions.approve');
        
        Route::get('purchase-transactions/{purchase_transaction}/print', [PurchaseTransactionController::class, 'printInvoice'])
            ->name('purchase-transactions.print');
        Route::get('purchase-transactions/{purchase_transaction}/download', [PurchaseTransactionController::class, 'downloadInvoice'])
            ->name('purchase-transactions.download');
        
        // Barcode routes
        Route::get('purchase-transactions/{purchase_transaction}/barcode', [PurchaseTransactionController::class, 'barcode'])
            ->name('purchase-transactions.barcode');
        Route::get('purchase-transactions/{purchase_transaction}/barcode/generate', [PurchaseTransactionController::class, 'generateBarcode'])
            ->name('purchase-transactions.barcode.generate');
        Route::get('purchase-transactions/{purchase_transaction}/barcode/download', [PurchaseTransactionController::class, 'downloadBarcode'])
            ->name('purchase-transactions.barcode.download');
    });

    // Stock Management - SEMUA ROLE dengan permission
    Route::middleware(['check.permission:view-stock'])->group(function () {
        // Stock In
        Route::prefix('stock-ins')->name('stock-ins.')->middleware('check.permission:stock-in')->group(function () {
            Route::get('/', [StockInController::class, 'index'])->name('index');
            Route::get('/create', [StockInController::class, 'create'])->name('create');
            Route::post('/', [StockInController::class, 'store'])->name('store');
            Route::get('/autofill/{code}', [StockInController::class, 'autofill'])->name('autofill');
            Route::post('/bulk-delete', [StockInController::class, 'bulkDelete'])->name('bulk-delete');
            Route::delete('/{stock_in}', [StockInController::class, 'destroy'])->name('destroy');
        });

        // Stock Out
        Route::prefix('stock-outs')->name('stock-outs.')->middleware('check.permission:stock-out')->group(function () {
            Route::get('/', [StockOutController::class, 'index'])->name('index');
            Route::get('/create', [StockOutController::class, 'create'])->name('create');
            Route::post('/', [StockOutController::class, 'store'])->name('store');
            Route::get('/autofill/{code}', [StockOutController::class, 'autofill'])->name('autofill');
            Route::post('/bulk-delete', [StockOutController::class, 'bulkDelete'])->name('bulk-delete');
            Route::delete('/{stock_out}', [StockOutController::class, 'destroy'])->name('destroy');
        });
    });

    // ==================== MANAGER & ADMIN ONLY ROUTES ====================
    Route::middleware(['check.role:admin,manager'])->group(function () {
        
        // Categories Management
        Route::resource('categories', CategoryController::class)
            ->middleware('check.permission:view-categories');
        Route::post('/categories/bulk-delete', [CategoryController::class, 'bulkDelete'])
            ->middleware('check.permission:delete-categories')->name('categories.bulk-delete');

        // Units Management
        Route::resource('units', UnitController::class)
            ->middleware('check.permission:view-units');
        Route::post('/units/bulk-delete', [UnitController::class, 'bulkDelete'])
            ->middleware('check.permission:delete-units')->name('units.bulk-delete');

        // Suppliers Management
        Route::prefix('suppliers')->name('suppliers.')->middleware('check.permission:view-suppliers')->group(function () {
            Route::get('/', [SupplierController::class, 'index'])->name('index');
            Route::get('/generate-code', [SupplierController::class, 'generateCode'])
                ->middleware('check.permission:create-suppliers')->name('generate-code');
            Route::get('/create', [SupplierController::class, 'create'])
                ->middleware('check.permission:create-suppliers')->name('create');
            Route::post('/', [SupplierController::class, 'store'])
                ->middleware('check.permission:create-suppliers')->name('store');
            Route::get('/{supplier}', [SupplierController::class, 'show'])->name('show');
            Route::get('/{supplier}/edit', [SupplierController::class, 'edit'])
                ->middleware('check.permission:edit-suppliers')->name('edit');
            Route::match(['put', 'patch'], '/{supplier}', [SupplierController::class, 'update'])
                ->middleware('check.permission:edit-suppliers')->name('update');
            Route::delete('/{supplier}', [SupplierController::class, 'destroy'])
                ->middleware('check.permission:delete-suppliers')->name('destroy');
            Route::post('/bulk-delete', [SupplierController::class, 'bulkDelete'])
                ->middleware('check.permission:delete-suppliers')->name('bulk-delete');
        });

        // EOQ & ROP Analysis
        Route::prefix('eoq-rop')->name('eoq-rop.')->middleware('check.permission:view-advanced-reports')->group(function () {
            Route::get('/', [EoqRopController::class, 'index'])->name('index');
            Route::put('/{product}/update-parameters', [EoqRopController::class, 'updateParameters'])
                ->middleware('check.permission:edit-products')->name('update-parameters');
            Route::post('/bulk-recalculate', [EoqRopController::class, 'bulkRecalculate'])
                ->middleware('check.permission:edit-products')->name('bulk-recalculate');
            Route::get('/export-excel', [EoqRopController::class, 'exportExcel'])->name('export-excel');
            Route::get('/export-pdf', [EoqRopController::class, 'exportPdf'])->name('export-pdf');
        });

        // Reports Management
        Route::prefix('reports')->name('reports.')->middleware('check.permission:view-reports')->group(function () {
            Route::get('/', [ReportController::class, 'index'])->name('index');
            
            // Stock Report
            Route::get('/stock', [ReportController::class, 'stockReport'])->name('stock');
            Route::get('/stock/export-pdf', [ReportController::class, 'exportStockPdf'])->name('stock.exportPdf');
            Route::get('/stock/export-excel', [ReportController::class, 'exportStockExcel'])->name('stock.exportExcel');
            
            // Mutation Report
            Route::get('/mutation', [ReportController::class, 'mutationReport'])->name('mutation');
            Route::get('/mutation/export-pdf', [ReportController::class, 'exportMutationPdf'])->name('mutation.exportPdf');
            Route::get('/mutation/export-excel', [ReportController::class, 'exportMutationExcel'])->name('mutation.exportExcel');
            
            // Minimum Stock Report
            Route::get('/minimum-stock', [ReportController::class, 'minimumStockReport'])->name('minimum-stock');
            Route::get('/minimum-stock/export-pdf', [ReportController::class, 'exportMinimumStockPdf'])->name('minimum-stock.exportPdf');
            Route::get('/minimum-stock/export-excel', [ReportController::class, 'exportMinimumStockExcel'])->name('minimum-stock.exportExcel');
            
            // Purchase History Report
            Route::get('/purchase-history', [ReportController::class, 'purchaseHistoryReport'])->name('purchase-history');
            Route::get('/purchase-history/export-pdf', [ReportController::class, 'exportPurchaseHistoryPdf'])->name('purchase-history.exportPdf');
            Route::get('/purchase-history/export-excel', [ReportController::class, 'exportPurchaseHistoryExcel'])->name('purchase-history.exportExcel');
            
            // Sales History Report
            Route::get('/sales-history', [ReportController::class, 'salesHistoryReport'])->name('sales-history');
            Route::get('/sales/export-pdf', [ReportController::class, 'exportSalesHistoryPdf'])->name('sales.exportPdf');
            Route::get('/sales/export-excel', [ReportController::class, 'exportSalesHistoryExcel'])->name('sales.exportExcel');
            
            // Supplier Report
            Route::get('/suppliers', [ReportController::class, 'supplierReport'])->name('suppliers');
            Route::get('/suppliers/export-pdf', [ReportController::class, 'exportSupplierPdf'])->name('suppliers.exportPdf');
            Route::get('/suppliers/export-excel', [ReportController::class, 'exportSupplierExcel'])->name('suppliers.exportExcel');
        });
    });

    // ==================== ADMIN ONLY ROUTES ====================
    Route::middleware(['check.role:admin'])->group(function () {
        
        // User Management
        Route::resource('users', UserController::class)
            ->middleware('check.permission:view-users');

        // System Settings
        Route::get('/settings', [SettingController::class, 'index'])
            ->middleware('check.permission:view-settings')->name('settings.index');
        Route::post('/settings', [SettingController::class, 'update'])
            ->middleware('check.permission:edit-settings')->name('settings.update');
        Route::post('/settings/update-format', [SettingController::class, 'updateFormat'])
            ->middleware('check.permission:edit-settings')->name('settings.update-format');
    });

});

require __DIR__ . '/auth.php';