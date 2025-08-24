<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CategoryController extends Controller
{
    /**
     * Constructor untuk mengaktifkan otorisasi berbasis CategoryPolicy.
     */
    public function __construct()
    {
        $this->authorizeResource(Category::class, 'category');
    }

    /**
     * Menampilkan daftar kategori.
     */
    public function index(Request $request)
    {
        // ✅ Improved validation
        $request->validate([
            'search' => 'nullable|string|max:255',
            'created_date' => 'nullable|date',
            'per_page' => 'nullable|integer|min:1|max:100',
            'sort_by' => 'nullable|string|in:id,name,description,created_at,updated_at',
            'sort_direction' => 'nullable|string|in:asc,desc',
            'page' => 'nullable|integer|min:1',
        ]);

        // Ambil semua parameter filter dari request
        $filters = $request->only(['search', 'created_date', 'per_page', 'sort_by', 'sort_direction', 'page']);

        // Default nilai
        $perPage = $filters['per_page'] ?? 10;
        $sortBy = $filters['sort_by'] ?? 'created_at';
        $sortDirection = $filters['sort_direction'] ?? 'desc';

        // ✅ Improved: More comprehensive sort validation
        $validSortColumns = ['id', 'name', 'description', 'created_at', 'updated_at'];
        if (!in_array($sortBy, $validSortColumns)) {
            $sortBy = 'created_at';
        }
        if (!in_array($sortDirection, ['asc', 'desc'])) {
            $sortDirection = 'desc';
        }

        // Bangun query untuk kategori
        $categories = Category::query()
            ->when($filters['search'] ?? null, function ($query, $search) {
                $query->where('name', 'like', '%' . $search . '%')
                    ->orWhere('description', 'like', '%' . $search . '%');
            })
            ->when($filters['created_date'] ?? null, function ($query, $date) {
                $query->whereDate('created_at', $date);
            })
            ->orderBy($sortBy, $sortDirection)
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('Categories/Index', [
            'categories' => $categories,
            'filters' => [
                ...$filters,
                'sort_by' => $sortBy,
                'sort_direction' => $sortDirection,
                'per_page' => $perPage,
            ],
        ]);
    }

    /**
     * Menampilkan form untuk membuat kategori baru.
     */
    public function create()
    {
        return Inertia::render('Categories/Create');
    }

    /**
     * Menyimpan kategori baru ke database.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:categories,name',
            'description' => 'nullable|string|max:1000', // ✅ Added max length
        ]);

        try {
            Category::create($validated);
            return redirect()->route('categories.index')
                ->with('success', 'Kategori berhasil ditambahkan!');
        } catch (\Exception $e) {
            return redirect()->back()
                ->withErrors(['error' => 'Terjadi kesalahan saat menambahkan kategori.'])
                ->withInput();
        }
    }

    /**
     * Menampilkan form untuk mengedit kategori.
     */
    public function edit(Category $category)
    {
        return Inertia::render('Categories/Edit', [
            'category' => $category,
        ]);
    }

    /**
     * Memperbarui kategori di database.
     */
    public function update(Request $request, Category $category)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:categories,name,' . $category->id,
            'description' => 'nullable|string|max:1000', // ✅ Added max length
        ]);

        try {
            $category->update($validated);
            return redirect()->route('categories.index')
                ->with('success', 'Kategori berhasil diperbarui!');
        } catch (\Exception $e) {
            return redirect()->back()
                ->withErrors(['error' => 'Terjadi kesalahan saat memperbarui kategori.'])
                ->withInput();
        }
    }

    /**
     * Menghapus kategori dari database.
     */
    public function destroy(Category $category)
    {
        try {
            // ✅ Check for relationships before delete
            if ($category->products()->exists()) {
                return redirect()->back()
                    ->withErrors(['error' => 'Kategori tidak dapat dihapus karena masih digunakan dalam produk.']);
            }

            $category->delete();
            return redirect()->route('categories.index')
                ->with('success', 'Kategori berhasil dihapus!');
        } catch (\Exception $e) {
            return redirect()->back()
                ->withErrors(['error' => 'Terjadi kesalahan saat menghapus kategori.']);
        }
    }

    /**
     * ✅ Fixed: Added authorization check for bulk delete
     */
    public function bulkDelete(Request $request)
    {
        // ✅ Added authorization check
        $this->authorize('delete', Category::class);

        $request->validate([
            'ids' => 'required|array|min:1|max:100', // ✅ Added limits
            'ids.*' => 'exists:categories,id',
        ]);

        try {
            // ✅ Check for relationships before bulk delete
            $categoriesWithProducts = Category::whereIn('id', $request->ids)
                ->whereHas('products')
                ->count();

            if ($categoriesWithProducts > 0) {
                return back()->withErrors([
                    'error' => "Tidak dapat menghapus {$categoriesWithProducts} kategori karena masih digunakan dalam produk."
                ]);
            }

            $deletedCount = Category::whereIn('id', $request->ids)->delete();

            return back()->with('success', "{$deletedCount} kategori berhasil dihapus.");
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Terjadi kesalahan saat menghapus kategori.']);
        }
    }
}
