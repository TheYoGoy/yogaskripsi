<?php

namespace App\Exports;

use App\Models\Product;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Border;

class EoqRopExport implements FromCollection, WithHeadings, WithMapping, WithStyles, ShouldAutoSize
{
    protected $filters;

    public function __construct($filters = [])
    {
        $this->filters = $filters;
    }

    /**
     * Get collection of products with filters applied
     */
    public function collection()
    {
        $products = Product::query()
            ->when($this->filters['search'] ?? null, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('sku', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%");
            })
            ->when($this->filters['created_at'] ?? null, function ($query, $date) {
                $query->whereDate('created_at', $date);
            })
            ->orderBy('name')
            ->get();

        // Calculate ROP and EOQ for each product
        return $products->map(function ($product) {
            $calculations = $this->calculateRopEoq($product);
            $product->rop = $calculations['rop'];
            $product->eoq = $calculations['eoq'];
            return $product;
        });
    }

    /**
     * Define column headings
     */
    public function headings(): array
    {
        return [
            'Nama Produk',
            'SKU',
            'Kode Produk',
            'Stok Saat Ini',
            'ROP (Reorder Point)',
            'EOQ (Economic Order Quantity)',
            'Lead Time (Hari)',
            'Penggunaan Harian',
            'Biaya Penyimpanan (%)',
            'Biaya Pemesanan (Rp)',
            'Harga (Rp)',
            'Status Stok',
            'Tanggal Dibuat'
        ];
    }

    /**
     * Map data for each row
     */
    public function map($product): array
    {
        $stockStatus = 'Normal';
        if ($product->current_stock <= $product->rop) {
            $stockStatus = 'Di Bawah ROP';
        } elseif ($product->current_stock <= $product->rop * 1.5) {
            $stockStatus = 'Mendekati ROP';
        }

        return [
            $product->name,
            $product->sku,
            $product->code,
            $product->current_stock,
            $product->rop,
            $product->eoq,
            $product->lead_time ?? 0,
            $product->daily_usage_rate ?? 0,
            ($product->holding_cost_percentage ?? 0) * 100,
            $product->ordering_cost ?? 0,
            $product->price ?? 0,
            $stockStatus,
            $product->created_at->format('d/m/Y')
        ];
    }

    /**
     * Apply styles to the worksheet
     */
    public function styles(Worksheet $sheet)
    {
        // Style for header row
        $sheet->getStyle('A1:M1')->applyFromArray([
            'font' => [
                'bold' => true,
                'color' => ['argb' => 'FFFFFF'],
            ],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'color' => ['argb' => '0f766e']
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical' => Alignment::VERTICAL_CENTER,
            ],
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                    'color' => ['argb' => '000000'],
                ]
            ]
        ]);

        // Style for data rows
        $lastRow = $sheet->getHighestRow();
        $sheet->getStyle("A2:M{$lastRow}")->applyFromArray([
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                    'color' => ['argb' => 'CCCCCC'],
                ]
            ],
            'alignment' => [
                'vertical' => Alignment::VERTICAL_CENTER,
            ]
        ]);

        // Right align numeric columns
        $sheet->getStyle("D2:K{$lastRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);

        // Center align status column
        $sheet->getStyle("L2:L{$lastRow}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        return [];
    }

    /**
     * Calculate ROP & EOQ for a product
     */
    private function calculateRopEoq($product)
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
            return [
                'rop' => 0,
                'eoq' => 0
            ];
        }
    }
}