<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\EoqRopExport;
use Barryvdh\DomPDF\Facade\Pdf;

class EoqRopController extends Controller
{
    /**
     * Constructor untuk mengaktifkan otorisasi.
     */
    public function __construct()
    {
        // Gunakan middleware permission untuk EOQ-ROP
        $this->middleware('check.permission:view-advanced-reports')->only(['index', 'exportExcel', 'exportPdf']);
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

        // Tambahkan perhitungan ROP dan EOQ ke setiap produk
        $products->getCollection()->transform(function ($product) {
            $calculations = $this->calculateRopEoq($product);
            $product->rop = $calculations['rop'];
            $product->eoq = $calculations['eoq'];
            return $product;
        });

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
     * Export data EOQ ROP ke Excel
     */
    public function exportExcel(Request $request)
    {
        try {
            $filters = $request->only(['search', 'created_at']);
            
            $fileName = 'eoq-rop-report-' . date('Y-m-d-H-i-s') . '.xlsx';
            
            return Excel::download(new EoqRopExport($filters), $fileName);
        } catch (\Exception $e) {
            Log::error('Error exporting EOQ ROP to Excel', [
                'error' => $e->getMessage()
            ]);
            
            return back()->with('error', 'Gagal mengexport data ke Excel.');
        }
    }

    /**
     * Export data EOQ ROP ke PDF
     */
    public function exportPdf(Request $request)
    {
        try {
            $filters = $request->only(['search', 'created_at']);
            
            // Get filtered products data
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
                ->get();

            // Calculate ROP and EOQ for each product
            $products->transform(function ($product) {
                $calculations = $this->calculateRopEoq($product);
                $product->rop = $calculations['rop'];
                $product->eoq = $calculations['eoq'];
                return $product;
            });

            $data = [
                'products' => $products,
                'generated_at' => now()->format('d/m/Y H:i:s'),
                'filters' => $filters
            ];

            $pdf = Pdf::loadView('exports.eoq-rop-pdf', $data);
            $pdf->setPaper('A4', 'landscape');
            
            $fileName = 'eoq-rop-report-' . date('Y-m-d-H-i-s') . '.pdf';
            
            return $pdf->download($fileName);
        } catch (\Exception $e) {
            Log::error('Error exporting EOQ ROP to PDF', [
                'error' => $e->getMessage()
            ]);
            
            return back()->with('error', 'Gagal mengexport data ke PDF.');
        }
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
            });

            // Calculate new values for display
            $calculations = $this->calculateRopEoq($product->fresh());

            Log::info('EOQ ROP parameters updated', [
                'product_id' => $product->id,
                'product_name' => $product->name,
                'parameters' => $validated,
                'calculated_rop' => $calculations['rop'],
                'calculated_eoq' => $calculations['eoq'],
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
     * Calculate ROP & EOQ for a product (tanpa update ke database)
     */
    private function calculateRopEoq(Product $product)
    {
        try {
            $rop = 0;
            $eoq = 0;

            // Calculate ROP = (Lead Time × Daily Usage Rate) + Minimum Stock
            if ($product->lead_time && $product->daily_usage_rate) {
                $rop = ($product->lead_time * $product->daily_usage_rate) + ($product->minimum_stock ?? 0);
            }

            // Calculate EOQ = √((2 × Annual Demand × Ordering Cost) / (Unit Cost × Holding Cost Percentage))
            if ($product->daily_usage_rate && 
                $product->ordering_cost && 
                $product->holding_cost_percentage && 
                $product->price) {
                
                $annualDemand = $product->daily_usage_rate * 365;
                $unitCost = $product->price;
                $holdingCostPerUnit = $unitCost * $product->holding_cost_percentage;
                
                if ($holdingCostPerUnit > 0) {
                    $eoq = sqrt((2 * $annualDemand * $product->ordering_cost) / $holdingCostPerUnit);
                }
            }

            return [
                'rop' => round($rop, 0),
                'eoq' => round($eoq, 0)
            ];
        } catch (\Exception $e) {
            Log::error('Error calculating ROP/EOQ', [
                'product_id' => $product->id,
                'error' => $e->getMessage()
            ]);

            return [
                'rop' => 0,
                'eoq' => 0
            ];
        }
    }

    /**
     * Bulk recalculate - untuk consistency, hanya return success message
     */
    public function bulkRecalculate()
    {
        try {
            // Karena kita hitung real-time, tidak perlu update database
            // Hanya reload halaman dengan pesan sukses
            return back()->with('success', "Perhitungan EOQ & ROP berhasil diperbarui untuk semua produk.");
        } catch (\Exception $e) {
            Log::error('Error bulk recalculating EOQ ROP', [
                'error' => $e->getMessage()
            ]);

            return back()->with('error', 'Gagal menghitung ulang EOQ & ROP untuk semua produk.');
        }
    }
}