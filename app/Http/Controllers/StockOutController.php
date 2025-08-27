<?php

namespace App\Http\Controllers;

use App\Models\StockOut;
use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use App\Models\Setting;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class StockOutController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(StockOut::class, 'stock_out');
    }

    /**
     * Menampilkan daftar stock out
     */
    public function index(Request $request)
    {
        Log::info('=== STOCK OUT INDEX START ===');
        Log::info('Request filters:', $request->all());
        
        $filters = $request->only([
            'search',
            'transaction_date',
            'customer',
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
        $validSortColumns = ['id', 'date', 'transaction_date', 'quantity', 'created_at', 'code', 'customer'];
        if (!in_array($sortBy, $validSortColumns)) {
            $sortBy = 'id';
        }

        if (!in_array($sortDirection, ['asc', 'desc'])) {
            $sortDirection = 'desc';
        }

        // Build query with proper relationships
        $query = StockOut::query()->with([
            'product:id,name,sku,code,current_stock',
            'user:id,name'
        ]);

        // Apply search filter
        if (!empty($filters['search'])) {
            $search = trim($filters['search']);
            Log::info('Applying search filter: ' . $search);
            
            $query->where(function($q) use ($search) {
                $q->where('code', 'like', "%$search%")
                  ->orWhere('customer', 'like', "%$search%")
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

        // Apply customer filter
        if (!empty($filters['customer'])) {
            Log::info('Applying customer filter: ' . $filters['customer']);
            $query->where('customer', 'like', "%{$filters['customer']}%");
        }

        // Apply product filter
        if (!empty($filters['product_id']) && $filters['product_id'] !== 'all') {
            Log::info('Applying product filter: ' . $filters['product_id']);
            $query->where('product_id', $filters['product_id']);
        }

        // Count total before pagination for debug
        $totalInDb = StockOut::count();
        $filteredTotal = $query->count();

        // Apply sorting
        if ($sortBy === 'code') {
            $query->orderBy('code', $sortDirection);
        } elseif ($sortBy === 'quantity') {
            $query->orderBy('quantity', $sortDirection);
        } elseif ($sortBy === 'customer') {
            $query->orderBy('customer', $sortDirection);
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

        $stockOuts = $query->paginate($perPage)->withQueryString();
        
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
            'paginated_total' => $stockOuts->total(),
            'current_page' => $stockOuts->currentPage(),
            'per_page' => $stockOuts->perPage(),
            'count' => $stockOuts->count()
        ]);

        Log::info('=== STOCK OUT INDEX END ===');

        return Inertia::render('StockOuts/Index', [
            'stockOuts' => $stockOuts,
            'filters' => $filters,
            'products' => Product::select('id', 'name', 'current_stock')->orderBy('name')->get(),
            'debug' => $debug,
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
        return Inertia::render('StockOuts/Create', [
            'products' => Product::select('id', 'name', 'sku', 'code', 'current_stock')->orderBy('name')->get(),
        ]);
    }

    /**
     * Store stock out baru
     */
    public function store(Request $request)
    {
        Log::info('=== STOCKOUT STORE START ===');
        Log::info('Request data:', $request->all());

        try {
            $validated = $request->validate([
                'product_id' => 'required|integer|exists:products,id',
                'customer' => 'nullable|string|max:255',
                'quantity' => 'required|integer|min:1',
                'transaction_date' => 'required|date',
                'code' => 'nullable|string|max:255',
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
                // Get product untuk cek stok
                $product = Product::find($validated['product_id']);
                if (!$product) {
                    throw new \Exception('Product not found');
                }

                // Validasi stok
                if ($product->current_stock < $validated['quantity']) {
                    throw new \Exception("Stok tidak mencukupi. Stok tersedia: {$product->current_stock}");
                }

                // Generate code jika kosong
                if (empty($validated['code'])) {
                    try {
                        $settings = Setting::first();
                        $prefix = $settings->stock_prefix_out ?? 'SOUT-';
                    } catch (\Exception $e) {
                        $prefix = 'SOUT-';
                        Log::warning('Failed to get settings, using default prefix');
                    }
                    
                    $latestId = StockOut::max('id') ?? 0;
                    $nextId = $latestId + 1;
                    $validated['code'] = $prefix . str_pad($nextId, 5, '0', STR_PAD_LEFT);
                    
                    // Ensure unique code
                    while (StockOut::where('code', $validated['code'])->exists()) {
                        $nextId++;
                        $validated['code'] = $prefix . str_pad($nextId, 5, '0', STR_PAD_LEFT);
                    }
                }

                Log::info('Generated code: ' . $validated['code']);

                // Prepare data sesuai struktur database
                $stockOutData = [
                    'code' => $validated['code'],
                    'product_id' => $validated['product_id'],
                    'quantity' => $validated['quantity'],
                    'date' => $validated['transaction_date'],
                    'transaction_date' => $validated['transaction_date'],
                    'customer' => $validated['customer'] ?: '',
                    'user_id' => Auth::id(),
                ];

                Log::info('Creating StockOut with data:', $stockOutData);

                $stockOut = StockOut::create($stockOutData);

                Log::info('StockOut created successfully with ID: ' . $stockOut->id);

                // Update product stock (mengurangi)
                $oldStock = $product->current_stock;
                $product->decrement('current_stock', $validated['quantity']);
                $product->refresh();
                
                Log::info('Product stock updated:', [
                    'product_id' => $product->id,
                    'old_stock' => $oldStock,
                    'new_stock' => $product->current_stock,
                    'reduced' => $validated['quantity']
                ]);

                DB::commit();

                Log::info('=== STOCKOUT STORE SUCCESS ===');

                return redirect()
                    ->route('stock-outs.index')
                    ->with('success', 'Stock Out berhasil dicatat! Kode: ' . $stockOut->code);

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
                ->with('error', 'Gagal menyimpan stock out: ' . $e->getMessage());
        }
    }

    /**
     * Delete stock out
     */
    public function destroy(StockOut $stockOut)
    {
        try {
            DB::transaction(function () use ($stockOut) {
                Log::info('Deleting stock out with ID: ' . $stockOut->id);
                
                // Rollback product stock (menambah kembali)
                $product = $stockOut->product;
                if ($product) {
                    $product->increment('current_stock', $stockOut->quantity);
                    Log::info('Product stock incremented by: ' . $stockOut->quantity);
                }

                $stockOut->delete();
                Log::info('StockOut deleted successfully');
            });

            return redirect()
                ->route('stock-outs.index')
                ->with('success', 'Stock Out berhasil dihapus.');

        } catch (\Exception $e) {
            Log::error('Delete error:', [
                'stockout_id' => $stockOut->id,
                'error' => $e->getMessage()
            ]);

            return back()->with('error', 'Gagal menghapus stock out: ' . $e->getMessage());
        }
    }

    /**
     * Bulk delete
     */
    public function bulkDelete(Request $request)
    {
        $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'exists:stock_outs,id',
        ]);

        try {
            DB::transaction(function () use ($request) {
                $stockOuts = StockOut::whereIn('id', $request->ids)->with('product')->get();

                Log::info('Bulk deleting stock outs:', ['count' => $stockOuts->count()]);

                foreach ($stockOuts as $stockOut) {
                    if ($stockOut->product) {
                        $stockOut->product->increment('current_stock', $stockOut->quantity);
                    }
                }

                StockOut::whereIn('id', $request->ids)->delete();
            });

            $count = count($request->ids);
            return back()->with('success', $count . ' stock out berhasil dihapus.');

        } catch (\Exception $e) {
            Log::error('Bulk delete error:', [
                'ids' => $request->ids,
                'error' => $e->getMessage()
            ]);

            return back()->with('error', 'Gagal menghapus stock out terpilih.');
        }
    }

    /**
     * Autofill berdasarkan barcode
     */
    public function autofill($code)
    {
        try {
            Log::info('StockOut Autofill request for code: ' . $code);

            // Sanitize code
            $code = trim($code);
            if (empty($code)) {
                return response()->json(['message' => 'Kode tidak boleh kosong'], 400);
            }

            // Cari product berdasarkan code, sku, atau barcode
            $product = Product::where(function($query) use ($code) {
                $query->where('code', $code)
                      ->orWhere('sku', $code);
                      
                // Jika ada kolom barcode terpisah, uncomment line ini:
                // ->orWhere('barcode', $code);
            })->first();

            if (!$product) {
                Log::info('StockOut - Product not found for code: ' . $code);
                return response()->json(['message' => 'Product tidak ditemukan'], 404);
            }

            Log::info('StockOut - Product found:', [
                'id' => $product->id, 
                'name' => $product->name, 
                'stock' => $product->current_stock
            ]);

            // Cek stok
            if ($product->current_stock <= 0) {
                return response()->json([
                    'product_id' => $product->id,
                    'quantity' => 0,
                    'stockout_date' => now()->format('Y-m-d'),
                    'available_stock' => $product->current_stock,
                    'warning' => 'Stok produk kosong'
                ]);
            }

            return response()->json([
                'product_id' => $product->id,
                'quantity' => 1, // Default quantity 1
                'stockout_date' => now()->format('Y-m-d'),
                'available_stock' => $product->current_stock
            ]);

        } catch (\Exception $e) {
            Log::error('StockOut Autofill error:', [
                'code' => $code,
                'error' => $e->getMessage(),
                'line' => $e->getLine(),
                'file' => $e->getFile()
            ]);

            return response()->json(['message' => 'Terjadi kesalahan server'], 500);
        }
    }
}