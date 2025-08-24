<?php

namespace App\Http\Controllers;

use App\Models\StockOut;
use App\Models\Product;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use App\Models\Setting;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class StockOutController extends Controller
{
    /**
     * Constructor untuk mengaktifkan otorisasi berbasis StockOutPolicy.
     */
    public function __construct()
    {
        $this->authorizeResource(StockOut::class, 'stock_out');
    }

    /**
     * Menampilkan daftar transaksi stock out.
     */
    public function index(Request $request)
    {
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

        $perPage = $filters['per_page'] ?? 10;
        $sortBy = $filters['sort_by'] ?? 'transaction_date';
        $sortDirection = $filters['sort_direction'] ?? 'desc';

        $validSortColumns = ['transaction_date', 'quantity', 'created_at', 'customer', 'code'];
        if (!in_array($sortBy, $validSortColumns)) {
            $sortBy = 'transaction_date';
        }
        if (!in_array($sortDirection, ['asc', 'desc'])) {
            $sortDirection = 'desc';
        }

        $stockOuts = StockOut::with(['product', 'user', 'supplier'])
            ->when($filters['search'] ?? null, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->whereHas('product', function ($productQuery) use ($search) {
                        $productQuery->where('name', 'like', "%$search%")
                            ->orWhere('sku', 'like', "%$search%")
                            ->orWhere('code', 'like', "%$search%");
                    })
                        ->orWhere('customer', 'like', "%$search%")
                        ->orWhere('code', 'like', "%$search%");
                });
            })
            ->when($filters['transaction_date'] ?? null, function ($query, $date) {
                $query->whereDate('transaction_date', $date);
            })
            ->when($filters['customer'] ?? null, function ($query, $customer) {
                $query->where('customer', 'like', "%$customer%");
            })
            ->when($filters['product_id'] ?? null, function ($query, $productId) {
                $query->where('product_id', $productId);
            })
            ->orderBy($sortBy, $sortDirection)
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('StockOuts/Index', [
            'stockOuts' => $stockOuts,
            'filters' => $filters,
            'products' => Product::select('id', 'name', 'sku', 'current_stock')->get(),
            'flash' => [
                'success' => session('success'),
                'error' => session('error'),
            ],
        ]);
    }

    /**
     * Menampilkan form untuk membuat transaksi stock out baru.
     */
    public function create()
    {
        return Inertia::render('StockOuts/Create', [
            'products' => Product::select('id', 'name', 'sku', 'code', 'current_stock', 'rop')->get(),
            'suppliers' => Supplier::select('id', 'name')->get(),
        ]);
    }

    /**
     * Menyimpan transaksi stock out baru ke database.
     */
    public function store(Request $request)
    {
        // Validation
        $validated = $request->validate([
            'code' => 'nullable|string|max:255',
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|numeric|min:1',
            'customer' => 'nullable|string|max:255',
            'transaction_date' => 'required|date',
            'supplier_id' => 'nullable|exists:suppliers,id',
        ], [
            'product_id.required' => 'Product harus dipilih.',
            'product_id.exists' => 'Product yang dipilih tidak valid.',
            'quantity.required' => 'Quantity harus diisi.',
            'quantity.min' => 'Quantity minimal 1.',
            'transaction_date.required' => 'Tanggal transaksi harus diisi.',
            'transaction_date.date' => 'Format tanggal tidak valid.',
        ]);

        try {
            DB::transaction(function () use ($validated) {
                // Cek stok produk
                $product = Product::find($validated['product_id']);
                if (!$product) {
                    throw new \Exception('Product tidak ditemukan.');
                }

                if ($product->current_stock < $validated['quantity']) {
                    throw new \Exception("Stok tidak mencukupi. Stok tersedia: {$product->current_stock}");
                }

                // Generate code if not provided
                if (empty($validated['code'])) {
                    $today = Carbon::parse($validated['transaction_date']);
                    $count = StockOut::whereDate('transaction_date', $today)->count() + 1;
                    $validated['code'] = 'SO-' . $today->format('Ymd') . '-' . str_pad($count, 4, '0', STR_PAD_LEFT);
                }

                // Update stok produk
                $product->decrement('current_stock', $validated['quantity']);

                // Simpan StockOut
                StockOut::create([
                    'code' => $validated['code'],
                    'product_id' => $validated['product_id'],
                    'quantity' => $validated['quantity'],
                    'customer' => $validated['customer'],
                    'transaction_date' => $validated['transaction_date'],
                    'supplier_id' => $validated['supplier_id'] ?? null,
                    'user_id' => Auth::id(),
                ]);

                Log::info('Stock out created successfully', [
                    'code' => $validated['code'],
                    'product_id' => $validated['product_id'],
                    'quantity' => $validated['quantity'],
                    'user_id' => Auth::id(),
                ]);
            });

            return redirect()
                ->route('stock-outs.index')
                ->with('success', 'Stock Out berhasil dicatat.');
        } catch (\Exception $e) {
            Log::error('Error creating stock out', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
                'data' => $validated,
                'trace' => $e->getTraceAsString()
            ]);

            return back()
                ->withInput()
                ->with('error', $e->getMessage());
        }
    }

    /**
     * Menampilkan detail transaksi stock out.
     */
    public function show(StockOut $stockOut)
    {
        $stockOut->load(['product', 'user', 'supplier']);

        return Inertia::render('StockOuts/Show', [
            'stockOut' => $stockOut,
        ]);
    }

    /**
     * Menampilkan form untuk mengedit transaksi stock out.
     */
    public function edit(StockOut $stockOut)
    {
        return Inertia::render('StockOuts/Edit', [
            'stockOut' => $stockOut->load(['product', 'supplier']),
            'products' => Product::select('id', 'name', 'sku', 'code', 'current_stock', 'rop')->get(),
            'suppliers' => Supplier::select('id', 'name')->get(),
        ]);
    }

    /**
     * Memperbarui transaksi stock out di database.
     */
    public function update(Request $request, StockOut $stockOut)
    {
        $validated = $request->validate([
            'code' => 'nullable|string|max:255',
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|numeric|min:1',
            'customer' => 'nullable|string|max:255',
            'transaction_date' => 'required|date',
            'supplier_id' => 'nullable|exists:suppliers,id',
        ]);

        try {
            DB::transaction(function () use ($validated, $stockOut) {
                $oldProduct = $stockOut->product;
                $newProduct = Product::find($validated['product_id']);

                // Rollback stok lama
                if ($oldProduct) {
                    $oldProduct->increment('current_stock', $stockOut->quantity);
                }

                // Cek stok produk baru
                if (!$newProduct) {
                    throw new \Exception('Product tidak ditemukan.');
                }

                if ($newProduct->current_stock < $validated['quantity']) {
                    throw new \Exception("Stok tidak mencukupi. Stok tersedia: {$newProduct->current_stock}");
                }

                // Update stok produk baru
                $newProduct->decrement('current_stock', $validated['quantity']);

                // Update StockOut
                $stockOut->update([
                    'code' => $validated['code'] ?? $stockOut->code,
                    'product_id' => $validated['product_id'],
                    'quantity' => $validated['quantity'],
                    'customer' => $validated['customer'],
                    'transaction_date' => $validated['transaction_date'],
                    'supplier_id' => $validated['supplier_id'],
                ]);

                Log::info('Stock out updated successfully', [
                    'id' => $stockOut->id,
                    'code' => $stockOut->code,
                    'user_id' => Auth::id(),
                ]);
            });

            return redirect()
                ->route('stock-outs.index')
                ->with('success', 'Stock Out berhasil diperbarui.');
        } catch (\Exception $e) {
            Log::error('Error updating stock out', [
                'stockout_id' => $stockOut->id,
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
                'data' => $validated
            ]);

            return back()
                ->withInput()
                ->with('error', $e->getMessage());
        }
    }

    /**
     * Menghapus transaksi stock out dari database.
     */
    public function destroy(StockOut $stockOut)
    {
        try {
            DB::transaction(function () use ($stockOut) {
                // Rollback stok produk
                $product = $stockOut->product;
                if ($product) {
                    $product->increment('current_stock', $stockOut->quantity);
                }

                $code = $stockOut->code;
                $stockOut->delete();

                Log::info('Stock out deleted successfully', [
                    'code' => $code,
                    'user_id' => Auth::id(),
                ]);
            });

            return redirect()
                ->route('stock-outs.index')
                ->with('success', 'Stock Out berhasil dihapus.');
        } catch (\Exception $e) {
            Log::error('Error deleting stock out', [
                'stockout_id' => $stockOut->id,
                'user_id' => Auth::id(),
                'error' => $e->getMessage()
            ]);

            return back()->with('error', 'Gagal menghapus stock out.');
        }
    }

    /**
     * Bulk delete transaksi stock out.
     */
    public function bulkDelete(Request $request)
    {
        $request->validate([
            'ids' => 'required|array|min:1|max:100',
            'ids.*' => 'exists:stock_outs,id',
        ]);

        try {
            DB::transaction(function () use ($request) {
                $stockOuts = StockOut::whereIn('id', $request->ids)->with('product')->get();

                foreach ($stockOuts as $stockOut) {
                    // Rollback stok untuk setiap item
                    if ($stockOut->product) {
                        $stockOut->product->increment('current_stock', $stockOut->quantity);
                    }
                }

                StockOut::whereIn('id', $request->ids)->delete();

                Log::info('Bulk delete stock outs successful', [
                    'ids' => $request->ids,
                    'count' => count($request->ids),
                    'user_id' => Auth::id(),
                ]);
            });

            $count = count($request->ids);
            return back()->with('success', "{$count} stock out berhasil dihapus.");
        } catch (\Exception $e) {
            Log::error('Error bulk deleting stock outs', [
                'ids' => $request->ids,
                'user_id' => Auth::id(),
                'error' => $e->getMessage()
            ]);

            return back()->with('error', 'Gagal menghapus stock out terpilih.');
        }
    }

    /**
     * Auto-fill data berdasarkan barcode/QR code.
     */
    public function autofill($code)
    {
        try {
            Log::info('Autofill request', ['code' => $code]);

            // Cari product berdasarkan berbagai field
            $product = Product::where(function ($query) use ($code) {
                $query->where('code', $code)
                    ->orWhere('sku', $code)
                    ->orWhere('barcode', $code);
            })->first();

            // Jika tidak ditemukan, coba pencarian yang lebih fleksibel
            if (!$product) {
                $product = Product::where('code', 'LIKE', "%{$code}%")
                    ->orWhere('sku', 'LIKE', "%{$code}%")
                    ->first();
            }

            // Jika masih tidak ditemukan, coba tanpa case sensitive
            if (!$product) {
                $product = Product::whereRaw('LOWER(code) = ?', [strtolower($code)])
                    ->orWhereRaw('LOWER(sku) = ?', [strtolower($code)])
                    ->first();
            }

            if (!$product) {
                Log::warning('Product not found in autofill', [
                    'searched_code' => $code,
                    'total_products' => Product::count()
                ]);

                return response()->json([
                    'message' => 'Product tidak ditemukan',
                    'searched_code' => $code,
                    'suggestions' => Product::where('code', 'LIKE', "%{$code}%")
                        ->orWhere('sku', 'LIKE', "%{$code}%")
                        ->limit(5)
                        ->pluck('name', 'code')
                        ->toArray()
                ], 404);
            }

            Log::info('Product found in autofill', [
                'code' => $code,
                'product_id' => $product->id,
                'product_name' => $product->name
            ]);

            return response()->json([
                'product_id' => $product->id,
                'quantity' => 1,
                'transaction_date' => now()->format('Y-m-d'),
                'current_stock' => $product->current_stock,
                'product_name' => $product->name,
                'product_sku' => $product->sku,
                'product_code' => $product->code,
                'rop' => $product->rop ?? 0,
                'found_by' => 'autofill',
            ]);
        } catch (\Exception $e) {
            Log::error('Error in autofill', [
                'code' => $code,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Terjadi kesalahan internal',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Get stock out statistics.
     */
    public function stats(Request $request)
    {
        $startDate = $request->input('start_date', now()->startOfMonth());
        $endDate = $request->input('end_date', now()->endOfMonth());

        $stats = [
            'total_transactions' => StockOut::whereBetween('transaction_date', [$startDate, $endDate])->count(),
            'total_quantity' => StockOut::whereBetween('transaction_date', [$startDate, $endDate])->sum('quantity'),
            'top_products' => StockOut::with('product')
                ->select('product_id', DB::raw('SUM(quantity) as total_quantity'))
                ->whereBetween('transaction_date', [$startDate, $endDate])
                ->groupBy('product_id')
                ->orderBy('total_quantity', 'desc')
                ->limit(10)
                ->get(),
            'daily_stats' => StockOut::select(
                DB::raw('DATE(transaction_date) as date'),
                DB::raw('COUNT(*) as count'),
                DB::raw('SUM(quantity) as quantity')
            )
                ->whereBetween('transaction_date', [$startDate, $endDate])
                ->groupBy('date')
                ->orderBy('date')
                ->get()
        ];

        return response()->json($stats);
    }
}
