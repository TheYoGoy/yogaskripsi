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
    public function __construct()
    {
        $this->authorizeResource(StockIn::class, 'stock_in');
    }

    /**
     * Menampilkan daftar stock in
     */
    public function index(Request $request)
    {
        Log::info('=== STOCK IN INDEX START ===');
        Log::info('Request filters:', $request->all());
        
        $filters = $request->only([
            'search',
            'transaction_date',
            'supplier_id', // Changed from supplier_name to supplier_id
            'product_id',
            'per_page',
            'sort_by',
            'sort_direction',
            'page',
        ]);

        $perPage = (int) ($filters['per_page'] ?? 10);
        $sortBy = $filters['sort_by'] ?? 'id';
        $sortDirection = $filters['sort_direction'] ?? 'desc';

        // Valid sort columns sesuai database
        $validSortColumns = ['id', 'date', 'transaction_date', 'quantity', 'created_at', 'code'];
        if (!in_array($sortBy, $validSortColumns)) {
            $sortBy = 'id';
        }

        if (!in_array($sortDirection, ['asc', 'desc'])) {
            $sortDirection = 'desc';
        }

        // Build query with proper relationships
        $query = StockIn::query()->with([
            'product:id,name,sku,code,current_stock,supplier_id',
            'product.supplier:id,name,phone',
            'user:id,name'
        ]);

        // Apply search filter
        if (!empty($filters['search'])) {
            $search = trim($filters['search']);
            Log::info('Applying search filter: ' . $search);
            
            $query->where(function($q) use ($search) {
                $q->where('code', 'like', "%$search%")
                  ->orWhere('supplier', 'like', "%$search%")
                  ->orWhere('source', 'like', "%$search%")
                  ->orWhereHas('product', function ($productQuery) use ($search) {
                      $productQuery->where('name', 'like', "%$search%")
                                   ->orWhere('sku', 'like', "%$search%")
                                   ->orWhere('code', 'like', "%$search%");
                  })
                  ->orWhereHas('user', function ($userQuery) use ($search) {
                      $userQuery->where('name', 'like', "%$search%");
                  });
            });
        }

        // Apply date filter
        if (!empty($filters['transaction_date'])) {
            Log::info('Applying date filter: ' . $filters['transaction_date']);
            $query->where(function($q) use ($filters) {
                $q->whereDate('date', $filters['transaction_date'])
                  ->orWhereDate('transaction_date', $filters['transaction_date']);
            });
        }

        // Apply supplier filter - now using supplier_id
        if (!empty($filters['supplier_id']) && $filters['supplier_id'] !== 'all') {
            Log::info('Applying supplier filter: ' . $filters['supplier_id']);
            $query->whereHas('product.supplier', function($q) use ($filters) {
                $q->where('id', $filters['supplier_id']);
            });
        }

        // Apply product filter
        if (!empty($filters['product_id']) && $filters['product_id'] !== 'all') {
            Log::info('Applying product filter: ' . $filters['product_id']);
            $query->where('product_id', $filters['product_id']);
        }

        // Count total before pagination for debug
        $totalInDb = StockIn::count();
        $filteredTotal = $query->count();

        // Apply sorting
        if ($sortBy === 'code') {
            $query->orderBy('code', $sortDirection);
        } elseif ($sortBy === 'quantity') {
            $query->orderBy('quantity', $sortDirection);
        } elseif ($sortBy === 'transaction_date') {
            $query->orderBy('transaction_date', $sortDirection)
                  ->orderBy('date', $sortDirection);
        } else {
            $query->orderBy($sortBy, $sortDirection);
        }
        
        // Secondary sort for consistency
        if ($sortBy !== 'id') {
            $query->orderBy('id', 'desc');
        }

        Log::info('Final SQL Query: ' . $query->toSql());
        Log::info('Query Bindings: ', $query->getBindings());

        $stockIns = $query->paginate($perPage)->withQueryString();
        
        // Debug information
        $debug = [
            'total_in_db' => $totalInDb,
            'query_total' => $filteredTotal,
            'sql_query' => $query->toSql(),
            'bindings' => $query->getBindings()
        ];

        Log::info('Query results:', [
            'total_db' => $totalInDb,
            'filtered_total' => $filteredTotal,
            'paginated_total' => $stockIns->total(),
            'current_page' => $stockIns->currentPage(),
            'per_page' => $stockIns->perPage(),
            'count' => $stockIns->count()
        ]);

        Log::info('=== STOCK IN INDEX END ===');

        return Inertia::render('StockIns/Index', [
            'stockIns' => $stockIns,
            'filters' => $filters,
            'products' => Product::select('id', 'name', 'current_stock')->orderBy('name')->get(),
            'suppliers' => Supplier::select('id', 'name')->orderBy('name')->get(),
            'debug' => $debug, // Add debug info
            'flash' => [
                'success' => session('success'),
                'error' => session('error'),
            ]
        ]);
    }

    /**
     * Form create
     */
    public function create()
    {
        return Inertia::render('StockIns/Create', [
            'products' => Product::with('supplier:id,name,phone')->orderBy('name')->get(),
            'suppliers' => Supplier::select('id', 'name', 'phone')->orderBy('name')->get(),
        ]);
    }

    /**
     * Store stock in baru
     */
    public function store(Request $request)
    {
        Log::info('=== STOCKIN STORE START ===');
        Log::info('Request data:', $request->all());

        try {
            $validated = $request->validate([
                'product_id' => 'required|integer|exists:products,id',
                'supplier_name' => 'nullable|string|max:255',
                'quantity' => 'required|integer|min:1',
                'transaction_date' => 'required|date',
                'source' => 'nullable|string|max:255',
                'code' => 'nullable|string|max:255',
                'purchase_transaction_id' => 'nullable|integer|exists:purchase_transactions,id',
            ], [
                'product_id.required' => 'Produk harus dipilih',
                'product_id.exists' => 'Produk yang dipilih tidak valid',
                'quantity.required' => 'Jumlah harus diisi',
                'quantity.min' => 'Jumlah minimal adalah 1',
                'transaction_date.required' => 'Tanggal transaksi harus diisi',
                'transaction_date.date' => 'Format tanggal tidak valid',
            ]);

            Log::info('Validation passed:', $validated);

            DB::beginTransaction();

            try {
                // Generate code jika kosong
                if (empty($validated['code'])) {
                    try {
                        $settings = Setting::first();
                        $prefix = $settings->stock_prefix_in ?? 'SIN-';
                    } catch (\Exception $e) {
                        $prefix = 'SIN-';
                        Log::warning('Failed to get settings, using default prefix');
                    }
                    
                    $latestId = StockIn::max('id') ?? 0;
                    $nextId = $latestId + 1;
                    $validated['code'] = $prefix . str_pad($nextId, 5, '0', STR_PAD_LEFT);
                    
                    // Ensure unique code
                    while (StockIn::where('code', $validated['code'])->exists()) {
                        $nextId++;
                        $validated['code'] = $prefix . str_pad($nextId, 5, '0', STR_PAD_LEFT);
                    }
                }

                Log::info('Generated code: ' . $validated['code']);

                // Get product to determine supplier if not provided
                $product = Product::with('supplier')->find($validated['product_id']);
                if (!$product) {
                    throw new \Exception('Product not found');
                }

                // Prepare data sesuai struktur database
                $stockInData = [
                    'code' => $validated['code'],
                    'product_id' => $validated['product_id'],
                    'quantity' => $validated['quantity'],
                    'date' => $validated['transaction_date'],
                    'transaction_date' => $validated['transaction_date'],
                    'supplier' => $validated['supplier_name'] ?: ($product->supplier->name ?? ''),
                    'source' => $validated['source'] ?? '',
                    'user_id' => Auth::id(),
                    'purchase_transaction_id' => $validated['purchase_transaction_id'] ?? null,
                ];

                Log::info('Creating StockIn with data:', $stockInData);

                $stockIn = StockIn::create($stockInData);

                Log::info('StockIn created successfully with ID: ' . $stockIn->id);

                // Update product stock
                $oldStock = $product->current_stock;
                $product->increment('current_stock', $validated['quantity']);
                $product->refresh();
                
                Log::info('Product stock updated:', [
                    'product_id' => $product->id,
                    'old_stock' => $oldStock,
                    'new_stock' => $product->current_stock,
                    'added' => $validated['quantity']
                ]);

                // Update purchase transaction jika ada
                if (!empty($validated['purchase_transaction_id'])) {
                    $purchase = PurchaseTransaction::find($validated['purchase_transaction_id']);
                    if ($purchase) {
                        $totalReceived = StockIn::where('purchase_transaction_id', $purchase->id)
                                               ->sum('quantity');
                        
                        if ($totalReceived >= $purchase->quantity) {
                            $purchase->update(['status' => 'completed']);
                            Log::info('Purchase transaction marked as completed: ' . $purchase->id);
                        }
                    }
                }

                DB::commit();

                Log::info('=== STOCKIN STORE SUCCESS ===');

                return redirect()
                    ->route('stock-ins.index')
                    ->with('success', 'Stock In berhasil dicatat! Kode: ' . $stockIn->code);

            } catch (\Exception $e) {
                DB::rollBack();
                Log::error('Transaction failed:', [
                    'error' => $e->getMessage(),
                    'line' => $e->getLine(),
                    'file' => $e->getFile()
                ]);
                throw $e;
            }

        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Validation failed:', $e->errors());
            return back()
                ->withInput()
                ->withErrors($e->errors());

        } catch (\Exception $e) {
            Log::error('Store error:', [
                'message' => $e->getMessage(),
                'line' => $e->getLine(),
                'file' => $e->getFile(),
                'user_id' => Auth::id(),
                'request_data' => $request->all()
            ]);

            return back()
                ->withInput()
                ->with('error', 'Gagal menyimpan stock in: ' . $e->getMessage());
        }
    }

    /**
     * Delete stock in
     */
    public function destroy(StockIn $stockIn)
    {
        try {
            DB::transaction(function () use ($stockIn) {
                Log::info('Deleting stock in with ID: ' . $stockIn->id);
                
                // Rollback product stock
                $product = $stockIn->product;
                if ($product) {
                    if ($product->current_stock >= $stockIn->quantity) {
                        $product->decrement('current_stock', $stockIn->quantity);
                        Log::info('Product stock decremented by: ' . $stockIn->quantity);
                    } else {
                        $product->update(['current_stock' => 0]);
                        Log::warning('Product stock set to 0 due to insufficient stock');
                    }
                }

                // Update purchase transaction status
                if ($stockIn->purchase_transaction_id) {
                    $purchase = PurchaseTransaction::find($stockIn->purchase_transaction_id);
                    if ($purchase && $purchase->status === 'completed') {
                        $remainingReceived = StockIn::where('purchase_transaction_id', $purchase->id)
                            ->where('id', '!=', $stockIn->id)
                            ->sum('quantity');

                        if ($remainingReceived < $purchase->quantity) {
                            $purchase->update(['status' => 'pending']);
                            Log::info('Purchase transaction status reverted to pending');
                        }
                    }
                }

                $stockIn->delete();
                Log::info('StockIn deleted successfully');
            });

            return redirect()
                ->route('stock-ins.index')
                ->with('success', 'Stock In berhasil dihapus.');

        } catch (\Exception $e) {
            Log::error('Delete error:', [
                'stockin_id' => $stockIn->id,
                'error' => $e->getMessage()
            ]);

            return back()->with('error', 'Gagal menghapus stock in: ' . $e->getMessage());
        }
    }

    /**
     * Bulk delete
     */
    public function bulkDelete(Request $request)
    {
        $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'exists:stock_ins,id',
        ]);

        try {
            DB::transaction(function () use ($request) {
                $stockIns = StockIn::whereIn('id', $request->ids)->with('product')->get();

                Log::info('Bulk deleting stock ins:', ['count' => $stockIns->count()]);

                foreach ($stockIns as $stockIn) {
                    if ($stockIn->product) {
                        if ($stockIn->product->current_stock >= $stockIn->quantity) {
                            $stockIn->product->decrement('current_stock', $stockIn->quantity);
                        } else {
                            $stockIn->product->update(['current_stock' => 0]);
                        }
                    }

                    // Handle purchase transaction status
                    if ($stockIn->purchase_transaction_id) {
                        $purchase = PurchaseTransaction::find($stockIn->purchase_transaction_id);
                        if ($purchase && $purchase->status === 'completed') {
                            $remainingReceived = StockIn::where('purchase_transaction_id', $purchase->id)
                                ->whereNotIn('id', $request->ids)
                                ->sum('quantity');

                            if ($remainingReceived < $purchase->quantity) {
                                $purchase->update(['status' => 'pending']);
                            }
                        }
                    }
                }

                StockIn::whereIn('id', $request->ids)->delete();
            });

            $count = count($request->ids);
            return back()->with('success', $count . ' stock in berhasil dihapus.');

        } catch (\Exception $e) {
            Log::error('Bulk delete error:', [
                'ids' => $request->ids,
                'error' => $e->getMessage()
            ]);

            return back()->with('error', 'Gagal menghapus stock in terpilih.');
        }
    }

    /**
     * Autofill berdasarkan barcode
     */
    public function autofill($code)
    {
        try {
            Log::info('Autofill request for code: ' . $code);

            // Sanitize code
            $code = trim($code);
            if (empty($code)) {
                return response()->json(['message' => 'Kode tidak boleh kosong'], 400);
            }

            // Priority 1: Cek apakah ini invoice Purchase Transaction
            if (str_starts_with($code, 'INV-')) {
                $purchase = PurchaseTransaction::where('invoice_number', $code)
                    ->with(['product.supplier', 'stockIns'])
                    ->first();

                if (!$purchase) {
                    Log::info('Purchase transaction not found for invoice: ' . $code);
                    return response()->json(['message' => 'Invoice tidak ditemukan'], 404);
                }

                // Hitung sisa quantity yang belum diterima
                $totalReceived = $purchase->stockIns->sum('quantity');
                $remainingQuantity = max(0, $purchase->quantity - $totalReceived);

                Log::info('Purchase transaction found:', [
                    'id' => $purchase->id,
                    'ordered' => $purchase->quantity,
                    'received' => $totalReceived,
                    'remaining' => $remainingQuantity
                ]);

                // Jika sudah fully received, beri peringatan tapi tetap return data
                if ($remainingQuantity <= 0) {
                    return response()->json([
                        'product_id' => $purchase->product_id,
                        'supplier_name' => $purchase->product->supplier->name ?? $purchase->supplier->name ?? '',
                        'quantity' => 0,
                        'stockin_date' => now()->format('Y-m-d'),
                        'source' => 'Purchase Transaction',
                        'purchase_transaction_id' => $purchase->id,
                        'warning' => 'Purchase transaction sudah fully received',
                        'purchase_info' => [
                            'invoice_number' => $purchase->invoice_number,
                            'ordered_quantity' => $purchase->quantity,
                            'received_quantity' => $totalReceived,
                            'remaining_quantity' => $remainingQuantity
                        ]
                    ]);
                }

                return response()->json([
                    'product_id' => $purchase->product_id,
                    'supplier_name' => $purchase->product->supplier->name ?? $purchase->supplier->name ?? '',
                    'quantity' => $remainingQuantity, // Auto-isi dengan sisa quantity
                    'stockin_date' => now()->format('Y-m-d'),
                    'source' => 'Purchase Transaction',
                    'purchase_transaction_id' => $purchase->id,
                    'purchase_info' => [
                        'invoice_number' => $purchase->invoice_number,
                        'ordered_quantity' => $purchase->quantity,
                        'received_quantity' => $totalReceived,
                        'remaining_quantity' => $remainingQuantity
                    ]
                ]);
            }

            // Priority 2: Cek apakah ini product code
            elseif (str_starts_with($code, 'PRD-')) {
                $product = Product::where('code', $code)
                    ->with('supplier')
                    ->first();

                if (!$product) {
                    Log::info('Product not found for code: ' . $code);
                    return response()->json(['message' => 'Product tidak ditemukan'], 404);
                }

                Log::info('Product found:', ['id' => $product->id, 'name' => $product->name]);

                return response()->json([
                    'product_id' => $product->id,
                    'supplier_name' => $product->supplier->name ?? '',
                    'quantity' => 1,
                    'stockin_date' => now()->format('Y-m-d'),
                    'source' => '',
                    'purchase_transaction_id' => '',
                ]);
            }

            // Priority 3: Cari by SKU atau general code
            else {
                $product = Product::where(function($query) use ($code) {
                    $query->where('sku', $code)
                          ->orWhere('code', $code)
                          ->orWhere('barcode', $code); // Jika ada kolom barcode terpisah
                })
                ->with('supplier')
                ->first();

                if ($product) {
                    Log::info('Product found by SKU/Code:', ['id' => $product->id, 'name' => $product->name]);
                    
                    return response()->json([
                        'product_id' => $product->id,
                        'supplier_name' => $product->supplier->name ?? '',
                        'quantity' => 1,
                        'stockin_date' => now()->format('Y-m-d'),
                        'source' => '',
                        'purchase_transaction_id' => '',
                    ]);
                }

                Log::info('No product found for barcode: ' . $code);
                return response()->json(['message' => 'Barcode tidak ditemukan'], 404);
            }

        } catch (\Exception $e) {
            Log::error('Autofill error:', [
                'code' => $code,
                'error' => $e->getMessage(),
                'line' => $e->getLine(),
                'file' => $e->getFile()
            ]);

            return response()->json(['message' => 'Terjadi kesalahan server'], 500);
        }
    }
}