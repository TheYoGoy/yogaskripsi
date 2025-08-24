<?php

namespace App\Exports;

use App\Models\Product;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class StockReportExport implements FromCollection, WithHeadings
{
    public function collection()
    {
        return Product::with('category', 'unit')
            ->get()
            ->map(function ($product) {
                return [
                    'code' => $product->code,
                    'name' => $product->name,
                    'category' => $product->category->name ?? '-',
                    'unit' => $product->unit->name ?? '-',
                    'current_stock' => $product->current_stock,
                ];
            });
    }

    public function headings(): array
    {
        return ['Code', 'Product', 'Category', 'Unit', 'Current Stock'];
    }
}
