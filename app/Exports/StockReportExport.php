<?php

namespace App\Exports;

use App\Models\Product;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;

class StockReportExport implements FromCollection, WithHeadings, WithStyles, WithColumnWidths, WithTitle, WithEvents
{
    protected $filters;

    public function __construct($filters = [])
    {
        $this->filters = $filters;
    }

    public function collection()
    {
        $query = Product::with(['category', 'supplier', 'unit']);

        // Apply filters based on frontend filter options
        if (!empty($this->filters['category_id']) && $this->filters['category_id'] !== 'all') {
            $query->where('category_id', $this->filters['category_id']);
        }

        if (!empty($this->filters['min_stock'])) {
            $query->where('current_stock', '>=', $this->filters['min_stock']);
        }

        if (!empty($this->filters['max_stock'])) {
            $query->where('current_stock', '<=', $this->filters['max_stock']);
        }

        return $query->get()->map(function ($product, $index) {
            // Calculate stock status
            $stockStatus = $this->getStockStatus($product);

            // Calculate stock value
            $stockValue = ($product->current_stock ?? 0) * ($product->price ?? 0);

            return [
                'no' => $index + 1,
                'sku' => $product->sku ?? $product->code ?? '-',
                'name' => $product->name,
                'category' => $product->category->name ?? '-',
                'supplier' => $product->supplier->name ?? '-',
                'current_stock' => $product->current_stock ?? 0,
                'rop' => $product->rop ?? 0,
                'eoq' => $product->eoq ?? 0,
                'price' => $product->price ?? 0,
                'stock_value' => $stockValue,
                'status' => $stockStatus,
            ];
        });
    }

    public function headings(): array
    {
        return [
            'No',
            'Kode SKU',
            'Nama Produk',
            'Kategori',
            'Supplier',
            'Stok Saat Ini',
            'ROP',
            'EOQ',
            'Harga Satuan',
            'Nilai Stok',
            'Status'
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            // Header row styling
            1 => [
                'font' => [
                    'bold' => true,
                    'color' => ['rgb' => 'FFFFFF'],
                ],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['rgb' => '4F46E5'],
                ],
                'alignment' => [
                    'horizontal' => Alignment::HORIZONTAL_CENTER,
                    'vertical' => Alignment::VERTICAL_CENTER,
                ],
            ],
        ];
    }

    public function columnWidths(): array
    {
        return [
            'A' => 5,   // No
            'B' => 15,  // SKU
            'C' => 30,  // Name
            'D' => 15,  // Category
            'E' => 20,  // Supplier
            'F' => 12,  // Current Stock
            'G' => 8,   // ROP
            'H' => 8,   // EOQ
            'I' => 15,  // Price
            'J' => 18,  // Stock Value
            'K' => 12,  // Status
        ];
    }

    public function title(): string
    {
        return 'Laporan Stok';
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();
                $highestRow = $sheet->getHighestRow();
                $highestColumn = $sheet->getHighestColumn();

                // Apply borders to all cells
                $sheet->getStyle('A1:' . $highestColumn . $highestRow)->applyFromArray([
                    'borders' => [
                        'allBorders' => [
                            'borderStyle' => Border::BORDER_THIN,
                            'color' => ['rgb' => 'CCCCCC'],
                        ],
                    ],
                ]);

                // Center align specific columns
                $sheet->getStyle('A2:A' . $highestRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $sheet->getStyle('F2:H' . $highestRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $sheet->getStyle('K2:K' . $highestRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

                // Right align numeric columns
                $sheet->getStyle('I2:J' . $highestRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);

                // Format currency columns
                $sheet->getStyle('I2:J' . $highestRow)->getNumberFormat()->setFormatCode('_("Rp"* #,##0_);_("Rp"* \(#,##0\);_("Rp"* "-"??_);_(@_)');

                // Format number columns
                $sheet->getStyle('F2:H' . $highestRow)->getNumberFormat()->setFormatCode('#,##0');

                // Apply conditional formatting for stock status
                for ($row = 2; $row <= $highestRow; $row++) {
                    $statusValue = $sheet->getCell('K' . $row)->getValue();

                    if ($statusValue === 'Habis') {
                        $sheet->getStyle('K' . $row)->applyFromArray([
                            'fill' => [
                                'fillType' => Fill::FILL_SOLID,
                                'startColor' => ['rgb' => 'FEE2E2'],
                            ],
                            'font' => ['color' => ['rgb' => 'DC2626']],
                        ]);
                    } elseif ($statusValue === 'Stok Rendah') {
                        $sheet->getStyle('K' . $row)->applyFromArray([
                            'fill' => [
                                'fillType' => Fill::FILL_SOLID,
                                'startColor' => ['rgb' => 'FEF3C7'],
                            ],
                            'font' => ['color' => ['rgb' => 'D97706']],
                        ]);
                    } elseif ($statusValue === 'Normal') {
                        $sheet->getStyle('K' . $row)->applyFromArray([
                            'fill' => [
                                'fillType' => Fill::FILL_SOLID,
                                'startColor' => ['rgb' => 'D1FAE5'],
                            ],
                            'font' => ['color' => ['rgb' => '059669']],
                        ]);
                    }
                }
            },
        ];
    }

    protected function getStockStatus($product)
    {
        $currentStock = $product->current_stock ?? 0;
        $rop = $product->rop ?? 0;

        if ($currentStock <= 0) {
            return 'Habis';
        } elseif ($currentStock <= $rop) {
            return 'Stok Rendah';
        } else {
            return 'Normal';
        }
    }
}
