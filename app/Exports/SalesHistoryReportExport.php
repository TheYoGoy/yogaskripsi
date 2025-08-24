<?php

namespace App\Exports;

use App\Models\SalesTransaction;
use Illuminate\Contracts\View\View;
use Maatwebsite\Excel\Concerns\FromView;

class SalesHistoryReportExport implements FromView
{
    protected $request;

    public function __construct($request)
    {
        $this->request = $request;
    }

    public function view(): View
    {
        $sales = SalesTransaction::with(['user', 'product'])
            ->when(
                $this->request->start_date,
                fn($query) => $query->whereDate('transaction_date', '>=', $this->request->start_date)
            )
            ->when(
                $this->request->end_date,
                fn($query) => $query->whereDate('transaction_date', '<=', $this->request->end_date)
            )
            ->orderByDesc('transaction_date')
            ->get();

        return view('exports.sales_history_report', compact('sales'));
    }
}
