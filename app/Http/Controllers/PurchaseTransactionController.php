<?php

namespace App\Http\Controllers;

use App\Models\PurchaseTransaction;
use App\Models\Product;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Barryvdh\DomPDF\Facade\Pdf;
use Milon\Barcode\Facades\DNS1DFacade as DNS1D;
use Illuminate\Support\Facades\Auth;
use SimpleSoftwareIO\QrCode\Facades\QrCode;
use Illuminate\Support\Facades\DB;

class PurchaseTransactionController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(PurchaseTransaction::class, 'purchase_transaction');
    }

    /**
     * Menampilkan daftar transaksi pembelian.
     */
    public function index(Request $request)
    {
        $filters = $request->only([
            'search',
            'transaction_date',
            'supplier_id',
            'product_id',
            'per_page',
            'sort_by',
            'sort_direction',
            'page',
        ]);

        $perPage = $filters['per_page'] ?? 10;
        $sortBy = $filters['sort_by'] ?? 'transaction_date';
        $sortDirection = $filters['sort_direction'] ?? 'desc';

        $validSortColumns = ['transaction_date', 'quantity', 'price_per_unit', 'total_price', 'created_at', 'invoice_number'];
        if (!in_array($sortBy, $validSortColumns)) {
            $sortBy = 'transaction_date';
        }
        if (!in_array($sortDirection, ['asc', 'desc'])) {
            $sortDirection = 'desc';
        }

        $purchaseTransactions = PurchaseTransaction::with(['product.supplier', 'supplier', 'user'])
            ->when($filters['search'] ?? null, function ($query, $search) {
                $query->whereHas('product', fn($q) => $q->where('name', 'like', "%$search%"))
                    ->orWhereHas('supplier', fn($q) => $q->where('name', 'like', "%$search%"))
                    ->orWhere('invoice_number', 'like', "%$search%"); // ← Tambahan: search by invoice
            })
            ->when($filters['transaction_date'] ?? null, fn($q, $date) => $q->whereDate('transaction_date', $date))
            ->when($filters['supplier_id'] ?? null, fn($q, $supplierId) => $q->where('supplier_id', $supplierId))
            ->when($filters['product_id'] ?? null, fn($q, $productId) => $q->where('product_id', $productId))
            ->orderBy($sortBy, $sortDirection)
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('PurchaseTransactions/Index', [
            'purchaseTransactions' => $purchaseTransactions,
            'filters' => $filters,
            'suppliers' => Supplier::select('id', 'name')->get(),
            'products' => Product::select('id', 'name')->get(),
            'flash' => [
                'success' => session('success'),
                'error' => session('error'),
            ],
        ]);
    }

    /**
     * Form membuat transaksi pembelian baru.
     */
    public function create()
    {
        return Inertia::render('PurchaseTransactions/Create', [
            'products' => Product::all(),
            'suppliers' => Supplier::all(),
        ]);
    }

    /**
     * Simpan transaksi pembelian baru.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'supplier_id' => 'required|exists:suppliers,id',
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|integer|min:1',
            'price_per_unit' => 'required|numeric|min:0',
            'transaction_date' => 'nullable|date',
            'notes' => 'nullable|string|max:1000', // ← Tambah max length
        ]);

        $transactionDate = $validated['transaction_date'] ?? now();
        $dateStr = Carbon::parse($transactionDate)->format('ym');

        try {
            // Gunakan DB transaction untuk atomicity
            $purchaseTransaction = DB::transaction(function () use ($validated, $transactionDate, $dateStr) {
                // Ambil invoice terakhir untuk bulan dan tahun yang sama dengan lock
                $lastInvoice = PurchaseTransaction::where('invoice_number', 'like', "INV-{$dateStr}-%")
                    ->lockForUpdate() // ← Prevent race condition
                    ->latest('id')
                    ->first();

                if ($lastInvoice && preg_match('/(\d{3})$/', $lastInvoice->invoice_number, $matches)) {
                    $nextNumber = intval($matches[1]) + 1;
                } else {
                    $nextNumber = 1;
                }

                $increment = str_pad($nextNumber, 3, '0', STR_PAD_LEFT);
                $invoiceNumber = "INV-{$dateStr}-{$increment}";

                return PurchaseTransaction::create([
                    'invoice_number' => $invoiceNumber,
                    'supplier_id' => $validated['supplier_id'],
                    'product_id' => $validated['product_id'],
                    'quantity' => $validated['quantity'],
                    'price_per_unit' => $validated['price_per_unit'],
                    'total_price' => $validated['quantity'] * $validated['price_per_unit'],
                    'transaction_date' => $transactionDate,
                    'user_id' => Auth::id(),
                    'notes' => $validated['notes'] ?? null,
                    'status' => 'pending',
                ]);
            });

            return redirect()
                ->route('purchase-transactions.index')
                ->with('success', 'Purchase transaction recorded successfully.');
        } catch (\Exception $e) {
            Log::error('Error creating purchase transaction', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
                'data' => $validated
            ]);

            return back()
                ->withInput()
                ->with('error', 'Gagal menyimpan transaksi pembelian. Silakan coba lagi.');
        }
    }

    /**
     * Edit transaksi pembelian.
     */
    public function edit(PurchaseTransaction $purchaseTransaction)
    {
        return Inertia::render('PurchaseTransactions/Edit', [
            'purchaseTransaction' => $purchaseTransaction->load('product', 'supplier'),
            'products' => Product::select('id', 'name', 'current_stock', 'supplier_id')->get(),
            'suppliers' => Supplier::select('id', 'name', 'phone')->get(),
        ]);
    }

    /**
     * Update transaksi pembelian.
     */
    public function update(Request $request, PurchaseTransaction $purchaseTransaction)
    {
        $validated = $request->validate([
            'invoice_number' => 'required|string|max:255|unique:purchase_transactions,invoice_number,' . $purchaseTransaction->id, // ← Tambah unique validation
            'supplier_id' => 'required|exists:suppliers,id',
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|integer|min:1',
            'price_per_unit' => 'required|numeric|min:0',
            'transaction_date' => 'required|date',
            'notes' => 'nullable|string|max:1000',
        ]);

        $validated['total_price'] = $validated['quantity'] * $validated['price_per_unit'];

        try {
            $purchaseTransaction->update($validated);

            return redirect()
                ->route('purchase-transactions.index')
                ->with('success', 'Purchase transaction updated successfully.');
        } catch (\Exception $e) {
            Log::error('Error updating purchase transaction', [
                'transaction_id' => $purchaseTransaction->id,
                'user_id' => Auth::id(),
                'error' => $e->getMessage()
            ]);

            return back()
                ->withInput()
                ->with('error', 'Gagal mengupdate transaksi pembelian.');
        }
    }

    /**
     * Hapus transaksi pembelian.
     */
    public function destroy(PurchaseTransaction $purchaseTransaction)
    {
        try {
            $invoiceNumber = $purchaseTransaction->invoice_number;
            $purchaseTransaction->delete();

            return redirect()
                ->route('purchase-transactions.index')
                ->with('success', "Transaksi {$invoiceNumber} berhasil dihapus.");
        } catch (\Exception $e) {
            Log::error('Error deleting purchase transaction', [
                'transaction_id' => $purchaseTransaction->id,
                'user_id' => Auth::id(),
                'error' => $e->getMessage()
            ]);

            return back()->with('error', 'Gagal menghapus transaksi pembelian.');
        }
    }

    /**
     * Bulk delete transaksi pembelian.
     */
    public function bulkDelete(Request $request)
    {
        $request->validate([
            'ids' => 'required|array|min:1|max:100', // ← Tambah batas maksimal
            'ids.*' => 'exists:purchase_transactions,id',
        ]);

        try {
            $count = PurchaseTransaction::whereIn('id', $request->ids)->count();
            PurchaseTransaction::whereIn('id', $request->ids)->delete();

            return back()->with('success', "{$count} transaksi pembelian berhasil dihapus.");
        } catch (\Exception $e) {
            Log::error('Error bulk deleting purchase transactions', [
                'ids' => $request->ids,
                'user_id' => Auth::id(),
                'error' => $e->getMessage()
            ]);

            return back()->with('error', 'Gagal menghapus transaksi pembelian terpilih.');
        }
    }

    /**
     * Tampilkan barcode transaksi pembelian.
     */
    public function barcode(PurchaseTransaction $purchaseTransaction)
    {
        $this->authorize('view', $purchaseTransaction);

        return Inertia::render('PurchaseTransactions/Barcode', [
            'purchaseTransaction' => $purchaseTransaction,
        ]);
    }

    /**
     * Generate barcode SVG transaksi pembelian.
     */
    public function generateBarcode(PurchaseTransaction $purchaseTransaction)
    {
        try {
            $this->authorize('view', $purchaseTransaction); // ← Tambah authorization

            $barcode = DNS1D::getBarcodeSVG($purchaseTransaction->invoice_number, 'C128', 2, 100);

            return response()->json([
                'svg' => $barcode,
                'invoice_number' => $purchaseTransaction->invoice_number
            ]);
        } catch (\Exception $e) {
            Log::error('Error generating barcode', [
                'transaction_id' => $purchaseTransaction->id,
                'error' => $e->getMessage()
            ]);

            return response()->json(['error' => 'Gagal generate barcode'], 500);
        }
    }

    /**
     * Download barcode QR transaksi pembelian.
     */
    public function downloadBarcode(PurchaseTransaction $purchaseTransaction)
    {
        try {
            $this->authorize('view', $purchaseTransaction); // ← Tambah authorization

            $svg = QrCode::format('svg')
                ->size(300)
                ->generate($purchaseTransaction->invoice_number);

            $filename = "qr_" . preg_replace('/[^A-Za-z0-9\-_]/', '_', $purchaseTransaction->invoice_number) . ".svg";

            return response($svg)
                ->header('Content-Type', 'image/svg+xml')
                ->header('Content-Disposition', 'attachment; filename="' . $filename . '"');
        } catch (\Exception $e) {
            Log::error('Error downloading barcode', [
                'transaction_id' => $purchaseTransaction->id,
                'error' => $e->getMessage()
            ]);

            return back()->with('error', 'Gagal download QR code.');
        }
    }

    /**
     * Print invoice transaksi pembelian sebagai PDF.
     */
    public function printInvoice(PurchaseTransaction $purchaseTransaction)
    {
        // Authorize user dapat melihat transaksi ini
        $this->authorize('view', $purchaseTransaction);

        // Load semua relasi yang diperlukan
        $purchaseTransaction->load(['product', 'supplier', 'user']);

        try {
            // Generate PDF dengan konfigurasi yang optimal
            $pdf = Pdf::loadView('purchase_transactions.invoice', [
                'transaction' => $purchaseTransaction,
            ])
                ->setPaper('a4', 'portrait')
                ->setOptions([
                    'dpi' => 150,
                    'defaultFont' => 'sans-serif',
                    'isHtml5ParserEnabled' => true,
                    'isPhpEnabled' => true
                ]);

            // Clean filename untuk menghindari karakter ilegal
            $filename = "invoice_" . preg_replace('/[^A-Za-z0-9\-_]/', '_', $purchaseTransaction->invoice_number) . ".pdf";

            return $pdf->stream($filename);
        } catch (\Exception $e) {
            // Log error untuk debugging
            Log::error('Error generating PDF invoice', [
                'transaction_id' => $purchaseTransaction->id,
                'invoice_number' => $purchaseTransaction->invoice_number,
                'user_id' => Auth::id(),
                'error' => $e->getMessage()
            ]);

            // Return error response
            return back()->with('error', 'Gagal generate invoice PDF. Silakan coba lagi.');
        }
    }

    /**
     * Alternative: Download PDF instead of stream
     */
    public function downloadInvoice(PurchaseTransaction $purchaseTransaction)
    {
        $this->authorize('view', $purchaseTransaction);

        $purchaseTransaction->load(['product', 'supplier', 'user']);

        try {
            $pdf = Pdf::loadView('purchase_transactions.invoice', [
                'transaction' => $purchaseTransaction,
            ])
                ->setPaper('a4', 'portrait')
                ->setOptions([
                    'dpi' => 150,
                    'defaultFont' => 'sans-serif'
                ]);

            $filename = "invoice_" . preg_replace('/[^A-Za-z0-9\-_]/', '_', $purchaseTransaction->invoice_number) . ".pdf";

            return $pdf->download($filename);
        } catch (\Exception $e) {
            Log::error('Error downloading PDF invoice', [
                'transaction_id' => $purchaseTransaction->id,
                'user_id' => Auth::id(),
                'error' => $e->getMessage()
            ]);

            return back()->with('error', 'Gagal download invoice PDF.');
        }
    }
}
