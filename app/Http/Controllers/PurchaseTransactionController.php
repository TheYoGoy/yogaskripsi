<?php

namespace App\Http\Controllers;

use App\Models\PurchaseTransaction;
use App\Models\Product;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Barryvdh\DomPDF\Facade\Pdf;
use Milon\Barcode\Facades\DNS1DFacade as DNS1D;
use Illuminate\Support\Facades\Auth;
use SimpleSoftwareIO\QrCode\Facades\QrCode;
use Illuminate\Support\Facades\DB;

class PurchaseTransactionController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(PurchaseTransaction::class, 'purchase_transaction');
    }

    /**
     * Menampilkan daftar transaksi pembelian.
     */
    public function index(Request $request)
    {
        $filters = $request->only([
            'search',
            'transaction_date',
            'supplier_id',
            'product_id',
            'per_page',
            'sort_by',
            'sort_direction',
            'page',
        ]);

        $perPage = (int) ($filters['per_page'] ?? 10);
        $sortBy = $filters['sort_by'] ?? 'transaction_date';
        $sortDirection = $filters['sort_direction'] ?? 'desc';

        $validSortColumns = [
            'transaction_date', 'quantity', 'price_per_unit', 'total_price', 
            'created_at', 'invoice_number', 'status'
        ];
        
        if (!in_array($sortBy, $validSortColumns)) {
            $sortBy = 'transaction_date';
        }
        
        if (!in_array($sortDirection, ['asc', 'desc'])) {
            $sortDirection = 'desc';
        }

        $query = PurchaseTransaction::with([
            'product:id,name,sku,current_stock,supplier_id',
            'product.supplier:id,name',
            'supplier:id,name,phone',
            'user:id,name',
            'stockIns:id,purchase_transaction_id,quantity,transaction_date'
        ]);

        // Apply search filter
        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('invoice_number', 'like', "%{$search}%")
                  ->orWhereHas('product', function ($productQuery) use ($search) {
                      $productQuery->where('name', 'like', "%{$search}%")
                                   ->orWhere('sku', 'like', "%{$search}%");
                  })
                  ->orWhereHas('supplier', function ($supplierQuery) use ($search) {
                      $supplierQuery->where('name', 'like', "%{$search}%");
                  });
            });
        }

        // Apply date filter
        if (!empty($filters['transaction_date'])) {
            $query->whereDate('transaction_date', $filters['transaction_date']);
        }

        // Apply supplier filter
        if (!empty($filters['supplier_id']) && $filters['supplier_id'] !== 'all') {
            $query->where('supplier_id', $filters['supplier_id']);
        }

        // Apply product filter
        if (!empty($filters['product_id']) && $filters['product_id'] !== 'all') {
            $query->where('product_id', $filters['product_id']);
        }

        // Apply sorting
        $query->orderBy($sortBy, $sortDirection);

        $purchaseTransactions = $query->paginate($perPage)->withQueryString();

        // Add computed fields
        $purchaseTransactions->getCollection()->transform(function ($transaction) {
            $transaction->total_stock_in = $transaction->stockIns->sum('quantity');
            $transaction->remaining_quantity = $transaction->quantity - $transaction->total_stock_in;
            return $transaction;
        });

        return Inertia::render('PurchaseTransactions/Index', [
            'purchaseTransactions' => $purchaseTransactions,
            'filters' => $filters,
            'suppliers' => Supplier::select('id', 'name')->orderBy('name')->get(),
            'products' => Product::select('id', 'name')->orderBy('name')->get(),
            'flash' => [
                'success' => session('success'),
                'error' => session('error'),
            ],
        ]);
    }

    /**
     * Form membuat transaksi pembelian baru.
     */
    public function create()
    {
        return Inertia::render('PurchaseTransactions/Create', [
            'products' => Product::with('supplier:id,name,phone')->orderBy('name')->get(),
            'suppliers' => Supplier::select('id', 'name', 'phone', 'address')->orderBy('name')->get(),
        ]);
    }

    /**
     * Simpan transaksi pembelian baru.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'supplier_id' => 'required|exists:suppliers,id',
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|integer|min:1',
            'price_per_unit' => 'required|numeric|min:0',
            'transaction_date' => 'nullable|date',
            'notes' => 'nullable|string|max:1000',
        ], [
            'supplier_id.required' => 'Supplier harus dipilih',
            'product_id.required' => 'Produk harus dipilih',
            'quantity.required' => 'Jumlah harus diisi',
            'quantity.min' => 'Jumlah minimal 1',
            'price_per_unit.required' => 'Harga per unit harus diisi',
            'price_per_unit.min' => 'Harga tidak boleh negatif',
        ]);

        $transactionDate = $validated['transaction_date'] ?? now();
        $dateStr = Carbon::parse($transactionDate)->format('ym');

        try {
            $purchaseTransaction = DB::transaction(function () use ($validated, $transactionDate, $dateStr) {
                // Generate unique invoice number
                $lastInvoice = PurchaseTransaction::where('invoice_number', 'like', "INV-{$dateStr}-%")
                    ->lockForUpdate()
                    ->latest('id')
                    ->first();

                if ($lastInvoice && preg_match('/(\d{3})$/', $lastInvoice->invoice_number, $matches)) {
                    $nextNumber = intval($matches[1]) + 1;
                } else {
                    $nextNumber = 1;
                }

                $increment = str_pad($nextNumber, 3, '0', STR_PAD_LEFT);
                $invoiceNumber = "INV-{$dateStr}-{$increment}";

                // Ensure invoice number is unique
                while (PurchaseTransaction::where('invoice_number', $invoiceNumber)->exists()) {
                    $nextNumber++;
                    $increment = str_pad($nextNumber, 3, '0', STR_PAD_LEFT);
                    $invoiceNumber = "INV-{$dateStr}-{$increment}";
                }

                return PurchaseTransaction::create([
                    'invoice_number' => $invoiceNumber,
                    'supplier_id' => $validated['supplier_id'],
                    'product_id' => $validated['product_id'],
                    'quantity' => $validated['quantity'],
                    'price_per_unit' => $validated['price_per_unit'],
                    'total_price' => $validated['quantity'] * $validated['price_per_unit'],
                    'transaction_date' => $transactionDate,
                    'user_id' => Auth::id(),
                    'notes' => $validated['notes'] ?? null,
                    'status' => 'pending',
                ]);
            });

            Log::info('Purchase transaction created successfully', [
                'id' => $purchaseTransaction->id,
                'invoice_number' => $purchaseTransaction->invoice_number,
                'user_id' => Auth::id()
            ]);

            return redirect()
                ->route('purchase-transactions.index')
                ->with('success', "Transaksi pembelian berhasil dicatat dengan invoice: {$purchaseTransaction->invoice_number}");

        } catch (\Exception $e) {
            Log::error('Error creating purchase transaction', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
                'line' => $e->getLine(),
                'file' => $e->getFile(),
                'data' => $validated
            ]);

            return back()
                ->withInput()
                ->with('error', 'Gagal menyimpan transaksi pembelian. Silakan coba lagi.');
        }
    }

    /**
     * Edit transaksi pembelian.
     */
    public function edit(PurchaseTransaction $purchaseTransaction)
    {
        $purchaseTransaction->load([
            'product:id,name,current_stock,supplier_id',
            'supplier:id,name,phone',
            'stockIns:id,purchase_transaction_id,quantity,transaction_date,code'
        ]);

        return Inertia::render('PurchaseTransactions/Edit', [
            'purchaseTransaction' => $purchaseTransaction,
            'products' => Product::select('id', 'name', 'current_stock', 'supplier_id')->orderBy('name')->get(),
            'suppliers' => Supplier::select('id', 'name', 'phone')->orderBy('name')->get(),
        ]);
    }

    /**
     * Update transaksi pembelian.
     */
    public function update(Request $request, PurchaseTransaction $purchaseTransaction)
    {
        $validated = $request->validate([
            'invoice_number' => [
                'required',
                'string',
                'max:255',
                'unique:purchase_transactions,invoice_number,' . $purchaseTransaction->id
            ],
            'supplier_id' => 'required|exists:suppliers,id',
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|integer|min:1',
            'price_per_unit' => 'required|numeric|min:0',
            'transaction_date' => 'required|date',
            'notes' => 'nullable|string|max:1000',
            'status' => 'nullable|in:pending,completed',
        ]);

        $validated['total_price'] = $validated['quantity'] * $validated['price_per_unit'];

        try {
            DB::transaction(function () use ($purchaseTransaction, $validated) {
                $oldQuantity = $purchaseTransaction->quantity;
                $newQuantity = $validated['quantity'];
                
                $purchaseTransaction->update($validated);
                
                // Update status based on stock ins
                $totalStockIn = $purchaseTransaction->stockIns()->sum('quantity');
                if ($totalStockIn >= $newQuantity) {
                    $purchaseTransaction->update(['status' => 'completed']);
                } else {
                    $purchaseTransaction->update(['status' => 'pending']);
                }
                
                Log::info('Purchase transaction updated', [
                    'id' => $purchaseTransaction->id,
                    'old_quantity' => $oldQuantity,
                    'new_quantity' => $newQuantity,
                    'user_id' => Auth::id()
                ]);
            });

            return redirect()
                ->route('purchase-transactions.index')
                ->with('success', 'Transaksi pembelian berhasil diupdate.');

        } catch (\Exception $e) {
            Log::error('Error updating purchase transaction', [
                'transaction_id' => $purchaseTransaction->id,
                'user_id' => Auth::id(),
                'error' => $e->getMessage()
            ]);

            return back()
                ->withInput()
                ->with('error', 'Gagal mengupdate transaksi pembelian.');
        }
    }

    /**
     * Hapus transaksi pembelian.
     */
    public function destroy(PurchaseTransaction $purchaseTransaction)
    {
        try {
            DB::transaction(function () use ($purchaseTransaction) {
                $invoiceNumber = $purchaseTransaction->invoice_number;
                
                // Check if there are related stock ins
                $stockInsCount = $purchaseTransaction->stockIns()->count();
                if ($stockInsCount > 0) {
                    throw new \Exception("Tidak dapat menghapus transaksi yang sudah memiliki stock in. Hapus stock in terkait terlebih dahulu.");
                }
                
                $purchaseTransaction->delete();
                
                Log::info('Purchase transaction deleted', [
                    'invoice_number' => $invoiceNumber,
                    'user_id' => Auth::id()
                ]);
            });

            return redirect()
                ->route('purchase-transactions.index')
                ->with('success', "Transaksi {$purchaseTransaction->invoice_number} berhasil dihapus.");

        } catch (\Exception $e) {
            Log::error('Error deleting purchase transaction', [
                'transaction_id' => $purchaseTransaction->id,
                'user_id' => Auth::id(),
                'error' => $e->getMessage()
            ]);

            return back()->with('error', $e->getMessage());
        }
    }

    /**
     * Bulk delete transaksi pembelian.
     */
    public function bulkDelete(Request $request)
    {
        $request->validate([
            'ids' => 'required|array|min:1|max:100',
            'ids.*' => 'exists:purchase_transactions,id',
        ]);

        try {
            DB::transaction(function () use ($request) {
                $transactions = PurchaseTransaction::whereIn('id', $request->ids)
                    ->withCount('stockIns')
                    ->get();
                
                $hasStockIns = $transactions->where('stock_ins_count', '>', 0);
                if ($hasStockIns->count() > 0) {
                    $invoices = $hasStockIns->pluck('invoice_number')->take(3)->join(', ');
                    throw new \Exception("Tidak dapat menghapus transaksi yang sudah memiliki stock in: {$invoices}" . 
                        ($hasStockIns->count() > 3 ? ' dan lainnya.' : '.'));
                }
                
                $count = $transactions->count();
                PurchaseTransaction::whereIn('id', $request->ids)->delete();
                
                Log::info('Bulk delete purchase transactions', [
                    'count' => $count,
                    'user_id' => Auth::id()
                ]);
            });

            $count = count($request->ids);
            return back()->with('success', "{$count} transaksi pembelian berhasil dihapus.");

        } catch (\Exception $e) {
            Log::error('Error bulk deleting purchase transactions', [
                'ids' => $request->ids,
                'user_id' => Auth::id(),
                'error' => $e->getMessage()
            ]);

            return back()->with('error', $e->getMessage());
        }
    }

    /**
     * Generate barcode SVG transaksi pembelian.
     */
    public function generateBarcode(PurchaseTransaction $purchaseTransaction)
    {
        try {
            $this->authorize('view', $purchaseTransaction);

            $barcode = DNS1D::getBarcodeSVG($purchaseTransaction->invoice_number, 'C128', 2, 100);

            return response()->json([
                'svg' => $barcode,
                'invoice_number' => $purchaseTransaction->invoice_number
            ]);

        } catch (\Exception $e) {
            Log::error('Error generating barcode', [
                'transaction_id' => $purchaseTransaction->id,
                'error' => $e->getMessage()
            ]);

            return response()->json(['error' => 'Gagal generate barcode'], 500);
        }
    }

    /**
     * Download barcode QR transaksi pembelian.
     */
    public function downloadBarcode(PurchaseTransaction $purchaseTransaction)
    {
        try {
            $this->authorize('view', $purchaseTransaction);

            $svg = QrCode::format('svg')
                ->size(300)
                ->generate($purchaseTransaction->invoice_number);

            $filename = "qr_" . preg_replace('/[^A-Za-z0-9\-_]/', '_', $purchaseTransaction->invoice_number) . ".svg";

            return response($svg)
                ->header('Content-Type', 'image/svg+xml')
                ->header('Content-Disposition', 'attachment; filename="' . $filename . '"');

        } catch (\Exception $e) {
            Log::error('Error downloading barcode', [
                'transaction_id' => $purchaseTransaction->id,
                'error' => $e->getMessage()
            ]);

            return back()->with('error', 'Gagal download QR code.');
        }
    }

    /**
     * Print invoice transaksi pembelian sebagai PDF.
     */
    public function printInvoice(PurchaseTransaction $purchaseTransaction)
    {
        $this->authorize('view', $purchaseTransaction);

        $purchaseTransaction->load(['product', 'supplier', 'user']);

        try {
            $pdf = Pdf::loadView('purchase_transactions.invoice', [
                'transaction' => $purchaseTransaction,
            ])
                ->setPaper('a4', 'portrait')
                ->setOptions([
                    'dpi' => 150,
                    'defaultFont' => 'sans-serif',
                    'isHtml5ParserEnabled' => true,
                    'isPhpEnabled' => true
                ]);

            $filename = "invoice_" . preg_replace('/[^A-Za-z0-9\-_]/', '_', $purchaseTransaction->invoice_number) . ".pdf";

            return $pdf->stream($filename);

        } catch (\Exception $e) {
            Log::error('Error generating PDF invoice', [
                'transaction_id' => $purchaseTransaction->id,
                'invoice_number' => $purchaseTransaction->invoice_number,
                'user_id' => Auth::id(),
                'error' => $e->getMessage()
            ]);

            return back()->with('error', 'Gagal generate invoice PDF. Silakan coba lagi.');
        }
    }

    /**
     * Search product by code untuk autofill
     */
    public function searchProductByCode($code)
    {
        try {
            $product = Product::with('supplier:id,name,phone,address')
                ->where('code', $code)
                ->orWhere('sku', $code)
                ->first();

            if (!$product) {
                return response()->json([
                    'message' => 'Produk tidak ditemukan'
                ], 404);
            }

            return response()->json([
                'product' => [
                    'id' => $product->id,
                    'name' => $product->name,
                    'sku' => $product->sku,
                    'current_stock' => $product->current_stock,
                    'supplier_id' => $product->supplier_id,
                    'supplier' => $product->supplier
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Error searching product by code', [
                'code' => $code,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'message' => 'Terjadi kesalahan server'
            ], 500);
        }
    }

    /**
     * Get purchase transaction status summary
     */
    public function getStatusSummary()
    {
        try {
            $summary = [
                'total_transactions' => PurchaseTransaction::count(),
                'pending_transactions' => PurchaseTransaction::where('status', 'pending')->count(),
                'completed_transactions' => PurchaseTransaction::where('status', 'completed')->count(),
                'total_value' => PurchaseTransaction::sum('total_price'),
                'this_month' => PurchaseTransaction::whereMonth('transaction_date', now()->month)
                    ->whereYear('transaction_date', now()->year)
                    ->sum('total_price'),
            ];

            return response()->json($summary);

        } catch (\Exception $e) {
            Log::error('Error getting purchase transaction summary', [
                'error' => $e->getMessage()
            ]);

            return response()->json(['error' => 'Gagal mengambil ringkasan'], 500);
        }
    }
}