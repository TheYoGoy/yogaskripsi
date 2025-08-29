<?php

namespace App\Exports;

use App\Models\Supplier;
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
use Illuminate\Http\Request;

class SupplierReportExport implements FromCollection, WithHeadings, WithStyles, WithColumnWidths, WithTitle, WithEvents
{
    protected $request;

    public function __construct(Request $request)
    {
        $this->request = $request;
    }

    public function collection()
    {
        Log::info('Excel Export Supplier Data', (array) $this->request);

        $suppliers = Supplier::withCount([
            'purchaseTransactions as total_transactions' => function ($query) {
                if ($this->request->filled('start_date')) {
                    $query->whereDate('transaction_date', '>=', $this->request->start_date);
                }
                if ($this->request->filled('end_date')) {
                    $query->whereDate('transaction_date', '<=', $this->request->end_date);
                }
            }
        ])
            ->withSum([
                'purchaseTransactions as total_amount' => function ($query) {
                    if ($this->request->filled('start_date')) {
                        $query->whereDate('transaction_date', '>=', $this->request->start_date);
                    }
                    if ($this->request->filled('end_date')) {
                        $query->whereDate('transaction_date', '<=', $this->request->end_date);
                    }
                }
            ], 'total_price')
            ->when(
                $this->request->filled('search'),
                fn($query) => $query->where('name', 'like', '%' . $this->request->search . '%')
            )
            ->orderBy('total_amount', 'desc')
            ->orderBy('name')
            ->get();

        return $suppliers->map(function ($supplier, $index) {
            // Count products supplied by this supplier
            $productsCount = Product::where('supplier_id', $supplier->id)->count();

            return [
                'no' => $index + 1,
                'name' => $supplier->name,
                'phone' => $supplier->phone ?? '-',
                'email' => $supplier->email ?? '-',
                'address' => $supplier->address ?? '-',
                'products_count' => number_format($productsCount),
                'total_transactions' => number_format($supplier->total_transactions ?? 0),
                'total_amount' => 'Rp ' . number_format($supplier->total_amount ?? 0, 0, ',', '.'),
                'status' => ($supplier->total_transactions ?? 0) > 0 ? 'Aktif' : 'Tidak Aktif',
            ];
        });
    }

    public function headings(): array
    {
        return [
            'No',
            'Nama',
            'Telepon',
            'Email',
            'Alamat',
            'Jumlah Produk',
            'Total Transaksi',
            'Total Pembelian',
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
            'B' => 25,  // Name
            'C' => 15,  // Phone
            'D' => 20,  // Email
            'E' => 30,  // Address
            'F' => 12,  // Products Count
            'G' => 15,  // Total Transactions
            'H' => 18,  // Total Amount
            'I' => 12,  // Status
        ];
    }

    public function title(): string
    {
        return 'Laporan Supplier';
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
                $sheet->getStyle('F2:G' . $highestRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $sheet->getStyle('I2:I' . $highestRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

                // Right align amount column
                $sheet->getStyle('H2:H' . $highestRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_RIGHT);

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
                    $statusValue = $sheet->getCell('I' . $row)->getValue();

                    if ($statusValue === 'Aktif') {
                        // Green colors matching frontend green-600/green-100
                        $sheet->getStyle('I' . $row)->applyFromArray([
                            'fill' => [
                                'fillType' => Fill::FILL_SOLID,
                                'startColor' => ['rgb' => 'DCFCE7'], // Green-100
                            ],
                            'font' => ['color' => ['rgb' => '16A34A']], // Green-600
                        ]);
                    } else {
                        // Gray colors for Tidak Aktif
                        $sheet->getStyle('I' . $row)->applyFromArray([
                            'fill' => [
                                'fillType' => Fill::FILL_SOLID,
                                'startColor' => ['rgb' => 'F3F4F6'], // Gray-100
                            ],
                            'font' => ['color' => ['rgb' => '6B7280']], // Gray-500
                        ]);
                    }

                    // Color coding for numeric columns (matching frontend)
                    $sheet->getStyle('F' . $row)->applyFromArray([
                        'font' => ['color' => ['rgb' => '2563EB'], 'bold' => true], // Blue-600
                    ]);
                    $sheet->getStyle('G' . $row)->applyFromArray([
                        'font' => ['color' => ['rgb' => '7C3AED'], 'bold' => true], // Purple-600
                    ]);
                    $sheet->getStyle('H' . $row)->applyFromArray([
                        'font' => ['color' => ['rgb' => '16A34A'], 'bold' => true], // Green-600
                    ]);
                }

                // Add summary at the bottom (matching frontend summary cards)
                $summaryStartRow = $highestRow + 3;

                // Calculate summary data
                $collection = $this->collection();
                $totalSuppliers = $collection->count();
                $activeSuppliers = $collection->where('status', 'Aktif')->count();
                $totalTransactions = $collection->sum(function ($item) {
                    return (int) str_replace(',', '', $item['total_transactions']);
                });
                $totalAmount = $collection->sum(function ($item) {
                    return (int) str_replace(['Rp ', '.', ','], ['', '', ''], $item['total_amount']);
                });

                // Add summary header
                $sheet->setCellValue('A' . $summaryStartRow, 'RINGKASAN SUPPLIER');
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
                    ['Total Supplier', $totalSuppliers, 'blue'],
                    ['Supplier Aktif', $activeSuppliers, 'green'],
                    ['Total Transaksi', number_format($totalTransactions), 'purple'],
                    ['Total Pembelian', 'Rp ' . number_format($totalAmount, 0, ',', '.'), 'orange'],
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
                        'green' => '16A34A',
                        'purple' => '7C3AED',
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
                    if (!empty($this->request->search)) {
                        $filterInfo .= 'Pencarian: ' . $this->request->search . ' | ';
                    }
                    if (!empty($this->request->start_date)) {
                        $filterInfo .= 'Dari: ' . Carbon::parse($this->request->start_date)->format('d/m/Y') . ' | ';
                    }
                    if (!empty($this->request->end_date)) {
                        $filterInfo .= 'Sampai: ' . Carbon::parse($this->request->end_date)->format('d/m/Y');
                    }

                    $sheet->setCellValue('A' . $filterRow, rtrim($filterInfo, ' | '));
                    $sheet->getStyle('A' . $filterRow . ':I' . $filterRow)->applyFromArray([
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
                    $sheet->mergeCells('A' . $filterRow . ':I' . $filterRow);
                }
            },
        ];
    }
}
