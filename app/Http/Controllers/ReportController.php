<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Category;
use App\Models\StockIn;
use App\Models\StockOut;
use App\Models\Supplier;
use App\Models\SalesTransaction;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\StockReportExport;
use App\Exports\MutationReportExport;
use App\Exports\SupplierReportExport;
use App\Exports\MinimumStockReportExport;
use App\Exports\PurchaseHistoryReportExport;
use App\Exports\SalesHistoryReportExport;
use App\Models\PurchaseTransaction;

class ReportController extends Controller
{
    /**
     * ✅ FIXED: Remove restrictive constructor authorization
     * Let routes handle the middleware instead
     */
    public function __construct()
    {
        // Remove blanket authorization - handle in routes
    }

    /**
     * Menampilkan halaman indeks laporan (pilihan laporan).
     */
    public function index()
    {
        return Inertia::render('Reports/Index');
    }

    /**
     * Menampilkan laporan stok saat ini dengan filter.
     */
    public function stockReport(Request $request)
    {
        $request->validate([
            'category_id' => 'nullable|string',
            'min_stock' => 'nullable|integer|min:0',
            'max_stock' => 'nullable|integer|min:0',
        ]);

        $products = Product::with(['category', 'unit'])
            ->when(
                $request->filled('category_id') && $request->category_id !== 'all',
                fn($query) => $query->where('category_id', $request->category_id)
            )
            ->when(
                $request->filled('min_stock'),
                fn($query) => $query->where('current_stock', '>=', $request->min_stock)
            )
            ->when(
                $request->filled('max_stock'),
                fn($query) => $query->where('current_stock', '<=', $request->max_stock)
            )
            ->orderBy('name')
            ->paginate(10);

        $categories = Category::select('id', 'name')->orderBy('name')->get();

        return Inertia::render('Reports/StockReport', [
            'products' => $products,
            'categories' => $categories,
            'filters' => $request->all(),
        ]);
    }

    /**
     * Export Stock Report to PDF
     */
    public function exportStockPdf(Request $request)
    {
        $products = Product::with(['category', 'unit'])
            ->when(
                $request->filled('category_id') && $request->category_id !== 'all',
                fn($query) => $query->where('category_id', $request->category_id)
            )
            ->when(
                $request->filled('min_stock'),
                fn($query) => $query->where('current_stock', '>=', $request->min_stock)
            )
            ->when(
                $request->filled('max_stock'),
                fn($query) => $query->where('current_stock', '<=', $request->max_stock)
            )
            ->orderBy('name')
            ->get();

        $pdf = Pdf::loadView('exports.stock_report', compact('products'))
            ->setPaper('a4', 'portrait');

        return $pdf->stream('stock_report_' . now()->format('Ymd_His') . '.pdf');
    }

    /**
     * Export Stock Report to Excel
     */
    public function exportStockExcel(Request $request)
    {
        return Excel::download(
            new StockReportExport($request),
            'stock_report_' . now()->format('Ymd_His') . '.xlsx'
        );
    }

    /**
     * Menampilkan laporan mutasi stok (stock in dan stock out) dengan filter.
     */
    public function mutationReport(Request $request)
    {
        $request->validate([
            'product_id' => 'nullable|string',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        // Query untuk Stock In
        $stockIns = StockIn::with(['product', 'user'])
            ->when(
                $request->filled('product_id') && $request->product_id !== 'all',
                fn($query) => $query->where('product_id', $request->product_id)
            )
            ->when(
                $request->filled('start_date'),
                fn($query) => $query->whereDate('transaction_date', '>=', $request->start_date)
            )
            ->when(
                $request->filled('end_date'),
                fn($query) => $query->whereDate('transaction_date', '<=', $request->end_date)
            )
            ->get();

        // Query untuk Stock Out
        $stockOuts = StockOut::with(['product', 'user'])
            ->when(
                $request->filled('product_id') && $request->product_id !== 'all',
                fn($query) => $query->where('product_id', $request->product_id)
            )
            ->when(
                $request->filled('start_date'),
                fn($query) => $query->whereDate('transaction_date', '>=', $request->start_date)
            )
            ->when(
                $request->filled('end_date'),
                fn($query) => $query->whereDate('transaction_date', '<=', $request->end_date)
            )
            ->get();

        // Gabungkan dan urutkan transaksi berdasarkan tanggal secara descending
        $transactions = $stockIns->map(function ($item) {
            $item->type = 'in';
            $item->supplier = $item->supplier ?? null;
            $item->customer = null;
            return $item;
        })->merge($stockOuts->map(function ($item) {
            $item->type = 'out';
            $item->supplier = null;
            $item->customer = $item->customer ?? null;
            return $item;
        }))->sortByDesc('transaction_date')->values();

        $products = Product::select('id', 'name')->orderBy('name')->get();

        return Inertia::render('Reports/MutationReport', [
            'transactions' => $transactions,
            'products' => $products,
            'filters' => $request->all(),
        ]);
    }

    /**
     * Export Mutation Report to PDF
     */
    public function exportMutationPdf(Request $request)
    {
        $transactions = $this->getMutationData($request);

        $pdf = Pdf::loadView('exports.mutation_report', [
            'transactions' => $transactions,
        ])->setPaper('a4', 'portrait');

        return $pdf->stream('mutation_report_' . now()->format('Ymd_His') . '.pdf');
    }

    /**
     * Export Mutation Report to Excel
     */
    public function exportMutationExcel(Request $request)
    {
        return Excel::download(
            new MutationReportExport($request),
            'mutation_report_' . now()->format('Ymd_His') . '.xlsx'
        );
    }

    /**
     * Get mutation data for export
     */
    private function getMutationData(Request $request)
    {
        $stockIns = StockIn::with(['product', 'user'])
            ->when(
                $request->filled('product_id') && $request->product_id !== 'all',
                fn($q) => $q->where('product_id', $request->product_id)
            )
            ->when(
                $request->filled('start_date'),
                fn($q) => $q->whereDate('transaction_date', '>=', $request->start_date)
            )
            ->when(
                $request->filled('end_date'),
                fn($q) => $q->whereDate('transaction_date', '<=', $request->end_date)
            )
            ->get()
            ->map(function ($item) {
                $item->type = 'in';
                $item->supplier = $item->supplier ?? null;
                $item->customer = null;
                return $item;
            });

        $stockOuts = StockOut::with(['product', 'user'])
            ->when(
                $request->filled('product_id') && $request->product_id !== 'all',
                fn($q) => $q->where('product_id', $request->product_id)
            )
            ->when(
                $request->filled('start_date'),
                fn($q) => $q->whereDate('transaction_date', '>=', $request->start_date)
            )
            ->when(
                $request->filled('end_date'),
                fn($q) => $q->whereDate('transaction_date', '<=', $request->end_date)
            )
            ->get()
            ->map(function ($item) {
                $item->type = 'out';
                $item->supplier = null;
                $item->customer = $item->customer ?? null;
                return $item;
            });

        return $stockIns->merge($stockOuts)->sortByDesc('transaction_date')->values();
    }

    /**
     * Purchase History Report
     */
    public function purchaseHistoryReport(Request $request)
    {
        $request->validate([
            'supplier_id' => 'nullable|string',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        $purchases = PurchaseTransaction::with(['supplier', 'user'])
            ->when(
                $request->filled('supplier_id') && $request->supplier_id !== 'all',
                fn($query) => $query->where('supplier_id', $request->supplier_id)
            )
            ->when(
                $request->filled('start_date'),
                fn($query) => $query->whereDate('transaction_date', '>=', $request->start_date)
            )
            ->when(
                $request->filled('end_date'),
                fn($query) => $query->whereDate('transaction_date', '<=', $request->end_date)
            )
            ->orderByDesc('transaction_date')
            ->paginate(10);

        $suppliers = Supplier::select('id', 'name')->orderBy('name')->get();

        return Inertia::render('Reports/PurchaseHistoryReport', [
            'purchases' => $purchases,
            'suppliers' => $suppliers,
            'filters' => $request->all(),
        ]);
    }

    /**
     * Export Purchase History to PDF
     */
    public function exportPurchaseHistoryPdf(Request $request)
    {
        $purchases = PurchaseTransaction::with(['supplier', 'user'])
            ->when(
                $request->filled('supplier_id') && $request->supplier_id !== 'all',
                fn($q) => $q->where('supplier_id', $request->supplier_id)
            )
            ->when(
                $request->filled('start_date'),
                fn($q) => $q->whereDate('transaction_date', '>=', $request->start_date)
            )
            ->when(
                $request->filled('end_date'),
                fn($q) => $q->whereDate('transaction_date', '<=', $request->end_date)
            )
            ->orderByDesc('transaction_date')
            ->get();

        $pdf = Pdf::loadView('exports.purchase_history_report', compact('purchases'))
            ->setPaper('a4', 'portrait');

        return $pdf->stream('purchase_history_report_' . now()->format('Ymd_His') . '.pdf');
    }

    /**
     * Export Purchase History to Excel
     */
    public function exportPurchaseHistoryExcel(Request $request)
    {
        return Excel::download(
            new PurchaseHistoryReportExport($request),
            'purchase_history_report_' . now()->format('Ymd_His') . '.xlsx'
        );
    }

    /**
     * Supplier Report
     */
    public function supplierReport(Request $request)
    {
        $request->validate([
            'search' => 'nullable|string|max:255',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        $suppliers = Supplier::withCount([
            'purchaseTransactions as total_transactions' => function ($query) use ($request) {
                $query->when(
                    $request->filled('start_date'),
                    fn($q) => $q->whereDate('transaction_date', '>=', $request->start_date)
                )->when(
                    $request->filled('end_date'),
                    fn($q) => $q->whereDate('transaction_date', '<=', $request->end_date)
                );
            }
        ])
            ->withSum([
                'purchaseTransactions as total_amount' => function ($query) use ($request) {
                    $query->when(
                        $request->filled('start_date'),
                        fn($q) => $q->whereDate('transaction_date', '>=', $request->start_date)
                    )->when(
                        $request->filled('end_date'),
                        fn($q) => $q->whereDate('transaction_date', '<=', $request->end_date)
                    );
                }
            ], 'total_price')
            ->when(
                $request->filled('search'),
                fn($query) => $query->where('name', 'like', '%' . $request->search . '%')
            )
            ->orderBy('name')
            ->paginate(10);

        return Inertia::render('Reports/SupplierReport', [
            'suppliers' => $suppliers,
            'filters' => $request->all(),
        ]);
    }

    /**
     * Export Supplier Report to PDF
     */
    public function exportSupplierPdf(Request $request)
    {
        $suppliers = $this->getSupplierData($request);

        $pdf = Pdf::loadView('exports.supplier_report', [
            'suppliers' => $suppliers,
        ])->setPaper('a4', 'portrait');

        return $pdf->stream('supplier_report_' . now()->format('Ymd_His') . '.pdf');
    }

    /**
     * Export Supplier Report to Excel
     */
    public function exportSupplierExcel(Request $request)
    {
        return Excel::download(
            new SupplierReportExport($request),
            'supplier_report_' . now()->format('Ymd_His') . '.xlsx'
        );
    }

    /**
     * Get supplier data for export
     */
    private function getSupplierData(Request $request)
    {
        return Supplier::withCount([
            'purchaseTransactions as total_transactions' => function ($query) use ($request) {
                $query->when(
                    $request->filled('start_date'),
                    fn($q) => $q->whereDate('transaction_date', '>=', $request->start_date)
                )->when(
                    $request->filled('end_date'),
                    fn($q) => $q->whereDate('transaction_date', '<=', $request->end_date)
                );
            }
        ])
            ->withSum([
                'purchaseTransactions as total_amount' => function ($query) use ($request) {
                    $query->when(
                        $request->filled('start_date'),
                        fn($q) => $q->whereDate('transaction_date', '>=', $request->start_date)
                    )->when(
                        $request->filled('end_date'),
                        fn($q) => $q->whereDate('transaction_date', '<=', $request->end_date)
                    );
                }
            ], 'total_price')
            ->when(
                $request->filled('search'),
                fn($query) => $query->where('name', 'like', '%' . $request->search . '%')
            )
            ->orderBy('name')
            ->get();
    }

    /**
     * Sales History Report
     */
    public function salesHistoryReport(Request $request)
    {
        $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        $sales = SalesTransaction::with(['user', 'product'])
            ->when(
                $request->filled('start_date'),
                fn($q) => $q->whereDate('transaction_date', '>=', $request->start_date)
            )
            ->when(
                $request->filled('end_date'),
                fn($q) => $q->whereDate('transaction_date', '<=', $request->end_date)
            )
            ->orderByDesc('transaction_date')
            ->paginate(10);

        return Inertia::render('Reports/SalesHistoryReport', [
            'sales' => $sales,
            'filters' => $request->all(),
        ]);
    }

    /**
     * Export Sales History to PDF
     */
    public function exportSalesHistoryPdf(Request $request)
    {
        $sales = SalesTransaction::with(['user', 'product'])
            ->when(
                $request->filled('start_date'),
                fn($q) => $q->whereDate('transaction_date', '>=', $request->start_date)
            )
            ->when(
                $request->filled('end_date'),
                fn($q) => $q->whereDate('transaction_date', '<=', $request->end_date)
            )
            ->orderByDesc('transaction_date')
            ->get();

        $pdf = Pdf::loadView('exports.sales_history_report', compact('sales'))
            ->setPaper('a4', 'portrait');

        return $pdf->stream('sales_history_report_' . now()->format('Ymd_His') . '.pdf');
    }

    /**
     * Export Sales History to Excel
     */
    public function exportSalesHistoryExcel(Request $request)
    {
        return Excel::download(
            new SalesHistoryReportExport($request),
            'sales_history_report_' . now()->format('Ymd_His') . '.xlsx'
        );
    }

    /**
     * Minimum Stock Report
     */
    public function minimumStockReport(Request $request)
    {
        $request->validate([
            'category_id' => 'nullable|string',
        ]);

        $products = Product::with(['category', 'unit'])
            ->whereColumn('current_stock', '<', 'minimum_stock')
            ->when(
                $request->filled('category_id') && $request->category_id !== 'all',
                fn($query) => $query->where('category_id', $request->category_id)
            )
            ->orderBy('name')
            ->paginate(10);

        $categories = Category::select('id', 'name')->orderBy('name')->get();

        return Inertia::render('Reports/MinimumStockReport', [
            'products' => $products,
            'categories' => $categories,
            'filters' => $request->all(),
        ]);
    }

    /**
     * Export Minimum Stock Report to PDF
     */
    public function exportMinimumStockPdf(Request $request)
    {
        $products = Product::with(['category', 'unit'])
            ->whereColumn('current_stock', '<', 'minimum_stock')
            ->when(
                $request->filled('category_id') && $request->category_id !== 'all',
                fn($query) => $query->where('category_id', $request->category_id)
            )
            ->orderBy('name')
            ->get();

        $pdf = Pdf::loadView('exports.minimum_stock_report', compact('products'))
            ->setPaper('a4', 'portrait');

        return $pdf->stream('minimum_stock_report_' . now()->format('Ymd_His') . '.pdf');
    }

    /**
     * Export Minimum Stock Report to Excel
     */
    public function exportMinimumStockExcel(Request $request)
    {
        return Excel::download(
            new MinimumStockReportExport($request),
            'minimum_stock_report_' . now()->format('Ymd_His') . '.xlsx'
        );
    }
}
