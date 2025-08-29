<?php

namespace App\Exports;

use App\Models\StockIn;
use App\Models\StockOut;
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

class MutationReportExport implements FromCollection, WithHeadings, WithStyles, WithColumnWidths, WithTitle, WithEvents
{
    protected $filters;

    public function __construct($filters = [])
    {
        $this->filters = $filters;
    }

    public function collection()
    {
        Log::info('Excel Export Mutation Data', $this->filters);

        // Date filter closure
        $dateFilter = function ($query) {
            if (!empty($this->filters['start_date'])) {
                $query->where(function ($q) {
                    $q->whereDate('transaction_date', '>=', $this->filters['start_date'])
                        ->orWhereDate('date', '>=', $this->filters['start_date']);
                });
            }
            if (!empty($this->filters['end_date'])) {
                $query->where(function ($q) {
                    $q->whereDate('transaction_date', '<=', $this->filters['end_date'])
                        ->orWhereDate('date', '<=', $this->filters['end_date']);
                });
            }
            return $query;
        };

        // Product filter closure
        $productFilter = function ($query) {
            if (!empty($this->filters['product_id']) && $this->filters['product_id'] !== 'all') {
                $query->where('product_id', $this->filters['product_id']);
            }
            return $query;
        };

        // Get Stock In transactions - only load existing relationships
        $stockInsQuery = StockIn::with(['product:id,name,sku', 'user:id,name']);

        // Check if supplier relationship exists before loading it
        $stockInModel = new StockIn();
        if (method_exists($stockInModel, 'supplier')) {
            $stockInsQuery->with('supplier:id,name');
        }

        $stockInsQuery = $productFilter($stockInsQuery);
        $stockInsQuery = $dateFilter($stockInsQuery);

        $stockIns = $stockInsQuery->get()->map(function ($item) {
            $effectiveDate = $item->transaction_date ?: $item->date ?: $item->created_at;

            // Handle supplier relationship safely
            $supplierName = null;
            if (method_exists($item, 'supplier') && $item->supplier) {
                $supplierName = $item->supplier->name;
            } elseif (isset($item->supplier) && is_string($item->supplier)) {
                $supplierName = $item->supplier;
            } elseif (isset($item->source)) {
                $supplierName = $item->source;
            }

            return [
                'transaction_date' => $effectiveDate,
                'code' => $item->code ?? '-',
                'type' => 'in',
                'product_name' => $item->product->name ?? 'Produk Tidak Diketahui',
                'product_sku' => $item->product->sku ?? '-',
                'quantity' => $item->quantity,
                'supplier' => $supplierName ?? '-',
                'customer' => null,
                'user_name' => $item->user->name ?? 'User Tidak Diketahui',
                'note' => $item->note ?? $item->description ?? '-',
                'sort_date' => Carbon::parse($effectiveDate)->timestamp,
            ];
        });

        // Get Stock Out transactions
        $stockOutsQuery = StockOut::with(['product:id,name,sku', 'user:id,name']);
        $stockOutsQuery = $productFilter($stockOutsQuery);
        $stockOutsQuery = $dateFilter($stockOutsQuery);

        $stockOuts = $stockOutsQuery->get()->map(function ($item) {
            $effectiveDate = $item->transaction_date ?: $item->date ?: $item->created_at;

            return [
                'transaction_date' => $effectiveDate,
                'code' => $item->code ?? '-',
                'type' => 'out',
                'product_name' => $item->product->name ?? 'Produk Tidak Diketahui',
                'product_sku' => $item->product->sku ?? '-',
                'quantity' => $item->quantity,
                'supplier' => null,
                'customer' => $item->customer ?? '-',
                'user_name' => $item->user->name ?? 'User Tidak Diketahui',
                'note' => $item->note ?? $item->description ?? '-',
                'sort_date' => Carbon::parse($effectiveDate)->timestamp,
            ];
        });

        // Merge and sort by date (newest first)
        $transactions = $stockIns->merge($stockOuts)
            ->sortByDesc('sort_date')
            ->values();

        // Add row numbers and format for Excel
        return $transactions->map(function ($transaction, $index) {
            return [
                'no' => $index + 1,
                'transaction_date' => Carbon::parse($transaction['transaction_date'])->format('d/m/Y'),
                'code' => $transaction['code'],
                'type' => $transaction['type'] === 'in' ? 'Stok Masuk' : 'Stok Keluar',
                'product_name' => $transaction['product_name'],
                'product_sku' => $transaction['product_sku'],
                'quantity' => ($transaction['type'] === 'in' ? '+' : '-') . number_format($transaction['quantity']),
                'related_party' => $transaction['type'] === 'in' ?
                    ($transaction['supplier'] ?: '-') : ($transaction['customer'] ?: '-'),
                'user_name' => $transaction['user_name'],
                'note' => $transaction['note'],
            ];
        });
    }

    public function headings(): array
    {
        return [
            'No',
            'Tanggal',
            'Kode',
            'Tipe',
            'Nama Produk',
            'SKU',
            'Kuantitas',
            'Pihak Terkait',
            'Dicatat Oleh',
            'Keterangan',
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
            'B' => 12,  // Date
            'C' => 15,  // Code
            'D' => 12,  // Type
            'E' => 30,  // Product Name
            'F' => 15,  // SKU
            'G' => 12,  // Quantity
            'H' => 20,  // Related Party
            'I' => 18,  // User
            'J' => 25,  // Note
        ];
    }

    public function title(): string
    {
        return 'Laporan Mutasi Stok';
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
                $sheet->getStyle('D2:D' . $highestRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
                $sheet->getStyle('G2:G' . $highestRow)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

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

                // Apply conditional formatting for transaction types (matching frontend colors)
                for ($row = 2; $row <= $highestRow; $row++) {
                    $typeValue = $sheet->getCell('D' . $row)->getValue();
                    $quantityCell = 'G' . $row;

                    if ($typeValue === 'Stok Masuk') {
                        // Green colors matching frontend green-600/green-100
                        $sheet->getStyle('D' . $row)->applyFromArray([
                            'fill' => [
                                'fillType' => Fill::FILL_SOLID,
                                'startColor' => ['rgb' => 'DCFCE7'], // Green-100
                            ],
                            'font' => ['color' => ['rgb' => '16A34A']], // Green-600
                        ]);
                        $sheet->getStyle($quantityCell)->applyFromArray([
                            'font' => ['color' => ['rgb' => '16A34A']], // Green-600
                        ]);
                    } elseif ($typeValue === 'Stok Keluar') {
                        // Red colors matching frontend red-600/red-100
                        $sheet->getStyle('D' . $row)->applyFromArray([
                            'fill' => [
                                'fillType' => Fill::FILL_SOLID,
                                'startColor' => ['rgb' => 'FEE2E2'], // Red-100
                            ],
                            'font' => ['color' => ['rgb' => 'DC2626']], // Red-600
                        ]);
                        $sheet->getStyle($quantityCell)->applyFromArray([
                            'font' => ['color' => ['rgb' => 'DC2626']], // Red-600
                        ]);
                    }
                }

                // Add summary at the bottom (matching frontend summary cards)
                $summaryStartRow = $highestRow + 3;

                // Calculate summary data
                $collection = $this->collection();
                $totalTransactions = $collection->count();
                $stockInCount = $collection->where('type', 'Stok Masuk')->count();
                $stockOutCount = $collection->where('type', 'Stok Keluar')->count();

                // Calculate quantities from the original data
                $totalInQuantity = $collection->where('type', 'Stok Masuk')->sum(function ($item) {
                    return (int) str_replace(['+', ','], '', $item['quantity']);
                });
                $totalOutQuantity = $collection->where('type', 'Stok Keluar')->sum(function ($item) {
                    return (int) str_replace(['-', ','], '', $item['quantity']);
                });

                // Add summary header
                $sheet->setCellValue('A' . $summaryStartRow, 'RINGKASAN MUTASI STOK');
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
                    ['Total Transaksi', $totalTransactions, 'transactions'],
                    ['Total Stok Masuk', $stockInCount . ' (' . number_format($totalInQuantity) . ' qty)', 'in'],
                    ['Total Stok Keluar', $stockOutCount . ' (' . number_format($totalOutQuantity) . ' qty)', 'out'],
                    ['Selisih Stok', number_format($totalInQuantity - $totalOutQuantity), 'balance'],
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

                    // Color coding matching frontend
                    if ($data[2] === 'in') {
                        $sheet->getStyle('B' . $currentRow)->applyFromArray([
                            'font' => ['color' => ['rgb' => '16A34A'], 'bold' => true], // Green-600
                        ]);
                    } elseif ($data[2] === 'out') {
                        $sheet->getStyle('B' . $currentRow)->applyFromArray([
                            'font' => ['color' => ['rgb' => 'DC2626'], 'bold' => true], // Red-600
                        ]);
                    } elseif ($data[2] === 'balance') {
                        $balanceValue = $totalInQuantity - $totalOutQuantity;
                        $color = $balanceValue >= 0 ? '059669' : 'DC2626'; // Emerald-600 or Red-600
                        $sheet->getStyle('B' . $currentRow)->applyFromArray([
                            'font' => ['color' => ['rgb' => $color], 'bold' => true],
                        ]);
                    }
                }

                // Add filter information at the top
                if (!empty($this->filters)) {
                    $filterRow = 2;
                    $sheet->insertNewRowBefore($filterRow, 1);

                    $filterInfo = 'Filter: ';
                    if (!empty($this->filters['product_id']) && $this->filters['product_id'] !== 'all') {
                        $filterInfo .= 'Produk ID: ' . $this->filters['product_id'] . ' | ';
                    }
                    if (!empty($this->filters['start_date'])) {
                        $filterInfo .= 'Dari: ' . Carbon::parse($this->filters['start_date'])->format('d/m/Y') . ' | ';
                    }
                    if (!empty($this->filters['end_date'])) {
                        $filterInfo .= 'Sampai: ' . Carbon::parse($this->filters['end_date'])->format('d/m/Y');
                    }

                    $sheet->setCellValue('A' . $filterRow, rtrim($filterInfo, ' | '));
                    $sheet->getStyle('A' . $filterRow . ':J' . $filterRow)->applyFromArray([
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
                    $sheet->mergeCells('A' . $filterRow . ':J' . $filterRow);
                }
            },
        ];
    }
}
