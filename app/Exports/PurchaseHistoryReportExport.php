<?php

namespace App\Exports;

use App\Models\PurchaseTransaction;
use Illuminate\Contracts\View\View;
use Maatwebsite\Excel\Concerns\FromView;

class PurchaseHistoryReportExport implements FromView
{
    protected $request;

    public function __construct($request)
    {
        $this->request = $request;
    }

    public function view(): View
    {
        $purchases = PurchaseTransaction::with(['supplier', 'user'])
            ->when(
                $this->request->supplier_id && $this->request->supplier_id !== 'all',
                fn($query) => $query->where('supplier_id', $this->request->supplier_id)
            )
            ->when(
                $this->request->start_date,
                fn($query) => $query->whereDate('purchase_date', '>=', $this->request->start_date)
            )
            ->when(
                $this->request->end_date,
                fn($query) => $query->whereDate('purchase_date', '<=', $this->request->end_date)
            )
            ->orderByDesc('transaction_date')
            ->get();

        return view('exports.purchase_history_report', compact('purchases'));
    }
}
