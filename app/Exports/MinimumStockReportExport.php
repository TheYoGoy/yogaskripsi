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
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class MinimumStockReportExport implements FromCollection, WithHeadings, WithStyles, WithColumnWidths, WithTitle, WithEvents
{
    protected $request;

    public function __construct($request)
    {
        $this->request = $request;
    }

    public function collection()
    {
        Log::info('Excel Export Minimum Stock Data', (array) $this->request);

        $query = Product::with(['category:id,name', 'unit:id,name'])
            ->whereColumn('current_stock', '<=', 'minimum_stock');

        // Filter berdasarkan kategori
        if (!empty($this->request->category_id) && $this->request->category_id !== 'all') {
            $query->where('category_id', $this->request->category_id);
        }

        $products = $query->orderBy('name')->get();

        return $products->map(function ($product, $index) {
            $statusText = $this->getStatusText($product);

            return [
                'no' => $index + 1,
                'name' => $product->name,
                'sku' => $product->sku ?? '-',
                'category' => $product->category->name ?? '-',
                'current_stock' => number_format($product->current_stock ?? 0),
                'minimum_stock' => number_format($product->minimum_stock ?? 0),
                'rop' => number_format($product->rop ?? 0),
                'eoq' => number_format($product->eoq ?? 0),
                'unit' => $product->unit->name ?? 'pcs',
                'status' => $statusText,
                'days_until_stockout' => $product->days_until_stockout ? $product->days_until_stockout . ' hari' : '-',
            ];
        });
    }

    private function getStatusText($product)
    {
        $currentStock = $product->current_stock ?? 0;
        $minimumStock = $product->minimum_stock ?? 0;
        $rop = $product->rop ?? $minimumStock;

        if ($currentStock <= 0) {
            return 'Stok Habis';
        } elseif ($currentStock <= $minimumStock) {
            return 'Perlu Restock';
        } elseif ($currentStock <= $rop * 0.5) {
            return 'Kritis';
        } else {
            return 'Stok Rendah';
        }
    }

    public function headings(): array
    {
        return [
            'No',
            'Nama Produk',
            'SKU',
            'Kategori',
            'Stok Saat Ini',
            'Stok Minimum',
            'ROP',
            'EOQ',
            'Satuan',
            'Status',
            'Estimasi Kehabisan',
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            // Header row styling - matching frontend indigo color
            1 => [
                'font' => [
                    'bold' => true,
                    'color' => ['rgb' => 'FFFFFF'],
                    'size' => 11,
                ],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['rgb' => '4F46E5'], // Indigo-600 from frontend
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
            'B' => 25,  // Nama Produk
            'C' => 12,  // SKU
            'D' => 15,  // Kategori
            'E' => 12,  // Stok Saat Ini
            'F' => 12,  // Stok Minimum
            'G' => 10,  // ROP
            'H' => 10,  // EOQ
            'I' => 10,  // Satuan
            'J' => 15,  // Status
            'K' => 15,  // Estimasi Kehabisan
        ];
    }

    public function title(): string
    {
        return 'Laporan Stok Minimum';
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
                            'color' => ['rgb' => 'E5E7EB'], // Gray-200 from frontend
                        ],
                    ],
                ]);

                // Center align specific columns (matching frontend table structure)
                $sheet->getStyle('A2:A' . $highestRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $sheet->getStyle('C2:C' . $highestRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $sheet->getStyle('I2:I' . $highestRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $sheet->getStyle('J2:J' . $highestRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

                // Right align stock columns
                $sheet->getStyle('E2:H' . $highestRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);

                // Apply zebra striping like frontend hover effect
                for ($row = 2; $row <= $highestRow; $row++) {
                    if ($row % 2 == 0) {
                        $sheet->getStyle('A' . $row . ':' . $highestColumn . $row)->applyFromArray([
                            'fill' => [
                                'fillType' => Fill::FILL_SOLID,
                                'startColor' => ['rgb' => 'F9FAFB'], // Gray-50 from frontend
                            ],
                        ]);
                    }
                }

                // Apply conditional formatting for status (matching frontend colors)
                for ($row = 2; $row <= $highestRow; $row++) {
                    $statusValue = $sheet->getCell('J' . $row)->getValue();

                    if ($statusValue === 'Stok Habis') {
                        // Gray colors for out of stock
                        $sheet->getStyle('J' . $row)->applyFromArray([
                            'fill' => [
                                'fillType' => Fill::FILL_SOLID,
                                'startColor' => ['rgb' => 'F3F4F6'], // Gray-100
                            ],
                            'font' => ['color' => ['rgb' => '6B7280']], // Gray-500
                        ]);
                    } elseif ($statusValue === 'Kritis') {
                        // Red colors for critical
                        $sheet->getStyle('J' . $row)->applyFromArray([
                            'fill' => [
                                'fillType' => Fill::FILL_SOLID,
                                'startColor' => ['rgb' => 'FEE2E2'], // Red-100
                            ],
                            'font' => ['color' => ['rgb' => 'DC2626']], // Red-600
                        ]);
                    } elseif ($statusValue === 'Perlu Restock') {
                        // Yellow colors for warning
                        $sheet->getStyle('J' . $row)->applyFromArray([
                            'fill' => [
                                'fillType' => Fill::FILL_SOLID,
                                'startColor' => ['rgb' => 'FEF3C7'], // Yellow-100
                            ],
                            'font' => ['color' => ['rgb' => 'D97706']], // Yellow-600
                        ]);
                    } else {
                        // Orange colors for low stock
                        $sheet->getStyle('J' . $row)->applyFromArray([
                            'fill' => [
                                'fillType' => Fill::FILL_SOLID,
                                'startColor' => ['rgb' => 'FED7AA'], // Orange-100
                            ],
                            'font' => ['color' => ['rgb' => 'EA580C']], // Orange-600
                        ]);
                    }

                    // Color coding for stock columns (matching frontend)
                    $currentStockValue = (int) str_replace(',', '', $sheet->getCell('E' . $row)->getValue());
                    if ($currentStockValue <= 0) {
                        $sheet->getStyle('E' . $row)->applyFromArray([
                            'font' => ['color' => ['rgb' => '6B7280'], 'bold' => true], // Gray-500
                        ]);
                    } else {
                        $sheet->getStyle('E' . $row)->applyFromArray([
                            'font' => ['color' => ['rgb' => 'DC2626'], 'bold' => true], // Red-600
                        ]);
                    }

                    // ROP and EOQ colors
                    $sheet->getStyle('G' . $row)->applyFromArray([
                        'font' => ['color' => ['rgb' => '2563EB'], 'bold' => true], // Blue-600
                    ]);
                    $sheet->getStyle('H' . $row)->applyFromArray([
                        'font' => ['color' => ['rgb' => '16A34A'], 'bold' => true], // Green-600
                    ]);
                }

                // Add summary at the bottom
                $summaryStartRow = $highestRow + 3;

                // Calculate summary data
                $collection = $this->collection();
                $totalProducts = $collection->count();
                $criticalProducts = $collection->filter(fn($item) => $item['status'] === 'Kritis')->count();
                $outOfStockProducts = $collection->filter(fn($item) => $item['status'] === 'Stok Habis')->count();
                $needRestockProducts = $collection->filter(fn($item) => $item['status'] === 'Perlu Restock')->count();

                // Add summary header
                $sheet->setCellValue('A' . $summaryStartRow, 'RINGKASAN STOK MINIMUM');
                $sheet->getStyle('A' . $summaryStartRow . ':E' . $summaryStartRow)->applyFromArray([
                    'font' => [
                        'bold' => true,
                        'size' => 12,
                        'color' => ['rgb' => '374151'], // Gray-700 from frontend
                    ],
                    'fill' => [
                        'fillType' => Fill::FILL_SOLID,
                        'startColor' => ['rgb' => 'F3F4F6'], // Gray-100 from frontend
                    ],
                    'borders' => [
                        'allBorders' => [
                            'borderStyle' => Border::BORDER_THIN,
                        ],
                    ],
                ]);
                $sheet->mergeCells('A' . $summaryStartRow . ':E' . $summaryStartRow);

                // Add summary data matching frontend cards
                $summaryData = [
                    ['Produk Kritis', $criticalProducts, 'red'],
                    ['Stok Habis', $outOfStockProducts, 'gray'],
                    ['Perlu Restock', $needRestockProducts, 'yellow'],
                    ['Total Produk Diperiksa', $totalProducts, 'purple'],
                ];

                foreach ($summaryData as $index => $data) {
                    $currentRow = $summaryStartRow + 1 + $index;
                    $sheet->setCellValue('A' . $currentRow, $data[0]);
                    $sheet->setCellValue('B' . $currentRow, $data[1]);

                    $sheet->getStyle('A' . $currentRow . ':B' . $currentRow)->applyFromArray([
                        'borders' => [
                            'allBorders' => [
                                'borderStyle' => Border::BORDER_THIN,
                            ],
                        ],
                    ]);

                    // Color coding matching frontend cards
                    $colors = [
                        'red' => 'DC2626',
                        'gray' => '6B7280',
                        'yellow' => 'D97706',
                        'purple' => '7C3AED'
                    ];

                    if (isset($colors[$data[2]])) {
                        $sheet->getStyle('B' . $currentRow)->applyFromArray([
                            'font' => ['color' => ['rgb' => $colors[$data[2]]], 'bold' => true],
                        ]);
                    }
                }

                // Add filter information at the top
                if (!empty((array) $this->request)) {
                    $filterRow = 2;
                    $sheet->insertNewRowBefore($filterRow, 1);

                    $filterInfo = 'Filter: ';
                    if (!empty($this->request->category_id) && $this->request->category_id !== 'all') {
                        $filterInfo .= 'Kategori ID: ' . $this->request->category_id;
                    } else {
                        $filterInfo = 'Filter: Semua Kategori';
                    }

                    $sheet->setCellValue('A' . $filterRow, $filterInfo);
                    $sheet->getStyle('A' . $filterRow . ':K' . $filterRow)->applyFromArray([
                        'font' => [
                            'italic' => true,
                            'size' => 10,
                            'color' => ['rgb' => '6B7280'],
                        ],
                        'fill' => [
                            'fillType' => Fill::FILL_SOLID,
                            'startColor' => ['rgb' => 'F9FAFB'],
                        ],
                    ]);
                    $sheet->mergeCells('A' . $filterRow . ':K' . $filterRow);
                }
            },
        ];
    }
}
