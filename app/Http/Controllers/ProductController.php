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
        $filters = $request->only([
            'search',
            'category_id',
            'supplier_id',
            'unit_id',
            'per_page',
            'sort_by',
            'sort_direction',
            'page',
        ]);

        $perPage = $filters['per_page'] ?? 10;
        $sortBy = $filters['sort_by'] ?? 'name';
        $sortDirection = $filters['sort_direction'] ?? 'asc';

        $validSortColumns = ['name', 'sku', 'current_stock', 'minimum_stock', 'price', 'created_at'];
        if (!in_array($sortBy, $validSortColumns)) {
            $sortBy = 'name';
        }
        if (!in_array($sortDirection, ['asc', 'desc'])) {
            $sortDirection = 'asc';
        }

        $products = Product::with(['category', 'unit', 'supplier'])
            ->when($filters['search'] ?? null, function ($query, $search) {
                $query->where('name', 'like', "%$search%")
                    ->orWhere('sku', 'like', "%$search%")
                    ->orWhere('code', 'like', "%$search%")
                    ->orWhere('barcode', 'like', "%$search%")
                    ->orWhere('description', 'like', "%$search%");
            })
            ->when($filters['category_id'] ?? null, fn($q, $categoryId) => $q->where('category_id', $categoryId))
            ->when($filters['supplier_id'] ?? null, fn($q, $supplierId) => $q->where('supplier_id', $supplierId))
            ->when($filters['unit_id'] ?? null, fn($q, $unitId) => $q->where('unit_id', $unitId))
            ->orderBy($sortBy, $sortDirection)
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('Products/Index', [
            'products' => $products,
            'filters' => $filters,
            'categories' => Category::select('id', 'name')->get(),
            'suppliers' => Supplier::select('id', 'name')->get(),
            'units' => Unit::select('id', 'name')->get(),
            'flash' => [
                'success' => session('success'),
                'error' => session('error'),
            ],
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('Products/Create', [
            'categories' => Category::all(),
            'units' => Unit::all(),
            'suppliers' => Supplier::all(),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'sku' => 'required|string|max:100|unique:products,sku',
            'code' => 'nullable|string|max:100|unique:products,code',
            'barcode' => 'nullable|string|max:100|unique:products,barcode',
            'description' => 'nullable|string|max:1000',
            'category_id' => 'required|exists:categories,id',
            'unit_id' => 'required|exists:units,id',
            'supplier_id' => 'required|exists:suppliers,id',
            'current_stock' => 'required|integer|min:0',
            'minimum_stock' => 'required|integer|min:0',
            'maximum_stock' => 'nullable|integer|min:0',
            'price' => 'required|numeric|min:0',
            'cost' => 'nullable|numeric|min:0',
            'location' => 'nullable|string|max:255',
            'notes' => 'nullable|string|max:1000',
        ]);

        try {
            $product = Product::create([
                ...$validated,
                'user_id' => Auth::id(),
            ]);

            return redirect()
                ->route('products.index')
                ->with('success', 'Product created successfully.');
        } catch (\Exception $e) {
            Log::error('Error creating product', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
                'data' => $validated
            ]);

            return back()
                ->withInput()
                ->with('error', 'Failed to create product. Please try again.');
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Product $product)
    {
        $product->load(['category', 'unit', 'supplier', 'user']);

        return Inertia::render('Products/Show', [
            'product' => $product,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Product $product)
    {
        return Inertia::render('Products/Edit', [
            'product' => $product->load(['category', 'unit', 'supplier']),
            'categories' => Category::all(),
            'units' => Unit::all(),
            'suppliers' => Supplier::all(),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Product $product)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'sku' => 'required|string|max:100|unique:products,sku,' . $product->id,
            'code' => 'nullable|string|max:100|unique:products,code,' . $product->id,
            'barcode' => 'nullable|string|max:100|unique:products,barcode,' . $product->id,
            'description' => 'nullable|string|max:1000',
            'category_id' => 'required|exists:categories,id',
            'unit_id' => 'required|exists:units,id',
            'supplier_id' => 'required|exists:suppliers,id',
            'current_stock' => 'required|integer|min:0',
            'minimum_stock' => 'required|integer|min:0',
            'maximum_stock' => 'nullable|integer|min:0',
            'price' => 'required|numeric|min:0',
            'cost' => 'nullable|numeric|min:0',
            'location' => 'nullable|string|max:255',
            'notes' => 'nullable|string|max:1000',
        ]);

        try {
            $product->update($validated);

            return redirect()
                ->route('products.index')
                ->with('success', 'Product updated successfully.');
        } catch (\Exception $e) {
            Log::error('Error updating product', [
                'product_id' => $product->id,
                'user_id' => Auth::id(),
                'error' => $e->getMessage()
            ]);

            return back()
                ->withInput()
                ->with('error', 'Failed to update product. Please try again.');
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

            return redirect()
                ->route('products.index')
                ->with('success', "Product '{$productName}' has been deleted successfully.");
        } catch (\Exception $e) {
            Log::error('Error deleting product', [
                'product_id' => $product->id,
                'user_id' => Auth::id(),
                'error' => $e->getMessage()
            ]);

            return back()->with('error', 'Failed to delete product.');
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

            return back()->with('success', "{$count} products have been deleted successfully.");
        } catch (\Exception $e) {
            Log::error('Error bulk deleting products', [
                'ids' => $request->ids,
                'user_id' => Auth::id(),
                'error' => $e->getMessage()
            ]);

            return back()->with('error', 'Failed to delete selected products.');
        }
    }

    /**
     * Generate unique product code.
     */
    public function generateCode()
    {
        try {
            // Get the latest product code
            $latestProduct = Product::whereNotNull('code')
                ->where('code', 'regexp', '^PRD-[0-9]{6}$')
                ->latest('id')
                ->first();

            if ($latestProduct && preg_match('/PRD-(\d{6})/', $latestProduct->code, $matches)) {
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

            return response()->json([
                'success' => true,
                'code' => $code
            ]);
        } catch (\Exception $e) {
            Log::error('Error generating product code', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to generate product code'
            ], 500);
        }
    }

    /**
     * ✅ TAMBAHAN: Search product by barcode/code - UNTUK SCAN BARCODE
     * 
     * @param string $code
     * @return JsonResponse
     */
    public function searchByCode(Request $request): JsonResponse
    {
        try {
            // Ambil code dari query parameter atau route parameter
            $code = $request->get('code') ?? $request->route('code');

            // Clean the code input
            $cleanCode = trim($code);

            if (empty($cleanCode)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Code parameter is required',
                    'product' => null
                ], 400);
            }

            // Search product by multiple code fields
            $product = Product::with(['supplier', 'category', 'unit'])
                ->where(function ($query) use ($cleanCode) {
                    $query->where('code', $cleanCode)
                        ->orWhere('barcode', $cleanCode)
                        ->orWhere('sku', $cleanCode);
                })
                ->first();

            if (!$product) {
                return response()->json([
                    'success' => false,
                    'message' => 'Product not found for this code',
                    'product' => null
                ], 404);
            }

            // Return response yang sesuai dengan yang diharapkan React
            return response()->json([
                'success' => true,
                'message' => 'Product found successfully',
                'product' => [
                    'id' => $product->id,
                    'name' => $product->name,
                    'sku' => $product->sku,
                    'code' => $product->code,
                    'barcode' => $product->barcode,
                    'description' => $product->description,
                    'supplier_id' => $product->supplier_id,
                    'category_id' => $product->category_id,
                    'unit_id' => $product->unit_id,
                    'current_stock' => $product->current_stock,
                    'minimum_stock' => $product->minimum_stock,
                    'maximum_stock' => $product->maximum_stock,
                    'price' => $product->price,
                    'cost' => $product->cost,
                    'location' => $product->location,
                    'supplier' => $product->supplier ? [
                        'id' => $product->supplier->id,
                        'name' => $product->supplier->name,
                        'phone' => $product->supplier->phone ?? null,
                        'email' => $product->supplier->email ?? null,
                        'address' => $product->supplier->address ?? null,
                    ] : null,
                    'category' => $product->category ? [
                        'id' => $product->category->id,
                        'name' => $product->category->name,
                    ] : null,
                    'unit' => $product->unit ? [
                        'id' => $product->unit->id,
                        'name' => $product->unit->name,
                        'symbol' => $product->unit->symbol ?? null,
                    ] : null
                ]
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error searching product by code', [
                'code' => $code ?? 'N/A',
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred while searching for the product',
                'product' => null
            ], 500);
        }
    }

    /**
     * Show barcode for the product.
     */
    public function showBarcode(Product $product)
    {
        $this->authorize('view', $product);

        return Inertia::render('Products/Barcode', [
            'product' => $product,
        ]);
    }

    /**
     * Generate barcode SVG for the product.
     */
    public function generateBarcode(Product $product)
    {
        try {
            $this->authorize('view', $product);

            $codeToEncode = $product->barcode ?: $product->code ?: $product->sku;

            if (!$codeToEncode) {
                return response()->json(['error' => 'No code available for barcode generation'], 400);
            }

            $barcode = DNS1D::getBarcodeSVG($codeToEncode, 'C128', 2, 100);

            return response()->json([
                'svg' => $barcode,
                'code' => $codeToEncode,
                'product_name' => $product->name
            ]);
        } catch (\Exception $e) {
            Log::error('Error generating barcode', [
                'product_id' => $product->id,
                'error' => $e->getMessage()
            ]);

            return response()->json(['error' => 'Failed to generate barcode'], 500);
        }
    }

    /**
     * Download barcode QR for the product.
     */
    public function downloadBarcode(Product $product)
    {
        try {
            $this->authorize('view', $product);

            $codeToEncode = $product->barcode ?: $product->code ?: $product->sku;

            if (!$codeToEncode) {
                return back()->with('error', 'No code available for barcode generation.');
            }

            $svg = QrCode::format('svg')
                ->size(300)
                ->generate($codeToEncode);

            $filename = "qr_product_" . preg_replace('/[^A-Za-z0-9\-_]/', '_', $product->sku) . ".svg";

            return response($svg)
                ->header('Content-Type', 'image/svg+xml')
                ->header('Content-Disposition', 'attachment; filename="' . $filename . '"');
        } catch (\Exception $e) {
            Log::error('Error downloading barcode', [
                'product_id' => $product->id,
                'error' => $e->getMessage()
            ]);

            return back()->with('error', 'Failed to download QR code.');
        }
    }
}
