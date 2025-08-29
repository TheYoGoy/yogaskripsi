<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Category;
use App\Models\Unit;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Milon\Barcode\Facades\DNS1DFacade as DNS1D;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class ProductController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(Product::class, 'product');
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        try {
            Log::info('Product index request', [
                'user_id' => Auth::id(),
                'filters' => $request->all()
            ]);

            $filters = $request->only([
                'search',
                'category_id',
                'supplier_id',
                'unit_id',
                'per_page',
                'sort_by',
                'sort_direction',
                'page',
                'created_date',
            ]);

            $perPage = $filters['per_page'] ?? 10;
            $sortBy = $filters['sort_by'] ?? 'created_at';
            $sortDirection = $filters['sort_direction'] ?? 'desc';

            // Validasi sort columns
            $validSortColumns = ['name', 'sku', 'code', 'current_stock', 'price', 'created_at'];
            if (!in_array($sortBy, $validSortColumns)) {
                $sortBy = 'created_at';
            }
            if (!in_array($sortDirection, ['asc', 'desc'])) {
                $sortDirection = 'desc';
            }

            // Build query dengan proper eager loading
            $query = Product::with(['category:id,name', 'unit:id,name,symbol', 'supplier:id,name'])
                ->select([
                    'products.id',
                    'products.code',
                    'products.sku',
                    'products.name',
                    'products.description',
                    'products.category_id',
                    'products.unit_id',
                    'products.supplier_id',
                    'products.current_stock',
                    'products.price',
                    'products.lead_time',
                    'products.daily_usage_rate',
                    'products.created_at',
                    'products.updated_at'
                ]);

            // Apply search filter
            if (!empty($filters['search'])) {
                $search = $filters['search'];
                $query->where(function ($q) use ($search) {
                    $q->where('products.name', 'like', "%$search%")
                        ->orWhere('products.sku', 'like', "%$search%")
                        ->orWhere('products.code', 'like', "%$search%")
                        ->orWhere('products.description', 'like', "%$search%");
                });
            }

            // Apply category filter
            if (!empty($filters['category_id']) && $filters['category_id'] !== 'all') {
                $query->where('products.category_id', $filters['category_id']);
            }

            // Apply unit filter
            if (!empty($filters['unit_id']) && $filters['unit_id'] !== 'all') {
                $query->where('products.unit_id', $filters['unit_id']);
            }

            // Apply supplier filter
            if (!empty($filters['supplier_id']) && $filters['supplier_id'] !== 'all') {
                $query->where('products.supplier_id', $filters['supplier_id']);
            }

            // Apply date filter
            if (!empty($filters['created_date'])) {
                try {
                    // Convert DD-MM-YYYY to Y-m-d
                    $date = \DateTime::createFromFormat('d-m-Y', $filters['created_date']);
                    if ($date) {
                        $query->whereDate('products.created_at', $date->format('Y-m-d'));
                    }
                } catch (\Exception $e) {
                    Log::warning('Invalid date format in product filter', [
                        'date' => $filters['created_date'],
                        'error' => $e->getMessage()
                    ]);
                }
            }

            // Apply sorting
            $query->orderBy("products.$sortBy", $sortDirection);

            // Execute query with pagination
            $products = $query->paginate($perPage)->withQueryString();

            // Get dropdown data
            $categories = Category::select('id', 'name')->orderBy('name')->get();
            $units = Unit::select('id', 'name', 'symbol')->orderBy('name')->get();
            $suppliers = Supplier::select('id', 'name')->orderBy('name')->get();

            Log::info('Product query result', [
                'total' => $products->total(),
                'per_page' => $products->perPage(),
                'current_page' => $products->currentPage(),
                'data_count' => $products->count(),
                'categories_count' => $categories->count(),
                'units_count' => $units->count(),
                'suppliers_count' => $suppliers->count()
            ]);

            return Inertia::render('Products/Index', [
                'products' => $products,
                'filters' => $filters,
                'categories' => $categories,
                'units' => $units,
                'suppliers' => $suppliers,
                'flash' => [
                    'success' => session('success'),
                    'error' => session('error'),
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Error in product index', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'user_id' => Auth::id()
            ]);

            return Inertia::render('Products/Index', [
                'products' => collect()->paginate(),
                'filters' => $filters ?? [],
                'categories' => collect(),
                'units' => collect(),
                'suppliers' => collect(),
                'flash' => [
                    'error' => 'Terjadi kesalahan saat memuat data produk. Silakan refresh halaman.'
                ],
            ]);
        }
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $categories = Category::select('id', 'name')->orderBy('name')->get();
        $units = Unit::select('id', 'name', 'symbol')->orderBy('name')->get();
        $suppliers = Supplier::select('id', 'name')->orderBy('name')->get();

        return Inertia::render('Products/Create', [
            'categories' => $categories,
            'units' => $units,
            'suppliers' => $suppliers,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        Log::info('Product store request', [
            'user_id' => Auth::id(),
            'data' => $request->except(['_token'])
        ]);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'sku' => 'required|string|max:100|unique:products,sku',
            'code' => 'nullable|string|max:100|unique:products,code',
            'description' => 'nullable|string|max:1000',
            'category_id' => 'required|exists:categories,id',
            'unit_id' => 'required|exists:units,id',
            'supplier_id' => 'nullable|exists:suppliers,id',
            'price' => 'required|numeric|min:0',
            'lead_time' => 'nullable|integer|min:1',
            'current_stock' => 'nullable|integer|min:0',
            'daily_usage_rate' => 'nullable|numeric|min:0',
        ]);

        try {
            // Set default values
            $validated['current_stock'] = $validated['current_stock'] ?? 0;
            $validated['lead_time'] = $validated['lead_time'] ?? 7;
            $validated['daily_usage_rate'] = $validated['daily_usage_rate'] ?? 0.5;

            $product = Product::create($validated);

            Log::info('Product created successfully', [
                'product_id' => $product->id,
                'user_id' => Auth::id()
            ]);

            return redirect()
                ->route('products.index')
                ->with('success', "Produk '{$product->name}' berhasil ditambahkan.");
        } catch (\Exception $e) {
            Log::error('Error creating product', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
                'data' => $validated
            ]);

            return back()
                ->withInput()
                ->with('error', 'Gagal menambahkan produk. Silakan coba lagi.');
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Product $product)
    {
        $product->load(['category', 'unit', 'supplier']);

        // Calculate dan assign sebagai properti terpisah
        $product->rop = $product->calculateRop();
        $product->eoq = $product->calculateEoq();

        // Ambil reorder status dan extract message untuk frontend
        $reorderStatus = $product->getReorderStatus();
        $product->reorder_status_message = $reorderStatus['message'];
        $product->reorder_status_color = $reorderStatus['color'];
        $product->reorder_status_urgent = $reorderStatus['urgent'];

        // Juga pass categories, units, suppliers untuk edit modal
        $categories = Category::select('id', 'name')->orderBy('name')->get();
        $units = Unit::select('id', 'name', 'symbol')->orderBy('name')->get();
        $suppliers = Supplier::select('id', 'name')->orderBy('name')->get();

        return Inertia::render('Products/Show', [
            'product' => $product,
            'categories' => $categories,
            'units' => $units,
            'suppliers' => $suppliers,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Product $product)
    {
        $product->load(['category', 'unit', 'supplier']);

        $categories = Category::select('id', 'name')->orderBy('name')->get();
        $units = Unit::select('id', 'name', 'symbol')->orderBy('name')->get();
        $suppliers = Supplier::select('id', 'name')->orderBy('name')->get();

        return Inertia::render('Products/Edit', [
            'product' => $product,
            'categories' => $categories,
            'units' => $units,
            'suppliers' => $suppliers,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Product $product)
    {
        Log::info('Product update request', [
            'product_id' => $product->id,
            'user_id' => Auth::id(),
            'data' => $request->except(['_token', '_method'])
        ]);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'sku' => 'required|string|max:100|unique:products,sku,' . $product->id,
            'code' => 'nullable|string|max:100|unique:products,code,' . $product->id,
            'description' => 'nullable|string|max:1000',
            'category_id' => 'required|exists:categories,id',
            'unit_id' => 'required|exists:units,id',
            'supplier_id' => 'nullable|exists:suppliers,id',
            'price' => 'required|numeric|min:0',
            'lead_time' => 'nullable|integer|min:1',
            'current_stock' => 'nullable|integer|min:0',
            'daily_usage_rate' => 'nullable|numeric|min:0',
        ]);

        try {
            $product->update($validated);

            Log::info('Product updated successfully', [
                'product_id' => $product->id,
                'user_id' => Auth::id()
            ]);

            return redirect()
                ->route('products.index')
                ->with('success', "Produk '{$product->name}' berhasil diperbarui.");
        } catch (\Exception $e) {
            Log::error('Error updating product', [
                'product_id' => $product->id,
                'user_id' => Auth::id(),
                'error' => $e->getMessage()
            ]);

            return back()
                ->withInput()
                ->with('error', 'Gagal memperbarui produk. Silakan coba lagi.');
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Product $product)
    {
        try {
            $productName = $product->name;
            $product->delete();

            Log::info('Product deleted successfully', [
                'product_name' => $productName,
                'user_id' => Auth::id()
            ]);

            return redirect()
                ->route('products.index')
                ->with('success', "Produk '{$productName}' berhasil dihapus.");
        } catch (\Exception $e) {
            Log::error('Error deleting product', [
                'product_id' => $product->id,
                'user_id' => Auth::id(),
                'error' => $e->getMessage()
            ]);

            return back()->with('error', 'Gagal menghapus produk. Silakan coba lagi.');
        }
    }

    /**
     * Bulk delete products.
     */
    public function bulkDelete(Request $request)
    {
        $request->validate([
            'ids' => 'required|array|min:1|max:100',
            'ids.*' => 'exists:products,id',
        ]);

        try {
            $count = Product::whereIn('id', $request->ids)->count();
            Product::whereIn('id', $request->ids)->delete();

            Log::info('Bulk delete products', [
                'count' => $count,
                'ids' => $request->ids,
                'user_id' => Auth::id()
            ]);

            return back()->with('success', "{$count} produk berhasil dihapus.");
        } catch (\Exception $e) {
            Log::error('Error bulk deleting products', [
                'ids' => $request->ids,
                'user_id' => Auth::id(),
                'error' => $e->getMessage()
            ]);

            return back()->with('error', 'Gagal menghapus produk terpilih. Silakan coba lagi.');
        }
    }

    /**
     * Generate unique product code.
     */
    public function generateCode(): JsonResponse
    {
        try {
            // Get the latest product code
            $latestProduct = Product::whereNotNull('code')
                ->where('code', 'like', 'PRD-%')
                ->orderBy('code', 'desc')
                ->first();

            if ($latestProduct && preg_match('/PRD-(\d+)/', $latestProduct->code, $matches)) {
                $nextNumber = intval($matches[1]) + 1;
            } else {
                $nextNumber = 1;
            }

            $code = 'PRD-' . str_pad($nextNumber, 6, '0', STR_PAD_LEFT);

            // Ensure uniqueness
            while (Product::where('code', $code)->exists()) {
                $nextNumber++;
                $code = 'PRD-' . str_pad($nextNumber, 6, '0', STR_PAD_LEFT);
            }

            Log::info('Generated product code', [
                'code' => $code,
                'user_id' => Auth::id()
            ]);

            return response()->json([
                'success' => true,
                'code' => $code,
                'generatedCode' => $code,
            ]);
        } catch (\Exception $e) {
            Log::error('Error generating product code', [
                'error' => $e->getMessage(),
                'user_id' => Auth::id()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Gagal menggenerate kode produk.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Search product by barcode/QR code for purchase transaction auto-fill.
     */
    public function searchByCode(Request $request, $code = null): JsonResponse
    {
        try {
            // Handle both URL parameter and query parameter
            $code = $code ?? $request->input('code') ?? $request->route('code');

            if (empty($code)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Kode tidak boleh kosong',
                ], 400);
            }

            Log::info('Searching product by code', [
                'code' => $code,
                'user_id' => Auth::id()
            ]);

            // Search product by code or SKU
            $product = Product::with(['supplier:id,name,phone,address'])
                ->where(function ($query) use ($code) {
                    $query->where('code', $code)
                        ->orWhere('sku', $code);
                })
                ->first();

            if (!$product) {
                return response()->json([
                    'success' => false,
                    'message' => 'Produk tidak ditemukan untuk kode: ' . $code,
                ], 404);
            }

            // Prepare response data
            $responseData = [
                'success' => true,
                'message' => 'Produk ditemukan',
                'product' => [
                    'id' => $product->id,
                    'name' => $product->name,
                    'sku' => $product->sku,
                    'code' => $product->code,
                    'current_stock' => $product->current_stock,
                    'price' => $product->price,
                    'supplier_id' => $product->supplier_id,
                    'supplier' => $product->supplier ? [
                        'id' => $product->supplier->id,
                        'name' => $product->supplier->name,
                        'phone' => $product->supplier->phone,
                        'address' => $product->supplier->address,
                    ] : null,
                ],
            ];

            Log::info('Product found by code', [
                'code' => $code,
                'product_id' => $product->id,
                'product_name' => $product->name,
                'supplier_id' => $product->supplier_id,
                'user_id' => Auth::id()
            ]);

            return response()->json($responseData);
        } catch (\Exception $e) {
            Log::error('Error searching product by code', [
                'code' => $request->input('code'),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'user_id' => Auth::id()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat mencari produk',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate barcode SVG for the product.
     */
    public function generateBarcode(Product $product): JsonResponse
    {
        try {
            $this->authorize('view', $product);

            $codeToEncode = $product->code ?: $product->sku;

            if (!$codeToEncode) {
                return response()->json([
                    'success' => false,
                    'error' => 'Tidak ada kode untuk generate barcode'
                ], 400);
            }

            $barcode = DNS1D::getBarcodeSVG($codeToEncode, 'C128', 2, 100);

            return response()->json([
                'success' => true,
                'svg' => $barcode,
                'barcode' => $barcode,
                'code' => $codeToEncode,
                'product_name' => $product->name
            ]);
        } catch (\Exception $e) {
            Log::error('Error generating barcode', [
                'product_id' => $product->id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Gagal generate barcode'
            ], 500);
        }
    }

    /**
     * Route alias for barcode generation
     */
    public function barcode(Product $product)
    {
        return $this->generateBarcode($product);
    }

    /**
     * Download Linear Barcode
     */
    public function downloadBarcode(Product $product)
    {
        try {
            $this->authorize('view', $product);

            $codeToEncode = $product->code ?: $product->sku;

            if (!$codeToEncode) {
                return back()->with('error', 'Tidak ada kode untuk generate barcode.');
            }

            // Generate Linear Barcode SVG untuk download
            $svg = DNS1D::getBarcodeSVG($codeToEncode, 'C128', 3, 120);

            $filename = "barcode_" . preg_replace('/[^A-Za-z0-9\-_]/', '_', $product->sku) . ".svg";

            return response($svg)
                ->header('Content-Type', 'image/svg+xml')
                ->header('Content-Disposition', 'attachment; filename="' . $filename . '"');
        } catch (\Exception $e) {
            Log::error('Error downloading barcode', [
                'product_id' => $product->id,
                'error' => $e->getMessage()
            ]);

            return back()->with('error', 'Gagal download barcode.');
        }
    }

    /**
     * Generate QR Code
     */
    public function generateQrCode(Product $product): JsonResponse
    {
        try {
            $this->authorize('view', $product);

            $codeToEncode = $product->code ?: $product->sku;

            if (!$codeToEncode) {
                return response()->json([
                    'success' => false,
                    'error' => 'Tidak ada kode untuk generate QR code'
                ], 400);
            }

            // Generate QR Code
            $qrCode = QrCode::format('svg')
                ->size(200)
                ->generate($codeToEncode);

            return response()->json([
                'success' => true,
                'svg' => $qrCode,
                'qrcode' => $qrCode,
                'code' => $codeToEncode,
                'product_name' => $product->name,
                'type' => 'qr_code'
            ]);
        } catch (\Exception $e) {
            Log::error('Error generating QR code', [
                'product_id' => $product->id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Gagal generate QR code'
            ], 500);
        }
    }

    /**
     * Download QR Code
     */
    public function downloadQrCode(Product $product)
    {
        try {
            $this->authorize('view', $product);

            $codeToEncode = $product->code ?: $product->sku;

            if (!$codeToEncode) {
                return back()->with('error', 'Tidak ada kode untuk generate QR code.');
            }

            // Generate QR Code SVG untuk download
            $svg = QrCode::format('svg')
                ->size(300)
                ->generate($codeToEncode);

            $filename = "qr_" . preg_replace('/[^A-Za-z0-9\-_]/', '_', $product->sku) . ".svg";

            return response($svg)
                ->header('Content-Type', 'image/svg+xml')
                ->header('Content-Disposition', 'attachment; filename="' . $filename . '"');
        } catch (\Exception $e) {
            Log::error('Error downloading QR code', [
                'product_id' => $product->id,
                'error' => $e->getMessage()
            ]);

            return back()->with('error', 'Gagal download QR code.');
        }
    }
}
