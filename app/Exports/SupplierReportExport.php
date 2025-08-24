<?php

namespace App\Exports;

use App\Models\Supplier;
use Illuminate\Contracts\View\View;
use Maatwebsite\Excel\Concerns\FromView;
use Illuminate\Http\Request;

class SupplierReportExport implements FromView
{
    protected $request;

    public function __construct(Request $request)
    {
        $this->request = $request;
    }

    public function view(): View
    {
        $suppliers = Supplier::withCount([
            'purchaseTransactions as total_transactions',
        ])
            ->withSum([
                'purchaseTransactions as total_amount' => fn($query) =>
                $query
                    ->when(
                        $this->request->filled('start_date'),
                        fn($q) => $q->whereDate('transaction_date', '>=', $this->request->start_date)
                    )
                    ->when(
                        $this->request->filled('end_date'),
                        fn($q) => $q->whereDate('transaction_date', '<=', $this->request->end_date)
                    )
            ], 'total_price')
            ->when(
                $this->request->filled('search'),
                fn($query) => $query->where('name', 'like', '%' . $this->request->search . '%')
            )
            ->orderBy('name')
            ->get();

        return view('exports.supplier_report', [
            'suppliers' => $suppliers
        ]);
    }
}
