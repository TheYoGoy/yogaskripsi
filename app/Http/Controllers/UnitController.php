<?php

namespace App\Http\Controllers;

use App\Models\Unit;
use Illuminate\Http\Request;
use Inertia\Inertia;

class UnitController extends Controller
{
    /**
     * Constructor untuk mengaktifkan otorisasi berbasis UnitPolicy.
     */
    public function __construct()
    {
        $this->authorizeResource(Unit::class, 'unit');
    }

    /**
     * Menampilkan daftar unit.
     */
    public function index(Request $request)
    {
        // ✅ Improved validation
        $request->validate([
            'search' => 'nullable|string|max:255',
            'created_date' => 'nullable|date',
            'per_page' => 'nullable|integer|min:1|max:100',
            'sort_by' => 'nullable|string|in:id,name,symbol,description,created_at,updated_at',
            'sort_direction' => 'nullable|string|in:asc,desc',
            'page' => 'nullable|integer|min:1',
        ]);

        // Ambil semua parameter filter dari request
        $filters = $request->only([
            'search',
            'created_date',
            'per_page',
            'sort_by',
            'sort_direction',
            'page'
        ]);

        // Default nilai
        $perPage = $filters['per_page'] ?? 10;
        $sortBy = $filters['sort_by'] ?? 'created_at';
        $sortDirection = $filters['sort_direction'] ?? 'desc';

        // ✅ Improved: More comprehensive sort validation
        $validSortColumns = ['id', 'name', 'symbol', 'description', 'created_at', 'updated_at'];
        if (!in_array($sortBy, $validSortColumns)) {
            $sortBy = 'created_at';
        }

        if (!in_array($sortDirection, ['asc', 'desc'])) {
            $sortDirection = 'desc';
        }

        // Query data unit dengan filter, sorting, dan pagination
        $units = Unit::query()
            ->when($filters['search'] ?? null, function ($query, $search) {
                $query->where('name', 'like', '%' . $search . '%')
                    ->orWhere('symbol', 'like', '%' . $search . '%')
                    ->orWhere('description', 'like', '%' . $search . '%'); // ✅ Added more search fields
            })
            ->when($filters['created_date'] ?? null, function ($query, $date) {
                $query->whereDate('created_at', $date);
            })
            ->orderBy($sortBy, $sortDirection)
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('Units/Index', [
            'units' => $units,
            'filters' => $filters,
        ]);
    }

    /**
     * Menampilkan form untuk membuat unit baru.
     */
    public function create()
    {
        return Inertia::render('Units/Create');
    }

    /**
     * Menyimpan unit baru ke database.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:units,name',
            'symbol' => 'required|string|max:10|unique:units,symbol',
            'description' => 'nullable|string|max:1000', // ✅ Added max length
        ]);

        try {
            Unit::create($validated);
            return redirect()->route('units.index')
                ->with('success', 'Satuan berhasil ditambahkan!');
        } catch (\Exception $e) {
            return redirect()->back()
                ->withErrors(['error' => 'Terjadi kesalahan saat menambahkan satuan.'])
                ->withInput();
        }
    }

    /**
     * Menampilkan form untuk mengedit unit.
     */
    public function edit(Unit $unit)
    {
        return Inertia::render('Units/Edit', [
            'unit' => $unit,
        ]);
    }

    /**
     * Memperbarui unit di database.
     */
    public function update(Request $request, Unit $unit)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:units,name,' . $unit->id,
            'symbol' => 'required|string|max:10|unique:units,symbol,' . $unit->id,
            'description' => 'nullable|string|max:1000', // ✅ Added max length
        ]);

        try {
            $unit->update($validated);
            return redirect()->route('units.index')
                ->with('success', 'Satuan berhasil diperbarui!');
        } catch (\Exception $e) {
            return redirect()->back()
                ->withErrors(['error' => 'Terjadi kesalahan saat memperbarui satuan.'])
                ->withInput();
        }
    }

    /**
     * Menghapus unit dari database.
     */
    public function destroy(Unit $unit)
    {
        try {
            // ✅ Check for relationships before delete
            if ($unit->products()->exists()) {
                return redirect()->back()
                    ->withErrors(['error' => 'Satuan tidak dapat dihapus karena masih digunakan dalam produk.']);
            }

            $unit->delete();
            return redirect()->route('units.index')
                ->with('success', 'Satuan berhasil dihapus!');
        } catch (\Exception $e) {
            return redirect()->back()
                ->withErrors(['error' => 'Terjadi kesalahan saat menghapus satuan.']);
        }
    }

    /**
     * ✅ Fixed: Added authorization check for bulk delete
     */
    public function bulkDelete(Request $request)
    {
        // ✅ Added authorization check
        $this->authorize('delete', Unit::class);

        $request->validate([
            'ids' => 'required|array|min:1|max:100', // ✅ Added limits
            'ids.*' => 'exists:units,id',
        ]);

        try {
            // ✅ Check for relationships before bulk delete
            $unitsWithProducts = Unit::whereIn('id', $request->ids)
                ->whereHas('products')
                ->count();

            if ($unitsWithProducts > 0) {
                return back()->withErrors([
                    'error' => "Tidak dapat menghapus {$unitsWithProducts} satuan karena masih digunakan dalam produk."
                ]);
            }

            $deletedCount = Unit::whereIn('id', $request->ids)->delete();

            return back()->with('success', "{$deletedCount} satuan berhasil dihapus.");
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Terjadi kesalahan saat menghapus satuan.']);
        }
    }
}
