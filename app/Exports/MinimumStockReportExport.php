<?php

namespace App\Exports;

use App\Models\Product;
use Illuminate\Contracts\View\View;
use Maatwebsite\Excel\Concerns\FromView;

class MinimumStockReportExport implements FromView
{
    protected $request;

    public function __construct($request)
    {
        $this->request = $request;
    }

    public function view(): View
    {
        $products = Product::with(['category', 'unit'])
            ->whereColumn('current_stock', '<', 'minimum_stock')
            ->when(
                $this->request->category_id && $this->request->category_id !== 'all',
                fn($query) => $query->where('category_id', $this->request->category_id)
            )
            ->orderBy('name')
            ->get();

        return view('exports.minimum_stock_report', compact('products'));
    }
}
