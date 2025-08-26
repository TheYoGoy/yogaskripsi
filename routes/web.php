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
    });

    // ✅ FIXED: Products Management - admin dan manager
    Route::middleware(['check.role:admin|manager'])->group(function () {
        Route::prefix('products')->name('products.')->group(function () {
            // View products (accessible to all roles dengan permission)
            Route::get('/', [ProductController::class, 'index'])
                ->middleware('check.permission:view-products')
                ->name('index');

            // ✅ Generate code - HARUS SEBELUM {product} routes
            Route::get('/generate-code', [ProductController::class, 'generateCode'])
                ->middleware('check.permission:create-products')
                ->name('generate-code');

            // ✅ Search by code untuk barcode scanning - HARUS SEBELUM {product} routes
            Route::get('/search/{code}', [ProductController::class, 'searchByCode'])
    ->middleware('check.permission:view-products')
    ->name('searchByCode');

            // Create products
            Route::get('/create', [ProductController::class, 'create'])
                ->middleware('check.permission:create-products')
                ->name('create');

            Route::post('/', [ProductController::class, 'store'])
                ->middleware('check.permission:create-products')
                ->name('store');

            // Bulk delete
            Route::post('/bulk-delete', [ProductController::class, 'bulkDelete'])
                ->middleware('check.permission:delete-products')
                ->name('bulk-delete');

            // Show, Edit, Update, Delete products
            Route::get('/{product}', [ProductController::class, 'show'])
                ->middleware('check.permission:view-products')
                ->name('show');

            Route::get('/{product}/edit', [ProductController::class, 'edit'])
                ->middleware('check.permission:edit-products')
                ->name('edit');

            Route::match(['put', 'patch'], '/{product}', [ProductController::class, 'update'])
                ->middleware('check.permission:edit-products')
                ->name('update');

            Route::delete('/{product}', [ProductController::class, 'destroy'])
                ->middleware('check.permission:delete-products')
                ->name('destroy');

            // ✅ FIXED: Barcode routes - nama method yang benar
            Route::get('/{product}/barcode', [ProductController::class, 'barcode'])
                ->middleware('check.permission:view-products')
                ->name('barcode');

            Route::get('/{product}/download-barcode', [ProductController::class, 'downloadBarcode'])
                ->middleware('check.permission:view-products')
                ->name('download-barcode');
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

        // EOQ & ROP
        Route::get('/eoq-rop', [EoqRopController::class, 'index'])
            ->middleware('check.permission:view-advanced-reports')
            ->name('eoq-rop.index');
    });

    // ✅ REPORTS MANAGEMENT
    Route::prefix('reports')->name('reports.')->group(function () {
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

    // Stock Management - admin, manager, dan staff
    Route::middleware(['check.permission:view-stock'])->group(function () {
        // Stock In
        Route::resource('stock-ins', StockInController::class)
            ->except(['show', 'edit', 'update'])
            ->middleware('check.permission:stock-in');

        Route::post('stock-ins/bulk-delete', [StockInController::class, 'bulkDelete'])
            ->middleware('check.permission:stock-in')
            ->name('stock-ins.bulk-delete');

        Route::get('stock-ins/autofill/{code}', [StockInController::class, 'autofill'])
    ->name('stock-ins.autofill');

        // Stock Out
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

        Route::post('purchase-transactions/bulk-delete', [PurchaseTransactionController::class, 'bulkDelete'])
            ->middleware('check.permission:delete-purchases')
            ->name('purchase-transactions.bulk-delete');

        Route::post('purchase-transactions/{purchase_transaction}/cancel', [PurchaseTransactionController::class, 'cancel'])
            ->middleware('check.permission:edit-purchases')
            ->name('purchase-transactions.cancel');

        Route::post('purchase-transactions/{purchase_transaction}/approve', [PurchaseTransactionController::class, 'approve'])
            ->middleware('check.permission:approve-purchases')
            ->name('purchase-transactions.approve');

        Route::get('purchase-transactions/{purchase_transaction}/print', [PurchaseTransactionController::class, 'printInvoice'])
            ->middleware('check.permission:view-purchases')
            ->name('purchase-transactions.print');

        Route::get('purchase-transactions/{purchase_transaction}/download', [PurchaseTransactionController::class, 'downloadInvoice'])
            ->middleware('check.permission:view-purchases')
            ->name('purchase-transactions.download');

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
});

require __DIR__ . '/auth.php';