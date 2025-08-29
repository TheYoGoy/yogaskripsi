<?php

namespace App\Exports;

use App\Models\PurchaseTransaction;
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

class PurchaseHistoryReportExport implements FromCollection, WithHeadings, WithStyles, WithColumnWidths, WithTitle, WithEvents
{
    protected $request;

    public function __construct($request)
    {
        $this->request = $request;
    }

    public function collection()
    {
        Log::info('Excel Export Purchase History Data', (array) $this->request);

        $purchases = PurchaseTransaction::with(['supplier:id,name', 'user:id,name', 'product:id,name,sku'])
            ->when(
                $this->request->supplier_id && $this->request->supplier_id !== 'all',
                fn($query) => $query->where('supplier_id', $this->request->supplier_id)
            )
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

        return $purchases->map(function ($purchase, $index) {
            return [
                'no' => $index + 1,
                'invoice_number' => $purchase->invoice_number ?? $purchase->code ?? '-',
                'transaction_date' => Carbon::parse($purchase->transaction_date)->format('d/m/Y'),
                'supplier_name' => $purchase->supplier->name ?? 'Supplier Tidak Dikenal',
                'product_name' => $purchase->product->name ?? 'Produk Tidak Dikenal',
                'product_sku' => $purchase->product->sku ?? '-',
                'quantity' => number_format($purchase->quantity ?? 0),
                'price_per_unit' => 'Rp ' . number_format($purchase->price_per_unit ?? 0, 0, ',', '.'),
                'total_price' => 'Rp ' . number_format($purchase->total_price ?? 0, 0, ',', '.'),
                'user_name' => $purchase->user->name ?? 'Admin Sistem',
                'status' => $this->getStatusText($purchase->status ?? 'pending'),
            ];
        });
    }

    private function getStatusText($status)
    {
        switch ($status) {
            case 'completed':
                return 'Selesai';
            case 'pending':
                return 'Pending';
            default:
                return 'Draft';
        }
    }

    public function headings(): array
    {
        return [
            'No',
            'No. Invoice',
            'Tanggal',
            'Supplier',
            'Nama Produk',
            'SKU',
            'Kuantitas',
            'Harga Satuan',
            'Total Nilai',
            'Dicatat Oleh',
            'Status',
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
            'B' => 15,  // Invoice Number
            'C' => 12,  // Date
            'D' => 20,  // Supplier
            'E' => 25,  // Product Name
            'F' => 12,  // SKU
            'G' => 10,  // Quantity
            'H' => 15,  // Price Per Unit
            'I' => 15,  // Total Price
            'J' => 15,  // User
            'K' => 10,  // Status
        ];
    }

    public function title(): string
    {
        return 'Laporan Riwayat Pembelian';
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
                $sheet->getStyle('B2:B' . $highestRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $sheet->getStyle('C2:C' . $highestRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $sheet->getStyle('F2:F' . $highestRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $sheet->getStyle('G2:G' . $highestRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $sheet->getStyle('J2:J' . $highestRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $sheet->getStyle('K2:K' . $highestRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

                // Right align price columns
                $sheet->getStyle('H2:I' . $highestRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);

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
                    $statusValue = $sheet->getCell('K' . $row)->getValue();

                    if ($statusValue === 'Selesai') {
                        // Green colors matching frontend green-600/green-100
                        $sheet->getStyle('K' . $row)->applyFromArray([
                            'fill' => [
                                'fillType' => Fill::FILL_SOLID,
                                'startColor' => ['rgb' => 'DCFCE7'], // Green-100
                            ],
                            'font' => ['color' => ['rgb' => '16A34A']], // Green-600
                        ]);
                    } elseif ($statusValue === 'Pending') {
                        // Yellow colors matching frontend yellow-600/yellow-100
                        $sheet->getStyle('K' . $row)->applyFromArray([
                            'fill' => [
                                'fillType' => Fill::FILL_SOLID,
                                'startColor' => ['rgb' => 'FEF3C7'], // Yellow-100
                            ],
                            'font' => ['color' => ['rgb' => 'D97706']], // Yellow-600
                        ]);
                    } else {
                        // Gray colors for Draft
                        $sheet->getStyle('K' . $row)->applyFromArray([
                            'fill' => [
                                'fillType' => Fill::FILL_SOLID,
                                'startColor' => ['rgb' => 'F3F4F6'], // Gray-100
                            ],
                            'font' => ['color' => ['rgb' => '6B7280']], // Gray-500
                        ]);
                    }

                    // Color coding for quantity and price columns (matching frontend)
                    $sheet->getStyle('G' . $row)->applyFromArray([
                        'font' => ['color' => ['rgb' => '2563EB'], 'bold' => true], // Blue-600
                    ]);
                    $sheet->getStyle('H' . $row . ':I' . $row)->applyFromArray([
                        'font' => ['color' => ['rgb' => '16A34A'], 'bold' => true], // Green-600
                    ]);
                }

                // Add summary at the bottom (matching frontend summary cards)
                $summaryStartRow = $highestRow + 3;

                // Calculate summary data
                $collection = $this->collection();
                $totalPurchases = $collection->count();

                // Calculate totals from raw numbers
                $totalQuantity = $collection->sum(function ($item) {
                    return (int) str_replace(',', '', $item['quantity']);
                });

                $totalAmount = $collection->sum(function ($item) {
                    return (int) str_replace(['Rp ', '.', ','], ['', '', ''], $item['total_price']);
                });

                $averageAmount = $totalPurchases > 0 ? $totalAmount / $totalPurchases : 0;

                // Add summary header
                $sheet->setCellValue('A' . $summaryStartRow, 'RINGKASAN RIWAYAT PEMBELIAN');
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
                    ['Total Pembelian', $totalPurchases, 'blue'],
                    ['Total Kuantitas', number_format($totalQuantity), 'purple'],
                    ['Total Nilai Pembelian', 'Rp ' . number_format($totalAmount, 0, ',', '.'), 'green'],
                    ['Rata-rata per Pembelian', 'Rp ' . number_format($averageAmount, 0, ',', '.'), 'orange'],
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
                        'blue' => '2563EB',
                        'purple' => '7C3AED',
                        'green' => '16A34A',
                        'orange' => 'EA580C'
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
                    if (!empty($this->request->supplier_id) && $this->request->supplier_id !== 'all') {
                        $filterInfo .= 'Supplier ID: ' . $this->request->supplier_id . ' | ';
                    }
                    if (!empty($this->request->start_date)) {
                        $filterInfo .= 'Dari: ' . Carbon::parse($this->request->start_date)->format('d/m/Y') . ' | ';
                    }
                    if (!empty($this->request->end_date)) {
                        $filterInfo .= 'Sampai: ' . Carbon::parse($this->request->end_date)->format('d/m/Y');
                    }

                    $sheet->setCellValue('A' . $filterRow, rtrim($filterInfo, ' | '));
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
