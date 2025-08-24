<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class EoqRopController extends Controller
{
    /**
     * Constructor untuk mengaktifkan otorisasi.
     */
    public function __construct()
    {
        // Gunakan middleware permission untuk EOQ-ROP
        $this->middleware('check.permission:view-advanced-reports')->only(['index']);
        $this->middleware('check.permission:edit-products')->only(['updateParameters']);
    }

    /**
     * Menampilkan halaman EOQ & ROP.
     */
    public function index(Request $request)
    {
        $filters = $request->only([
            'search',
            'created_at',
            'per_page',
            'page'
        ]);

        $perPage = $filters['per_page'] ?? 10;

        $products = Product::query()
            ->when($filters['search'] ?? null, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('sku', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%");
            })
            ->when($filters['created_at'] ?? null, function ($query, $date) {
                $query->whereDate('created_at', $date);
            })
            ->orderBy('name')
            ->paginate($perPage)
            ->withQueryString();

        // Hitung ulang ROP dan EOQ untuk setiap produk
        foreach ($products as $product) {
            $this->calculateAndUpdateRopEoq($product);
        }

        return Inertia::render('EoqRop/Index', [
            'products' => $products,
            'filters' => $filters,
            'eoqRopData' => [], // Data tambahan jika diperlukan
            'flash' => [
                'success' => session('success'),
                'error' => session('error'),
            ],
        ]);
    }

    /**
     * Metode untuk memperbarui parameter EOQ/ROP produk.
     */
    public function updateParameters(Request $request, Product $product)
    {
        try {
            $validated = $request->validate([
                'lead_time' => 'required|integer|min:0|max:365',
                'daily_usage_rate' => 'required|numeric|min:0',
                'holding_cost_percentage' => 'required|numeric|min:0|max:1',
                'ordering_cost' => 'required|numeric|min:0',
            ]);

            DB::transaction(function () use ($product, $validated) {
                // Update parameter
                $product->update($validated);

                // Recalculate dan update ROP dan EOQ
                $this->calculateAndUpdateRopEoq($product);
            });

            Log::info('EOQ ROP parameters updated', [
                'product_id' => $product->id,
                'product_name' => $product->name,
                'parameters' => $validated,
                'new_rop' => $product->fresh()->rop,
                'new_eoq' => $product->fresh()->eoq,
            ]);

            return back()->with('success', 'Parameter EOQ & ROP berhasil diperbarui.');
        } catch (\Exception $e) {
            Log::error('Error updating EOQ ROP parameters', [
                'product_id' => $product->id,
                'error' => $e->getMessage(),
                'data' => $request->all()
            ]);

            return back()
                ->withInput()
                ->withErrors(['general' => 'Gagal memperbarui parameter. Silakan coba lagi.']);
        }
    }

    /**
     * Calculate and update ROP & EOQ for a product
     */
    private function calculateAndUpdateRopEoq(Product $product)
    {
        try {
            // Calculate ROP = Lead Time × Daily Usage Rate
            $rop = $product->lead_time * $product->daily_usage_rate;

            // Calculate EOQ = √((2 × Annual Demand × Ordering Cost) / (Unit Cost × Holding Cost Percentage))
            $annualDemand = $product->daily_usage_rate * 365;
            $unitCost = $product->price ?? 1; // Use product price or default to 1 if not set

            if ($product->holding_cost_percentage > 0 && $unitCost > 0) {
                $eoq = sqrt((2 * $annualDemand * $product->ordering_cost) / ($unitCost * $product->holding_cost_percentage));
            } else {
                $eoq = 0;
            }

            // Update ROP dan EOQ (round untuk nilai integer)
            $product->update([
                'rop' => round($rop),
                'eoq' => round($eoq)
            ]);
        } catch (\Exception $e) {
            Log::error('Error calculating ROP/EOQ', [
                'product_id' => $product->id,
                'error' => $e->getMessage()
            ]);

            // Set default values if calculation fails
            $product->update([
                'rop' => 0,
                'eoq' => 0
            ]);
        }
    }

    /**
     * Bulk recalculate ROP & EOQ untuk semua produk
     */
    public function bulkRecalculate()
    {
        try {
            $products = Product::all();
            $updated = 0;

            foreach ($products as $product) {
                $this->calculateAndUpdateRopEoq($product);
                $updated++;
            }

            return back()->with('success', "Berhasil menghitung ulang EOQ & ROP untuk {$updated} produk.");
        } catch (\Exception $e) {
            Log::error('Error bulk recalculating EOQ ROP', [
                'error' => $e->getMessage()
            ]);

            return back()->with('error', 'Gagal menghitung ulang EOQ & ROP untuk semua produk.');
        }
    }
}
