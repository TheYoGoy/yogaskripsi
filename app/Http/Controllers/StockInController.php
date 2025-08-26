<?php

namespace App\Http\Controllers;

use App\Models\StockIn;
use App\Models\Product;
use App\Models\PurchaseTransaction;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Supplier;
use Illuminate\Support\Facades\Auth;
use App\Models\Setting;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class StockInController extends Controller
{
    /**
     * Constructor untuk mengaktifkan otorisasi berbasis StockInPolicy.
     */
    public function __construct()
    {
        $this->authorizeResource(StockIn::class, 'stock_in');
    }

    /**
     * Menampilkan daftar transaksi stock in.
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

        $perPage = $filters['per_page'] ?? 10;
        $sortBy = $filters['sort_by'] ?? 'transaction_date';
        $sortDirection = $filters['sort_direction'] ?? 'desc';

        $validSortColumns = ['transaction_date', 'quantity', 'created_at', 'code'];
        if (!in_array($sortBy, $validSortColumns)) {
            $sortBy = 'transaction_date';
        }
        if (!in_array($sortDirection, ['asc', 'desc'])) {
            $sortDirection = 'desc';
        }

        $stockIns = StockIn::with(['product.supplier', 'user', 'supplier'])
            ->when($filters['search'] ?? null, function ($query, $search) {
                $query->whereHas('product', function ($q) use ($search) {
                    $q->where('name', 'like', "%$search%")
                        ->orWhere('sku', 'like', "%$search%")
                        ->orWhere('code', 'like', "%$search%");
                })
                    ->orWhereHas('supplier', function ($q) use ($search) {
                        $q->where('name', 'like', "%$search%");
                    })
                    ->orWhere('code', 'like', "%$search%");
            })
            ->when($filters['transaction_date'] ?? null, function ($query, $date) {
                $query->whereDate('transaction_date', $date);
            })
            ->when($filters['supplier_id'] ?? null, function ($query, $supplierId) {
                $query->where('supplier_id', $supplierId);
            })
            ->when($filters['product_id'] ?? null, function ($query, $productId) {
                $query->where('product_id', $productId);
            })
            ->orderBy($sortBy, $sortDirection)
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('StockIns/Index', [
            'stockIns' => $stockIns,
            'filters' => $filters,
            'products' => Product::select('id', 'name')->get(),
            'suppliers' => Supplier::select('id', 'name')->get(),
            'flash' => [
                'success' => session('success'),
                'error' => session('error'),
            ],
        ]);
    }

    /**
     * Menampilkan form untuk membuat transaksi stock in baru.
     */
    public function create()
    {
        return Inertia::render('StockIns/Create', [
            'products' => Product::all(),
            'suppliers' => Supplier::all(),
        ]);
    }

    /**
     * Menyimpan transaksi stock in baru ke database.
     */
    public function store(Request $request)
{
    $validated = $request->validate([
        'product_id' => 'required|exists:products,id',
        'supplier_id' => 'nullable|exists:suppliers,id',
        'quantity' => 'required|numeric|min:1',
        'stockin_date' => 'required|date', // Ubah dari transaction_date ke stockin_date
        'source' => 'nullable|string|max:255',
        'code' => 'nullable|string',
        'purchase_transaction_id' => 'nullable|exists:purchase_transactions,id',
    ]);

    try {
        DB::transaction(function () use ($validated) {
            // Generate kode jika tidak ada
            if (empty($validated['code'])) {
                $settings = Setting::first();
                $prefix = $settings->stock_prefix_in ?? 'SIN-';
                $latestId = StockIn::max('id') + 1;
                $validated['code'] = $prefix . str_pad($latestId, 5, '0', STR_PAD_LEFT);
            }

            // Update stok produk
            $product = Product::find($validated['product_id']);
            if ($product) {
                $product->increment('current_stock', $validated['quantity']);
            }

            // Simpan StockIn dengan field yang benar
            StockIn::create([
                'code' => $validated['code'],
                'product_id' => $validated['product_id'],
                'quantity' => $validated['quantity'],
                'supplier_id' => $validated['supplier_id'], // Gunakan supplier_id, bukan supplier
                'transaction_date' => $validated['stockin_date'], // Map stockin_date ke transaction_date
                'source' => $validated['source'],
                'user_id' => Auth::id(),
                'purchase_transaction_id' => $validated['purchase_transaction_id'] ?? null,
                // supplier_name akan di-auto fill oleh model boot method
            ]);

            // Update status purchase transaction jika ada
            if (!empty($validated['purchase_transaction_id'])) {
                $purchase = PurchaseTransaction::find($validated['purchase_transaction_id']);
                if ($purchase) {
                    $totalReceived = StockIn::where('purchase_transaction_id', $purchase->id)->sum('quantity');

                    if ($totalReceived >= $purchase->quantity && $purchase->status !== 'completed') {
                        $purchase->update(['status' => 'completed']);
                    }
                }
            }
        });

        return redirect()
            ->route('stock-ins.index')
            ->with('success', 'Stock In recorded successfully.');
    } catch (\Exception $e) {
        Log::error('Error creating stock in', [
            'user_id' => Auth::id(),
            'error' => $e->getMessage(),
            'data' => $validated
        ]);

        return back()
            ->withInput()
            ->with('error', 'Gagal menyimpan stock in. Silakan coba lagi.');
    }
}

    /**
     * Menghapus transaksi stock in dari database.
     */
    public function destroy(StockIn $stockIn)
    {
        try {
            DB::transaction(function () use ($stockIn) {
                // Rollback stok produk
                $product = $stockIn->product;
                if ($product && $product->current_stock >= $stockIn->quantity) {
                    $product->decrement('current_stock', $stockIn->quantity);
                } elseif ($product) {
                    // Jika stok tidak cukup, set ke 0
                    $product->update(['current_stock' => 0]);
                    Log::warning('Stock became negative, set to 0', [
                        'product_id' => $product->id,
                        'stockin_id' => $stockIn->id
                    ]);
                }

                // Update status purchase transaction jika perlu
                if ($stockIn->purchase_transaction_id) {
                    $purchase = PurchaseTransaction::find($stockIn->purchase_transaction_id);
                    if ($purchase && $purchase->status === 'completed') {
                        $remainingReceived = StockIn::where('purchase_transaction_id', $purchase->id)
                            ->where('id', '!=', $stockIn->id)
                            ->sum('quantity');

                        if ($remainingReceived < $purchase->quantity) {
                            $purchase->update(['status' => 'pending']);
                        }
                    }
                }

                $stockIn->delete();
            });

            return redirect()
                ->route('stock-ins.index')
                ->with('success', 'Stock In deleted successfully.');
        } catch (\Exception $e) {
            Log::error('Error deleting stock in', [
                'stockin_id' => $stockIn->id,
                'user_id' => Auth::id(),
                'error' => $e->getMessage()
            ]);

            return back()->with('error', 'Gagal menghapus stock in.');
        }
    }

    /**
     * Bulk delete transaksi stock in.
     */
    public function bulkDelete(Request $request)
    {
        $request->validate([
            'ids' => 'required|array|min:1|max:100',
            'ids.*' => 'exists:stock_ins,id',
        ]);

        try {
            DB::transaction(function () use ($request) {
                $stockIns = StockIn::whereIn('id', $request->ids)->with('product')->get();

                foreach ($stockIns as $stockIn) {
                    // Rollback stok untuk setiap item
                    if ($stockIn->product && $stockIn->product->current_stock >= $stockIn->quantity) {
                        $stockIn->product->decrement('current_stock', $stockIn->quantity);
                    } elseif ($stockIn->product) {
                        $stockIn->product->update(['current_stock' => 0]);
                    }
                }

                StockIn::whereIn('id', $request->ids)->delete();
            });

            $count = count($request->ids);
            return back()->with('success', "{$count} stock in berhasil dihapus.");
        } catch (\Exception $e) {
            Log::error('Error bulk deleting stock ins', [
                'ids' => $request->ids,
                'user_id' => Auth::id(),
                'error' => $e->getMessage()
            ]);

            return back()->with('error', 'Gagal menghapus stock in terpilih.');
        }
    }

    /**
     * Auto-fill data berdasarkan barcode/QR code.
     */
    public function autofill($code)
    {
        try {
            Log::info('Autofill called with code: ' . $code);
            
            if (str_starts_with($code, 'INV-')) {
                // QR Invoice -> cari dari PurchaseTransaction
                $purchaseTransaction = PurchaseTransaction::where('invoice_number', $code)
                    ->latest()
                    ->with(['product.supplier', 'supplier'])
                    ->first();

                if (!$purchaseTransaction) {
                    Log::info('Purchase transaction not found for: ' . $code);
                    return response()->json(['message' => 'Purchase transaction tidak ditemukan'], 404);
                }

                return response()->json([
                    'product_id' => $purchaseTransaction->product_id,
                    'supplier_id' => $purchaseTransaction->supplier_id,
                    'quantity' => $purchaseTransaction->quantity,
                    'stockin_date' => $purchaseTransaction->transaction_date
                        ? $purchaseTransaction->transaction_date->format('Y-m-d')
                        : now()->format('Y-m-d'),
                    'purchase_transaction_id' => $purchaseTransaction->id,
                ]);
            } 
            elseif (str_starts_with($code, 'PRD-')) {
                // QR Product berdasarkan code -> cari dari Product
                $product = Product::where('code', $code)
                    ->with('supplier')
                    ->first();

                if (!$product) {
                    Log::info('Product not found with code: ' . $code);
                    return response()->json(['message' => 'Product tidak ditemukan'], 404);
                }

                Log::info('Found product with supplier: ', [
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'supplier_id' => $product->supplier_id,
                    'supplier_name' => $product->supplier ? $product->supplier->name : null
                ]);

                return response()->json([
                    'product_id' => $product->id,
                    'supplier_id' => $product->supplier_id, // ✅ FIXED: Pastikan supplier_id ada
                    'quantity' => 1,
                    'stockin_date' => now()->format('Y-m-d'),
                ]);
            } 
            else {
                Log::info('Searching for general barcode: ' . $code);
                
                // ✅ FIXED: Barcode umum -> cari berdasarkan SKU, Code dengan eager loading supplier
                $product = Product::where(function($query) use ($code) {
                    $query->where('sku', $code)
                          ->orWhere('code', $code);
                })
                ->with('supplier') // ✅ IMPORTANT: Load supplier relationship
                ->first();
                
                if ($product) {
                    Log::info('Product found via general search: ', [
                        'id' => $product->id,
                        'name' => $product->name,
                        'sku' => $product->sku,
                        'code' => $product->code,
                        'supplier_id' => $product->supplier_id,
                        'supplier_name' => $product->supplier ? $product->supplier->name : null
                    ]);

                    // ✅ FIXED: Return product dengan supplier data yang lengkap
                    return response()->json([
                        'product_id' => $product->id,
                        'supplier_id' => $product->supplier_id, // ✅ Pastikan supplier_id included
                        'quantity' => 1,
                        'stockin_date' => now()->format('Y-m-d'),
                    ]);
                }

                // ✅ FIXED: Jika tidak ditemukan di product, coba cari di purchase transactions
                $purchaseTransaction = PurchaseTransaction::where('invoice_number', $code)
                    ->orWhereHas('product', function($q) use ($code) {
                        $q->where('sku', $code)
                          ->orWhere('code', $code);
                    })
                    ->latest()
                    ->with(['product.supplier', 'supplier'])
                    ->first();

                if ($purchaseTransaction) {
                    Log::info('Found via purchase transaction search');
                    return response()->json([
                        'product_id' => $purchaseTransaction->product_id,
                        'supplier_id' => $purchaseTransaction->supplier_id ?: $purchaseTransaction->product->supplier_id,
                        'quantity' => $purchaseTransaction->quantity,
                        'stockin_date' => $purchaseTransaction->transaction_date
                            ? $purchaseTransaction->transaction_date->format('Y-m-d')
                            : now()->format('Y-m-d'),
                        'purchase_transaction_id' => $purchaseTransaction->id,
                    ]);
                }

                Log::info('No data found for code: ' . $code);
                return response()->json(['message' => 'Product atau transaksi tidak ditemukan'], 404);
            }
        } catch (\Exception $e) {
            Log::error('Error in autofill', [
                'code' => $code,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json(['message' => 'Internal server error: ' . $e->getMessage()], 500);
        }
    }
}
