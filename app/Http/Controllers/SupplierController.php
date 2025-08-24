<?php

namespace App\Http\Controllers;

use App\Models\Supplier;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Validation\Rule;
use App\Helpers\CodeGenerator;
use Carbon\Carbon;

class SupplierController extends Controller
{
    /**
     * Display a listing of the suppliers.
     */
    public function index(Request $request)
    {
        // ✅ Improved validation with better sort_by options
        $request->validate([
            'search' => 'nullable|string|max:255',
            'created_date' => 'nullable|date',
            'per_page' => 'nullable|integer|min:1|max:100',
            'sort_by' => 'nullable|string|in:id,code,name,contact_person,phone,email,address,created_at,updated_at',
            'sort_direction' => 'nullable|string|in:asc,desc',
            'page' => 'nullable|integer|min:1',
        ]);

        // Ambil parameter dari request
        $search = $request->input('search');
        $createdDate = $request->input('created_date');
        $perPage = $request->input('per_page', 10);
        $sortBy = $request->input('sort_by', 'created_at');
        $sortDirection = $request->input('sort_direction', 'desc');

        // Query builder untuk supplier
        $query = Supplier::query();

        // Filter berdasarkan pencarian
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', '%' . $search . '%')
                    ->orWhere('contact_person', 'like', '%' . $search . '%')
                    ->orWhere('phone', 'like', '%' . $search . '%')
                    ->orWhere('email', 'like', '%' . $search . '%')
                    ->orWhere('address', 'like', '%' . $search . '%')
                    ->orWhere('code', 'like', '%' . $search . '%'); // ✅ Added code search
            });
        }

        // Filter berdasarkan tanggal dibuat
        if ($createdDate) {
            $query->whereDate('created_at', $createdDate);
        }

        // Sorting
        $query->orderBy($sortBy, $sortDirection);

        // Pagination
        $suppliers = $query->paginate($perPage);

        // Append query parameters ke pagination links
        $suppliers->appends($request->query());

        return Inertia::render('Suppliers/Index', [
            'suppliers' => $suppliers,
            'filters' => [
                'search' => $search,
                'created_date' => $createdDate,
                'per_page' => $perPage,
                'sort_by' => $sortBy,
                'sort_direction' => $sortDirection,
            ],
        ]);
    }

    /**
     * Show the form for creating a new supplier.
     */
    public function create()
    {
        // Cek authorization
        $this->authorize('create', Supplier::class);

        // Generate kode otomatis langsung di sini
        $latestSupplier = Supplier::latest('id')->first();
        $number = 1;
        if ($latestSupplier && $latestSupplier->code) {
            $latestNumber = (int) substr($latestSupplier->code, -4);
            $number = $latestNumber + 1;
        }
        $generatedCode = 'SUP-' . str_pad($number, 4, '0', STR_PAD_LEFT);

        return Inertia::render('Suppliers/Create', [
            'generatedCode' => $generatedCode,
        ]);
    }

    public function generateCode()
    {
        try {
            $latestSupplier = Supplier::latest('id')->first();
            $number = 1;
            if ($latestSupplier && $latestSupplier->code) {
                $latestNumber = (int) substr($latestSupplier->code, -4);
                $number = $latestNumber + 1;
            }
            $generatedCode = 'SUP-' . str_pad($number, 4, '0', STR_PAD_LEFT);

            return response()->json(['generatedCode' => $generatedCode]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to generate code'], 500);
        }
    }

    /**
     * Store a newly created supplier in storage.
     */
    public function store(Request $request)
    {
        $this->authorize('create', Supplier::class);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255|unique:suppliers,email',
            'address' => 'nullable|string|max:500',
            'code' => 'nullable|string|max:255|unique:suppliers,code', // ✅ Added code validation
        ]);

        try {
            // Auto-generate code if not provided
            if (empty($validated['code'])) {
                $latestSupplier = Supplier::latest('id')->first();
                $number = 1;
                if ($latestSupplier && $latestSupplier->code) {
                    $latestNumber = (int) substr($latestSupplier->code, -4);
                    $number = $latestNumber + 1;
                }
                $validated['code'] = 'SUP-' . str_pad($number, 4, '0', STR_PAD_LEFT);
            }

            Supplier::create($validated);

            return Redirect::route('suppliers.index')
                ->with('success', 'Supplier berhasil ditambahkan!');
        } catch (\Exception $e) {
            return Redirect::back()
                ->withErrors(['error' => 'Terjadi kesalahan saat menambahkan supplier.'])
                ->withInput();
        }
    }

    /**
     * Display the specified supplier.
     */
    public function show(Supplier $supplier)
    {
        // Cek authorization
        $this->authorize('view', $supplier);

        return Inertia::render('Suppliers/Show', [
            'supplier' => $supplier,
        ]);
    }

    /**
     * Show the form for editing the specified supplier.
     */
    public function edit(Supplier $supplier)
    {
        $this->authorize('update', $supplier);

        return Inertia::render('Suppliers/Edit', [
            'supplier' => $supplier,
        ]);
    }

    /**
     * Update the specified supplier in storage.
     */
    public function update(Request $request, Supplier $supplier)
    {
        // Cek authorization
        $this->authorize('update', $supplier);

        // Validasi input
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
            'email' => [
                'nullable',
                'email',
                'max:255',
                Rule::unique('suppliers', 'email')->ignore($supplier->id),
            ],
            'address' => 'nullable|string|max:500',
            'code' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('suppliers', 'code')->ignore($supplier->id), // ✅ Added code validation
            ],
        ]);

        try {
            // Update supplier
            $supplier->update($validated);

            return Redirect::route('suppliers.index')
                ->with('success', 'Supplier berhasil diperbarui!');
        } catch (\Exception $e) {
            return Redirect::back()
                ->withErrors(['error' => 'Terjadi kesalahan saat memperbarui supplier.'])
                ->withInput();
        }
    }

    /**
     * Remove the specified supplier from storage.
     */
    public function destroy(Supplier $supplier)
    {
        // Cek authorization
        $this->authorize('delete', $supplier);

        try {
            // Cek apakah supplier masih digunakan dalam transaksi/pesanan
            // ✅ Added check for products relationship
            if ($supplier->products()->exists()) {
                return Redirect::back()
                    ->withErrors(['error' => 'Supplier tidak dapat dihapus karena masih digunakan dalam produk.']);
            }

            // Hapus supplier
            $supplier->delete();

            return Redirect::route('suppliers.index')
                ->with('success', 'Supplier berhasil dihapus!');
        } catch (\Exception $e) {
            return Redirect::back()
                ->withErrors(['error' => 'Terjadi kesalahan saat menghapus supplier.']);
        }
    }

    /**
     * Export suppliers to Excel/CSV
     */
    public function export(Request $request)
    {
        // Cek authorization
        $this->authorize('viewAny', Supplier::class);

        // Implementasi export jika diperlukan
        // Bisa menggunakan package seperti Laravel Excel

        return response()->json(['message' => 'Export feature coming soon']);
    }

    /**
     * Get supplier data for API/AJAX requests
     */
    public function apiIndex(Request $request)
    {
        $search = $request->input('search');
        $limit = $request->input('limit', 10);

        $query = Supplier::query();

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', '%' . $search . '%')
                    ->orWhere('contact_person', 'like', '%' . $search . '%')
                    ->orWhere('email', 'like', '%' . $search . '%')
                    ->orWhere('code', 'like', '%' . $search . '%'); // ✅ Added code search
            });
        }

        $suppliers = $query->select('id', 'code', 'name', 'contact_person', 'phone', 'email')
            ->limit($limit)
            ->get();

        return response()->json($suppliers);
    }

    public function bulkDelete(Request $request)
    {
        $request->validate([
            'ids' => 'required|array|min:1|max:100', // ✅ Added limits
            'ids.*' => 'exists:suppliers,id',
        ]);

        try {
            // ✅ Check for relationships before bulk delete
            $suppliersWithProducts = Supplier::whereIn('id', $request->ids)
                ->whereHas('products')
                ->count();

            if ($suppliersWithProducts > 0) {
                return back()->withErrors([
                    'error' => "Tidak dapat menghapus {$suppliersWithProducts} supplier karena masih digunakan dalam produk."
                ]);
            }

            $deletedCount = Supplier::whereIn('id', $request->ids)->delete();

            // ✅ Fixed: Changed 'Satuan' to 'Supplier'
            return back()->with('success', "{$deletedCount} supplier berhasil dihapus.");
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Terjadi kesalahan saat menghapus supplier.']);
        }
    }
}
