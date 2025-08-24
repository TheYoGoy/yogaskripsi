<?php

namespace App\Exports;

use App\Models\StockIn;
use App\Models\StockOut;
use Illuminate\Contracts\View\View;
use Maatwebsite\Excel\Concerns\FromView;
use Illuminate\Http\Request;

class MutationReportExport implements FromView
{
    protected $request;

    public function __construct(Request $request)
    {
        $this->request = $request;
    }

    public function view(): View
    {
        $stockIns = StockIn::with(['product', 'user'])
            ->when(
                $this->request->has('product_id') && $this->request->product_id !== 'all',
                fn($q) => $q->where('product_id', $this->request->product_id)
            )
            ->when(
                $this->request->start_date,
                fn($q) => $q->whereDate('transaction_date', '>=', $this->request->start_date)
            )
            ->when(
                $this->request->end_date,
                fn($q) => $q->whereDate('transaction_date', '<=', $this->request->end_date)
            )
            ->get()
            ->map(function ($item) {
                $item->type = 'in';
                return $item;
            });

        $stockOuts = StockOut::with(['product', 'user'])
            ->when(
                $this->request->has('product_id') && $this->request->product_id !== 'all',
                fn($q) => $q->where('product_id', $this->request->product_id)
            )
            ->when(
                $this->request->start_date,
                fn($q) => $q->whereDate('transaction_date', '>=', $this->request->start_date)
            )
            ->when(
                $this->request->end_date,
                fn($q) => $q->whereDate('transaction_date', '<=', $this->request->end_date)
            )
            ->get()
            ->map(function ($item) {
                $item->type = 'out';
                return $item;
            });

        $transactions = $stockIns->merge($stockOuts)->sortByDesc('transaction_date')->values();

        return view('exports.mutation_report', [
            'transactions' => $transactions,
        ]);
    }
}
