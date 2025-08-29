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
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    /**
     * Constructor - let routes handle middleware
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
        try {
            Log::info('Stock Report Request', $request->all());

            $request->validate([
                'category_id' => 'nullable|string',
                'min_stock' => 'nullable|integer|min:0',
                'max_stock' => 'nullable|integer|min:0',
                'per_page' => 'nullable|integer|min:5|max:100',
            ]);

            $perPage = $request->input('per_page', 15);

            // Build the query with proper relationships
            $query = Product::with(['category:id,name', 'unit:id,name,symbol', 'supplier:id,name'])
                ->select([
                    'products.id',
                    'products.name',
                    'products.sku',
                    'products.code',
                    'products.current_stock',
                    'products.price',
                    'products.category_id',
                    'products.unit_id',
                    'products.supplier_id',
                    'products.lead_time',
                    'products.daily_usage_rate',
                    'products.created_at'
                ]);

            // Apply category filter
            if ($request->filled('category_id') && $request->category_id !== 'all') {
                $query->where('category_id', $request->category_id);
            }

            // Apply minimum stock filter
            if ($request->filled('min_stock')) {
                $query->where('current_stock', '>=', $request->min_stock);
            }

            // Apply maximum stock filter
            if ($request->filled('max_stock')) {
                $query->where('current_stock', '<=', $request->max_stock);
            }

            // Order by name and paginate
            $products = $query->orderBy('name')->paginate($perPage)->withQueryString();

            // Calculate ROP and EOQ for each product and add stock status
            $products->getCollection()->transform(function ($product) {
                $product->rop = $product->calculateRop();
                $product->eoq = $product->calculateEoq();
                $product->stock_status = $product->getStockStatus();
                $product->reorder_status = $product->getReorderStatus();
                return $product;
            });

            // Get categories for filter dropdown
            $categories = Category::select('id', 'name')->orderBy('name')->get();

            // Calculate summary
            $totalValue = $products->getCollection()->sum(function ($product) {
                return $product->current_stock * $product->price;
            });

            $lowStockCount = $products->getCollection()->filter(function ($product) {
                return $product->needsReorder();
            })->count();

            Log::info('Stock Report Results', [
                'total_products' => $products->total(),
                'current_page' => $products->currentPage(),
                'per_page' => $products->perPage(),
                'low_stock_count' => $lowStockCount,
                'total_value' => $totalValue
            ]);

            return Inertia::render('Reports/StockReport', [
                'products' => $products,
                'categories' => $categories,
                'filters' => $request->all(),
                'summary' => [
                    'total_products' => $products->total(),
                    'total_value' => $totalValue,
                    'low_stock_count' => $lowStockCount,
                    'zero_stock_count' => $products->getCollection()->where('current_stock', 0)->count()
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Stock Report Error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return Inertia::render('Reports/StockReport', [
                'products' => collect()->paginate(15),
                'categories' => collect(),
                'filters' => $request->all(),
                'flash' => ['error' => 'Terjadi kesalahan saat memuat laporan stok.']
            ]);
        }
    }

    /**
     * Export Stock Report to PDF
     */
    public function exportStockPdf(Request $request)
    {
        try {
            $filters = $request->only(['category_id', 'min_stock', 'max_stock']);

            $query = Product::with(['category:id,name', 'unit:id,name,symbol', 'supplier:id,name']);

            // Apply filters
            if (!empty($filters['category_id']) && $filters['category_id'] !== 'all') {
                $query->where('category_id', $filters['category_id']);
            }

            if (!empty($filters['min_stock'])) {
                $query->where('current_stock', '>=', $filters['min_stock']);
            }

            if (!empty($filters['max_stock'])) {
                $query->where('current_stock', '<=', $filters['max_stock']);
            }

            $products = $query->orderBy('name')->get();

            // Add calculations to each product
            $products->transform(function ($product) {
                $product->rop = $product->calculateRop();
                $product->eoq = $product->calculateEoq();
                $product->stock_status = $product->getStockStatus();
                return $product;
            });

            $categories = Category::all();

            // Calculate summary
            $summary = [
                'total_products' => $products->count(),
                'total_value' => $products->sum(function ($p) {
                    return $p->current_stock * $p->price;
                }),
                'low_stock_count' => $products->filter(function ($p) {
                    return $p->needsReorder();
                })->count(),
                'zero_stock_count' => $products->where('current_stock', 0)->count(),
            ];

            $data = [
                'products' => $products,
                'categories' => $categories,
                'filters' => $filters,
                'summary' => $summary,
                'generated_at' => now()->format('d/m/Y H:i:s'),
            ];

            $pdf = Pdf::loadView('reports.stock-report-pdf', $data)->setPaper('a4', 'landscape');

            return $pdf->download('laporan-stok-' . now()->format('Y-m-d') . '.pdf');
        } catch (\Exception $e) {
            Log::error('Stock PDF Export Error', ['error' => $e->getMessage()]);
            return back()->with('error', 'Gagal mengexport laporan stok ke PDF.');
        }
    }

    /**
     * Export Stock Report to Excel
     */
    public function exportStockExcel(Request $request)
    {
        try {
            $filters = $request->only(['category_id', 'min_stock', 'max_stock']);

            return Excel::download(
                new StockReportExport($filters),
                'laporan-stok-' . now()->format('Y-m-d') . '.xlsx'
            );
        } catch (\Exception $e) {
            Log::error('Stock Excel Export Error', ['error' => $e->getMessage()]);
            return back()->with('error', 'Gagal mengexport laporan stok ke Excel.');
        }
    }

    /**
     * Menampilkan laporan mutasi stok (stock in dan stock out) dengan filter.
     */
    public function mutationReport(Request $request)
    {
        try {
            Log::info('Mutation Report Request', $request->all());

            $request->validate([
                'product_id' => 'nullable|string',
                'start_date' => 'nullable|date',
                'end_date' => 'nullable|date|after_or_equal:start_date',
                'per_page' => 'nullable|integer|min:5|max:100',
            ]);

            $perPage = $request->input('per_page', 15);

            // Base query for Stock In
            $stockInsQuery = StockIn::with(['product:id,name,sku,code', 'user:id,name'])
                ->select(['id', 'code', 'product_id', 'quantity', 'transaction_date', 'date', 'supplier', 'source', 'user_id', 'created_at']);

            // Apply filters to Stock In
            if ($request->filled('product_id') && $request->product_id !== 'all') {
                $stockInsQuery->where('product_id', $request->product_id);
            }

            if ($request->filled('start_date')) {
                $stockInsQuery->where(function ($q) use ($request) {
                    $q->whereDate('transaction_date', '>=', $request->start_date)
                        ->orWhereDate('date', '>=', $request->start_date);
                });
            }

            if ($request->filled('end_date')) {
                $stockInsQuery->where(function ($q) use ($request) {
                    $q->whereDate('transaction_date', '<=', $request->end_date)
                        ->orWhereDate('date', '<=', $request->end_date);
                });
            }

            $stockIns = $stockInsQuery->get();

            // Base query for Stock Out  
            $stockOutsQuery = StockOut::with(['product:id,name,sku,code', 'user:id,name'])
                ->select(['id', 'code', 'product_id', 'quantity', 'transaction_date', 'date', 'customer', 'user_id', 'created_at']);

            // Apply filters to Stock Out
            if ($request->filled('product_id') && $request->product_id !== 'all') {
                $stockOutsQuery->where('product_id', $request->product_id);
            }

            if ($request->filled('start_date')) {
                $stockOutsQuery->where(function ($q) use ($request) {
                    $q->whereDate('transaction_date', '>=', $request->start_date)
                        ->orWhereDate('date', '>=', $request->start_date);
                });
            }

            if ($request->filled('end_date')) {
                $stockOutsQuery->where(function ($q) use ($request) {
                    $q->whereDate('transaction_date', '<=', $request->end_date)
                        ->orWhereDate('date', '<=', $request->end_date);
                });
            }

            $stockOuts = $stockOutsQuery->get();

            // Transform and combine data
            $transactions = collect();

            // Add stock ins
            foreach ($stockIns as $stockIn) {
                $effectiveDate = $stockIn->transaction_date ?: $stockIn->date ?: $stockIn->created_at;
                $transactions->push([
                    'id' => 'in_' . $stockIn->id,
                    'original_id' => $stockIn->id,
                    'code' => $stockIn->code,
                    'type' => 'in',
                    'product' => $stockIn->product,
                    'quantity' => $stockIn->quantity,
                    'transaction_date' => $effectiveDate,
                    'supplier' => $stockIn->supplier,
                    'customer' => null,
                    'source' => $stockIn->source,
                    'user' => $stockIn->user,
                    'created_at' => $stockIn->created_at,
                ]);
            }

            // Add stock outs
            foreach ($stockOuts as $stockOut) {
                $effectiveDate = $stockOut->transaction_date ?: $stockOut->date ?: $stockOut->created_at;
                $transactions->push([
                    'id' => 'out_' . $stockOut->id,
                    'original_id' => $stockOut->id,
                    'code' => $stockOut->code,
                    'type' => 'out',
                    'product' => $stockOut->product,
                    'quantity' => $stockOut->quantity,
                    'transaction_date' => $effectiveDate,
                    'supplier' => null,
                    'customer' => $stockOut->customer,
                    'source' => null,
                    'user' => $stockOut->user,
                    'created_at' => $stockOut->created_at,
                ]);
            }

            // Sort by transaction date descending and paginate manually
            $transactions = $transactions->sortByDesc('transaction_date')->values();

            // Manual pagination
            $currentPage = $request->input('page', 1);
            $offset = ($currentPage - 1) * $perPage;
            $paginatedTransactions = $transactions->slice($offset, $perPage)->values();

            // Create pagination info
            $paginationData = new \Illuminate\Pagination\LengthAwarePaginator(
                $paginatedTransactions,
                $transactions->count(),
                $perPage,
                $currentPage,
                [
                    'path' => $request->url(),
                    'pageName' => 'page',
                ]
            );
            $paginationData->withQueryString();

            // Get products for filter dropdown
            $products = Product::select('id', 'name')->orderBy('name')->get();

            Log::info('Mutation Report Results', [
                'total_transactions' => $transactions->count(),
                'stock_ins' => $stockIns->count(),
                'stock_outs' => $stockOuts->count(),
            ]);

            return Inertia::render('Reports/MutationReport', [
                'transactions' => $paginationData,
                'products' => $products,
                'filters' => $request->all(),
                'summary' => [
                    'total_in' => $stockIns->sum('quantity'),
                    'total_out' => $stockOuts->sum('quantity'),
                    'total_transactions' => $transactions->count(),
                    'net_movement' => $stockIns->sum('quantity') - $stockOuts->sum('quantity'),
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Mutation Report Error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return Inertia::render('Reports/MutationReport', [
                'transactions' => collect()->paginate(15),
                'products' => collect(),
                'filters' => $request->all(),
                'flash' => ['error' => 'Terjadi kesalahan saat memuat laporan mutasi.']
            ]);
        }
    }

    private function getPeriodString($filters)
    {
        if (!empty($filters['start_date']) && !empty($filters['end_date'])) {
            $start = \Carbon\Carbon::parse($filters['start_date'])->format('d F Y');
            $end = \Carbon\Carbon::parse($filters['end_date'])->format('d F Y');
            return $start . ' - ' . $end;
        } elseif (!empty($filters['start_date'])) {
            return 'Mulai ' . \Carbon\Carbon::parse($filters['start_date'])->format('d F Y');
        } elseif (!empty($filters['end_date'])) {
            return 'Sampai ' . \Carbon\Carbon::parse($filters['end_date'])->format('d F Y');
        }

        return 'Semua Periode';
    }
    /**
     * Export Mutation Report to PDF
     */
    public function exportMutationPdf(Request $request)
    {
        try {
            Log::info('Mutation PDF Export Request', $request->all());

            $filters = $request->only(['product_id', 'start_date', 'end_date']);
            $transactions = $this->getMutationDataForPdfFixed($filters);
            $products = Product::all();

            $data = [
                'transactions' => $transactions,
                'products' => $products,
                'filters' => $filters,
                'generated_at' => now()->format('d/m/Y H:i:s'),
            ];

            // Update path ke exports folder
            $pdf = Pdf::loadView('exports.mutation_report', $data)
                ->setPaper('a4', 'landscape')
                ->setOptions([
                    'defaultFont' => 'DejaVu Sans',
                    'isHtml5ParserEnabled' => true,
                    'isRemoteEnabled' => true,
                ]);

            return $pdf->stream('laporan-mutasi-stok-' . now()->format('Y-m-d-H-i-s') . '.pdf');
        } catch (\Exception $e) {
            Log::error('Mutation PDF Export Error', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Gagal mengexport PDF: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Export Mutation Report to Excel
     */
    public function exportMutationExcel(Request $request)
    {
        try {
            Log::info('Mutation Excel Export Request', $request->all());

            $filters = $request->only(['product_id', 'start_date', 'end_date']);

            $filename = 'laporan-mutasi-stok-' . now()->format('Y-m-d-H-i-s') . '.xlsx';

            return Excel::download(
                new MutationReportExport($filters),
                $filename
            );
        } catch (\Exception $e) {
            Log::error('Mutation Excel Export Error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'error' => 'Gagal mengexport laporan mutasi ke Excel: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get mutation data for export
     */
    private function getMutationDataForPdfFixed($filters)
    {
        // Base filters
        $dateFilter = function ($query) use ($filters) {
            if (!empty($filters['start_date'])) {
                $query->where(function ($q) use ($filters) {
                    $q->whereDate('transaction_date', '>=', $filters['start_date'])
                        ->orWhereDate('date', '>=', $filters['start_date']);
                });
            }
            if (!empty($filters['end_date'])) {
                $query->where(function ($q) use ($filters) {
                    $q->whereDate('transaction_date', '<=', $filters['end_date'])
                        ->orWhereDate('date', '<=', $filters['end_date']);
                });
            }
            return $query;
        };

        $productFilter = function ($query) use ($filters) {
            if (!empty($filters['product_id']) && $filters['product_id'] !== 'all') {
                $query->where('product_id', $filters['product_id']);
            }
            return $query;
        };

        // Get stock ins - only load existing relationships
        $stockInsQuery = StockIn::with(['product:id,name,sku', 'user:id,name']);

        // Check if supplier relationship exists before loading it
        $stockInModel = new StockIn();
        if (method_exists($stockInModel, 'supplier')) {
            $stockInsQuery->with('supplier:id,name');
        }

        $stockInsQuery = $productFilter($stockInsQuery);
        $stockInsQuery = $dateFilter($stockInsQuery);

        $stockIns = $stockInsQuery->get()->map(function ($item) {
            $effectiveDate = $item->transaction_date ?: $item->date ?: $item->created_at;

            // Handle supplier relationship safely
            $supplierName = null;
            if (method_exists($item, 'supplier') && $item->supplier) {
                $supplierName = $item->supplier->name;
            } elseif (isset($item->supplier)) {
                $supplierName = $item->supplier;
            } elseif (isset($item->source)) {
                $supplierName = $item->source;
            }

            return (object)[
                'type' => 'in',
                'code' => $item->code ?? '-',
                'product' => $item->product,
                'quantity' => $item->quantity,
                'transaction_date' => $effectiveDate,
                'supplier' => (object)['name' => $supplierName ?? '-'],
                'customer' => null,
                'source' => $item->source ?? null,
                'user' => $item->user,
                'note' => $item->note ?? $item->description ?? '-',
                'stock_before' => $item->stock_before ?? 0,
                'stock_after' => $item->stock_after ?? 0,
            ];
        });

        // Get stock outs - only load existing relationships
        $stockOutsQuery = StockOut::with(['product:id,name,sku', 'user:id,name']);
        $stockOutsQuery = $productFilter($stockOutsQuery);
        $stockOutsQuery = $dateFilter($stockOutsQuery);

        $stockOuts = $stockOutsQuery->get()->map(function ($item) {
            $effectiveDate = $item->transaction_date ?: $item->date ?: $item->created_at;

            return (object)[
                'type' => 'out',
                'code' => $item->code ?? '-',
                'product' => $item->product,
                'quantity' => $item->quantity,
                'transaction_date' => $effectiveDate,
                'supplier' => null,
                'customer' => $item->customer ?? '-',
                'source' => null,
                'user' => $item->user,
                'note' => $item->note ?? $item->description ?? '-',
                'stock_before' => $item->stock_before ?? 0,
                'stock_after' => $item->stock_after ?? 0,
            ];
        });

        return $stockIns->merge($stockOuts)->sortByDesc('transaction_date')->values();
    }

    /**
     * Purchase History Report
     */
    public function purchaseHistoryReport(Request $request)
    {
        try {
            Log::info('Purchase History Report Request', $request->all());

            $request->validate([
                'supplier_id' => 'nullable|string',
                'start_date' => 'nullable|date',
                'end_date' => 'nullable|date|after_or_equal:start_date',
                'per_page' => 'nullable|integer|min:5|max:100',
            ]);

            $perPage = $request->input('per_page', 15);

            $purchases = PurchaseTransaction::with(['supplier:id,name', 'user:id,name', 'product:id,name,sku'])
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
                ->paginate($perPage)
                ->withQueryString();

            $suppliers = Supplier::select('id', 'name')->orderBy('name')->get();

            // Calculate summary
            $totalAmount = PurchaseTransaction::when(
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
                ->sum('total_price');

            $totalQuantity = PurchaseTransaction::when(
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
                ->sum('quantity');

            Log::info('Purchase History Results', [
                'total_purchases' => $purchases->total(),
                'total_amount' => $totalAmount
            ]);

            return Inertia::render('Reports/PurchaseHistoryReport', [
                'purchases' => $purchases,
                'suppliers' => $suppliers,
                'filters' => $request->all(),
                'summary' => [
                    'total_transactions' => $purchases->total(),
                    'total_amount' => $totalAmount,
                    'total_quantity' => $totalQuantity,
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Purchase History Report Error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return Inertia::render('Reports/PurchaseHistoryReport', [
                'purchases' => collect()->paginate(15),
                'suppliers' => collect(),
                'filters' => $request->all(),
                'flash' => ['error' => 'Terjadi kesalahan saat memuat laporan pembelian.']
            ]);
        }
    }

    /**
     * Export Purchase History to PDF
     */
    public function exportPurchaseHistoryPdf(Request $request)
    {
        try {
            $purchases = PurchaseTransaction::with(['supplier', 'user', 'product'])
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

            $data = [
                'purchases' => $purchases,
                'generated_at' => now()->format('d/m/Y H:i:s'),
                'filters' => $request->all(),
                'total_amount' => $purchases->sum('total_price'),
                'total_quantity' => $purchases->sum('quantity')
            ];

            $pdf = Pdf::loadView('exports.purchase_history_report', $data)->setPaper('a4', 'landscape');

            return $pdf->stream('purchase_history_report_' . now()->format('Ymd_His') . '.pdf');
        } catch (\Exception $e) {
            Log::error('Purchase History PDF Export Error', ['error' => $e->getMessage()]);
            return back()->with('error', 'Gagal mengexport laporan pembelian ke PDF.');
        }
    }

    /**
     * Export Purchase History to Excel
     */
    public function exportPurchaseHistoryExcel(Request $request)
    {
        try {
            return Excel::download(
                new PurchaseHistoryReportExport($request),
                'purchase_history_report_' . now()->format('Ymd_His') . '.xlsx'
            );
        } catch (\Exception $e) {
            Log::error('Purchase History Excel Export Error', ['error' => $e->getMessage()]);
            return back()->with('error', 'Gagal mengexport laporan pembelian ke Excel.');
        }
    }

    /**
     * Supplier Report
     */
    public function supplierReport(Request $request)
    {
        try {
            Log::info('Supplier Report Request', $request->all());

            $request->validate([
                'search' => 'nullable|string|max:255',
                'start_date' => 'nullable|date',
                'end_date' => 'nullable|date|after_or_equal:start_date',
                'per_page' => 'nullable|integer|min:5|max:100',
            ]);

            $perPage = $request->input('per_page', 15);

            // Build supplier query with transaction counts and sums
            $suppliers = Supplier::select(['id', 'name', 'phone', 'email', 'address'])
                ->withCount([
                    'purchaseTransactions as total_transactions' => function ($query) use ($request) {
                        if ($request->filled('start_date')) {
                            $query->whereDate('transaction_date', '>=', $request->start_date);
                        }
                        if ($request->filled('end_date')) {
                            $query->whereDate('transaction_date', '<=', $request->end_date);
                        }
                    }
                ])
                ->withSum([
                    'purchaseTransactions as total_amount' => function ($query) use ($request) {
                        if ($request->filled('start_date')) {
                            $query->whereDate('transaction_date', '>=', $request->start_date);
                        }
                        if ($request->filled('end_date')) {
                            $query->whereDate('transaction_date', '<=', $request->end_date);
                        }
                    }
                ], 'total_price')
                ->when(
                    $request->filled('search'),
                    fn($query) => $query->where('name', 'like', '%' . $request->search . '%')
                )
                ->orderBy('total_amount', 'desc')
                ->orderBy('name')
                ->paginate($perPage)
                ->withQueryString();

            // Fix null values and add product count
            $suppliers->getCollection()->transform(function ($supplier) use ($request) {
                $supplier->total_amount = $supplier->total_amount ?? 0;
                $supplier->total_transactions = $supplier->total_transactions ?? 0;

                // Count products supplied by this supplier
                $supplier->products_count = Product::where('supplier_id', $supplier->id)->count();

                return $supplier;
            });

            // Get overall summary
            $totalSuppliersWithTransactions = $suppliers->getCollection()->where('total_transactions', '>', 0)->count();
            $overallAmount = $suppliers->getCollection()->sum('total_amount');

            Log::info('Supplier Report Results', [
                'total_suppliers' => $suppliers->total(),
                'with_transactions' => $totalSuppliersWithTransactions
            ]);

            return Inertia::render('Reports/SupplierReport', [
                'suppliers' => $suppliers,
                'filters' => $request->all(),
                'summary' => [
                    'total_suppliers' => $suppliers->total(),
                    'active_suppliers' => $totalSuppliersWithTransactions,
                    'total_amount' => $overallAmount,
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Supplier Report Error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return Inertia::render('Reports/SupplierReport', [
                'suppliers' => collect()->paginate(15),
                'filters' => $request->all(),
                'flash' => ['error' => 'Terjadi kesalahan saat memuat laporan supplier.']
            ]);
        }
    }

    /**
     * Export Supplier Report to PDF
     */
    public function exportSupplierPdf(Request $request)
    {
        try {
            $suppliers = $this->getSupplierData($request);

            $data = [
                'suppliers' => $suppliers,
                'generated_at' => now()->format('d/m/Y H:i:s'),
                'filters' => $request->all(),
                'total_amount' => $suppliers->sum('total_amount')
            ];

            $pdf = Pdf::loadView('exports.supplier_report', $data)->setPaper('a4', 'portrait');

            return $pdf->stream('supplier_report_' . now()->format('Ymd_His') . '.pdf');
        } catch (\Exception $e) {
            Log::error('Supplier PDF Export Error', ['error' => $e->getMessage()]);
            return back()->with('error', 'Gagal mengexport laporan supplier ke PDF.');
        }
    }

    /**
     * Export Supplier Report to Excel
     */
    public function exportSupplierExcel(Request $request)
    {
        try {
            return Excel::download(
                new SupplierReportExport($request),
                'supplier_report_' . now()->format('Ymd_His') . '.xlsx'
            );
        } catch (\Exception $e) {
            Log::error('Supplier Excel Export Error', ['error' => $e->getMessage()]);
            return back()->with('error', 'Gagal mengexport laporan supplier ke Excel.');
        }
    }

    /**
     * Get supplier data for export
     */
    private function getSupplierData(Request $request)
    {
        return Supplier::withCount([
            'purchaseTransactions as total_transactions' => function ($query) use ($request) {
                if ($request->filled('start_date')) {
                    $query->whereDate('transaction_date', '>=', $request->start_date);
                }
                if ($request->filled('end_date')) {
                    $query->whereDate('transaction_date', '<=', $request->end_date);
                }
            }
        ])
            ->withSum([
                'purchaseTransactions as total_amount' => function ($query) use ($request) {
                    if ($request->filled('start_date')) {
                        $query->whereDate('transaction_date', '>=', $request->start_date);
                    }
                    if ($request->filled('end_date')) {
                        $query->whereDate('transaction_date', '<=', $request->end_date);
                    }
                }
            ], 'total_price')
            ->when(
                $request->filled('search'),
                fn($query) => $query->where('name', 'like', '%' . $request->search . '%')
            )
            ->orderBy('total_amount', 'desc')
            ->orderBy('name')
            ->get()
            ->map(function ($supplier) {
                $supplier->total_amount = $supplier->total_amount ?? 0;
                $supplier->total_transactions = $supplier->total_transactions ?? 0;
                $supplier->products_count = Product::where('supplier_id', $supplier->id)->count();
                return $supplier;
            });
    }

    /**
     * Sales History Report
     */
    public function salesHistoryReport(Request $request)
    {
        try {
            Log::info('Sales History Report Request', $request->all());

            $request->validate([
                'search' => 'nullable|string|max:255',
                'start_date' => 'nullable|date',
                'end_date' => 'nullable|date|after_or_equal:start_date',
                'per_page' => 'nullable|integer|min:5|max:100',
            ]);

            $perPage = $request->input('per_page', 15);

            // Use StockOut as sales data
            $sales = StockOut::with(['product:id,name,sku,code,price', 'user:id,name'])
                ->select(['id', 'code', 'product_id', 'quantity', 'customer', 'transaction_date', 'date', 'user_id', 'created_at'])
                ->when(
                    $request->filled('search'),
                    fn($query) => $query->where(function ($q) use ($request) {
                        $q->where('customer', 'like', '%' . $request->search . '%')
                            ->orWhere('code', 'like', '%' . $request->search . '%')
                            ->orWhereHas('product', function ($productQuery) use ($request) {
                                $productQuery->where('name', 'like', '%' . $request->search . '%')
                                    ->orWhere('sku', 'like', '%' . $request->search . '%');
                            });
                    })
                )
                ->when(
                    $request->filled('start_date'),
                    fn($query) => $query->where(function ($q) use ($request) {
                        $q->whereDate('transaction_date', '>=', $request->start_date)
                            ->orWhereDate('date', '>=', $request->start_date);
                    })
                )
                ->when(
                    $request->filled('end_date'),
                    fn($query) => $query->where(function ($q) use ($request) {
                        $q->whereDate('transaction_date', '<=', $request->end_date)
                            ->orWhereDate('date', '<=', $request->end_date);
                    })
                )
                ->orderByRaw('COALESCE(transaction_date, date) DESC')
                ->paginate($perPage)
                ->withQueryString();

            // Transform data to match expected format
            $sales->getCollection()->transform(function ($stockOut) {
                $effectiveDate = $stockOut->transaction_date ?: $stockOut->date ?: $stockOut->created_at;
                $pricePerUnit = $stockOut->product->price ?? 0;
                $totalPrice = $stockOut->quantity * $pricePerUnit;

                return (object) [
                    'id' => $stockOut->id,
                    'invoice_number' => $stockOut->code,
                    'transaction_date' => $effectiveDate,
                    'product' => $stockOut->product,
                    'customer_name' => $stockOut->customer,
                    'quantity' => $stockOut->quantity,
                    'price_per_unit' => $pricePerUnit,
                    'total_price' => $totalPrice,
                    'user' => $stockOut->user,
                ];
            });

            // Calculate summary from filtered results
            $baseQuery = StockOut::with('product:id,price')
                ->when(
                    $request->filled('search'),
                    fn($query) => $query->where(function ($q) use ($request) {
                        $q->where('customer', 'like', '%' . $request->search . '%')
                            ->orWhere('code', 'like', '%' . $request->search . '%')
                            ->orWhereHas('product', function ($productQuery) use ($request) {
                                $productQuery->where('name', 'like', '%' . $request->search . '%')
                                    ->orWhere('sku', 'like', '%' . $request->search . '%');
                            });
                    })
                )
                ->when(
                    $request->filled('start_date'),
                    fn($query) => $query->where(function ($q) use ($request) {
                        $q->whereDate('transaction_date', '>=', $request->start_date)
                            ->orWhereDate('date', '>=', $request->start_date);
                    })
                )
                ->when(
                    $request->filled('end_date'),
                    fn($query) => $query->where(function ($q) use ($request) {
                        $q->whereDate('transaction_date', '<=', $request->end_date)
                            ->orWhereDate('date', '<=', $request->end_date);
                    })
                );

            $totalQuantity = $baseQuery->sum('quantity');

            // Calculate total amount by getting all records with product prices
            $totalAmount = $baseQuery->get()->sum(function ($stockOut) {
                return $stockOut->quantity * ($stockOut->product->price ?? 0);
            });

            Log::info('Sales History Results', [
                'total_sales' => $sales->total(),
                'total_amount' => $totalAmount,
                'total_quantity' => $totalQuantity
            ]);

            return Inertia::render('Reports/SalesHistoryReport', [
                'sales' => $sales,
                'filters' => $request->all(),
                'summary' => [
                    'total_transactions' => $sales->total(),
                    'total_amount' => $totalAmount,
                    'total_quantity' => $totalQuantity,
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Sales History Report Error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return Inertia::render('Reports/SalesHistoryReport', [
                'sales' => collect()->paginate(15),
                'filters' => $request->all(),
                'flash' => ['error' => 'Terjadi kesalahan saat memuat laporan penjualan.']
            ]);
        }
    }

    /**
     * Export Sales History to PDF
     */
    public function exportSalesHistoryPdf(Request $request)
    {
        try {
            $sales = StockOut::with(['product:id,name,sku,price', 'user:id,name'])
                ->when(
                    $request->filled('search'),
                    fn($query) => $query->where(function ($q) use ($request) {
                        $q->where('customer', 'like', '%' . $request->search . '%')
                            ->orWhereHas('product', function ($productQuery) use ($request) {
                                $productQuery->where('name', 'like', '%' . $request->search . '%');
                            });
                    })
                )
                ->when(
                    $request->filled('start_date'),
                    fn($query) => $query->where(function ($q) use ($request) {
                        $q->whereDate('transaction_date', '>=', $request->start_date)
                            ->orWhereDate('date', '>=', $request->start_date);
                    })
                )
                ->when(
                    $request->filled('end_date'),
                    fn($query) => $query->where(function ($q) use ($request) {
                        $q->whereDate('transaction_date', '<=', $request->end_date)
                            ->orWhereDate('date', '<=', $request->end_date);
                    })
                )
                ->orderByRaw('COALESCE(transaction_date, date) DESC')
                ->get()
                ->map(function ($stockOut) {
                    $effectiveDate = $stockOut->transaction_date ?: $stockOut->date ?: $stockOut->created_at;
                    $pricePerUnit = $stockOut->product->price ?? 0;
                    $totalPrice = $stockOut->quantity * $pricePerUnit;

                    return (object) [
                        'invoice_number' => $stockOut->code,
                        'transaction_date' => $effectiveDate,
                        'product' => $stockOut->product,
                        'customer_name' => $stockOut->customer,
                        'quantity' => $stockOut->quantity,
                        'price_per_unit' => $pricePerUnit,
                        'total_price' => $totalPrice,
                        'user' => $stockOut->user,
                    ];
                });

            $data = [
                'sales' => $sales,
                'generated_at' => now()->format('d/m/Y H:i:s'),
                'filters' => $request->all(),
                'total_amount' => $sales->sum('total_price'),
                'total_quantity' => $sales->sum('quantity')
            ];

            $pdf = Pdf::loadView('exports.sales_history_report', $data)->setPaper('a4', 'portrait');

            return $pdf->stream('sales_history_report_' . now()->format('Ymd_His') . '.pdf');
        } catch (\Exception $e) {
            Log::error('Sales History PDF Export Error', ['error' => $e->getMessage()]);
            return back()->with('error', 'Gagal mengexport laporan penjualan ke PDF.');
        }
    }

    /**
     * Export Sales History to Excel
     */
    public function exportSalesHistoryExcel(Request $request)
    {
        try {
            return Excel::download(
                new SalesHistoryReportExport($request),
                'sales_history_report_' . now()->format('Ymd_His') . '.xlsx'
            );
        } catch (\Exception $e) {
            Log::error('Sales History Excel Export Error', ['error' => $e->getMessage()]);
            return back()->with('error', 'Gagal mengexport laporan penjualan ke Excel.');
        }
    }

    /**
     * Minimum Stock Report - Updated to use Product model methods
     */
    public function minimumStockReport(Request $request)
    {
        try {
            Log::info('Minimum Stock Report Request', $request->all());

            $request->validate([
                'category_id' => 'nullable|string',
                'per_page' => 'nullable|integer|min:5|max:100',
            ]);

            $perPage = $request->input('per_page', 15);

            // Get products with low stock using the model's method
            $query = Product::with(['category:id,name', 'unit:id,name,symbol', 'supplier:id,name'])
                ->select([
                    'products.id',
                    'products.name',
                    'products.sku',
                    'products.code',
                    'products.current_stock',
                    'products.category_id',
                    'products.unit_id',
                    'products.supplier_id',
                    'products.lead_time',
                    'products.daily_usage_rate',
                    'products.price'
                ])
                ->when(
                    $request->filled('category_id') && $request->category_id !== 'all',
                    fn($query) => $query->where('category_id', $request->category_id)
                );

            // Get all products first, then filter by low stock
            $allProducts = $query->get();

            // Filter products that need reorder using the model method
            $lowStockProducts = $allProducts->filter(function ($product) {
                return $product->needsReorder() || $product->current_stock <= 5;
            });

            // Add calculations and status to each product
            $lowStockProducts->transform(function ($product) {
                $product->rop = $product->calculateRop();
                $product->eoq = $product->calculateEoq();
                $product->stock_status = $product->getStockStatus();
                $product->days_until_stockout = $product->getDaysUntilStockout();
                $product->stock_percentage = $product->getStockPercentage();
                return $product;
            });

            // Sort by urgency (lowest stock first)
            $lowStockProducts = $lowStockProducts->sortBy([
                ['current_stock', 'asc'],
                ['name', 'asc']
            ])->values();

            // Manual pagination
            $currentPage = $request->input('page', 1);
            $offset = ($currentPage - 1) * $perPage;
            $paginatedProducts = $lowStockProducts->slice($offset, $perPage)->values();

            $paginationData = new \Illuminate\Pagination\LengthAwarePaginator(
                $paginatedProducts,
                $lowStockProducts->count(),
                $perPage,
                $currentPage,
                [
                    'path' => $request->url(),
                    'pageName' => 'page',
                ]
            );
            $paginationData->withQueryString();

            $categories = Category::select('id', 'name')->orderBy('name')->get();

            // Calculate summary
            $zeroStockCount = $lowStockProducts->where('current_stock', 0)->count();
            $criticalCount = $lowStockProducts->where('stock_status.status', 'critical')->count();

            Log::info('Minimum Stock Report Results', [
                'total_products_checked' => $allProducts->count(),
                'low_stock_products' => $lowStockProducts->count(),
                'zero_stock' => $zeroStockCount,
                'critical' => $criticalCount
            ]);

            return Inertia::render('Reports/MinimumStockReport', [
                'products' => $paginationData,
                'categories' => $categories,
                'filters' => $request->all(),
                'summary' => [
                    'total_products_checked' => $allProducts->count(),
                    'low_stock_products' => $lowStockProducts->count(),
                    'zero_stock_products' => $zeroStockCount,
                    'critical_products' => $criticalCount,
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Minimum Stock Report Error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return Inertia::render('Reports/MinimumStockReport', [
                'products' => collect()->paginate(15),
                'categories' => collect(),
                'filters' => $request->all(),
                'flash' => ['error' => 'Terjadi kesalahan saat memuat laporan stok minimum.']
            ]);
        }
    }

    /**
     * Export Minimum Stock Report to PDF
     */
    public function exportMinimumStockPdf(Request $request)
    {
        try {
            // Get all products first
            $allProducts = Product::with(['category', 'unit', 'supplier'])
                ->when(
                    $request->filled('category_id') && $request->category_id !== 'all',
                    fn($query) => $query->where('category_id', $request->category_id)
                )
                ->get();

            // Filter products that need reorder
            $products = $allProducts->filter(function ($product) {
                return $product->needsReorder() || $product->current_stock <= 5;
            });

            // Add calculations to each product
            $products->transform(function ($product) {
                $product->rop = $product->calculateRop();
                $product->eoq = $product->calculateEoq();
                $product->stock_status = $product->getStockStatus();
                $product->days_until_stockout = $product->getDaysUntilStockout();
                return $product;
            });

            // Sort by urgency
            $products = $products->sortBy('current_stock')->values();

            $data = [
                'products' => $products,
                'generated_at' => now()->format('d/m/Y H:i:s'),
                'filters' => $request->all(),
            ];

            $pdf = Pdf::loadView('exports.minimum_stock_report', $data)->setPaper('a4', 'portrait');

            return $pdf->stream('minimum_stock_report_' . now()->format('Ymd_His') . '.pdf');
        } catch (\Exception $e) {
            Log::error('Minimum Stock PDF Export Error', ['error' => $e->getMessage()]);
            return back()->with('error', 'Gagal mengexport laporan stok minimum ke PDF.');
        }
    }

    /**
     * Export Minimum Stock Report to Excel
     */
    public function exportMinimumStockExcel(Request $request)
    {
        try {
            return Excel::download(
                new MinimumStockReportExport($request),
                'minimum_stock_report_' . now()->format('Ymd_His') . '.xlsx'
            );
        } catch (\Exception $e) {
            Log::error('Minimum Stock Excel Export Error', ['error' => $e->getMessage()]);
            return back()->with('error', 'Gagal mengexport laporan stok minimum ke Excel.');
        }
    }
}
