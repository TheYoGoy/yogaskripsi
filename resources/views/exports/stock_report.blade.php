<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <title>Laporan Stok Barang - PT. Brawijaya</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        @page {
            size: A4 landscape;
            margin: 1.5cm 1cm;
        }

        body {
            font-family: 'Inter', sans-serif;
            color: #212529;
            background-color: white;
            font-size: 9px;
            line-height: 1.4;
            margin: 0;
            padding: 0;
        }

        .container {
            max-width: 100%;
            margin: 0;
            background-color: white;
            padding: 15px;
        }

        .header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 2px solid #4F46E5;
        }

        .company-section {
            display: flex;
            align-items: flex-start;
        }

        .company-logo img {
            max-height: 45px;
            width: auto;
            margin-right: 12px;
        }

        .company-info h1 {
            font-size: 16px;
            font-weight: 700;
            color: #4F46E5;
            margin: 0 0 2px 0;
        }

        .company-details {
            font-size: 8px;
            color: #6c757d;
            line-height: 1.3;
        }

        .report-title {
            font-size: 14px;
            font-weight: 600;
            color: #1a365d;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            text-align: right;
            margin: 0;
            line-height: 1.2;
        }

        .filters-info {
            background-color: #F8FAFC;
            border: 1px solid #E2E8F0;
            border-radius: 6px;
            padding: 10px;
            margin-bottom: 15px;
            font-size: 8px;
        }

        .filters-info h4 {
            margin: 0 0 6px 0;
            color: #374151;
            font-weight: 600;
            font-size: 9px;
        }

        .filter-item {
            margin: 2px 0;
            color: #6B7280;
        }

        .summary-cards {
            display: flex;
            justify-content: space-between;
            margin-bottom: 15px;
            gap: 10px;
        }

        .summary-card {
            flex: 1;
            background-color: #F8FAFC;
            border: 1px solid #E5E7EB;
            border-radius: 6px;
            padding: 8px;
            text-align: center;
        }

        .summary-card .value {
            font-size: 12px;
            font-weight: 700;
            color: #1F2937;
            margin-bottom: 2px;
        }

        .summary-card .label {
            font-size: 7px;
            color: #6B7280;
            text-transform: uppercase;
            font-weight: 500;
        }

        .table-container {
            margin-top: 10px;
            border: 1px solid #D1D5DB;
            border-radius: 6px;
            overflow: hidden;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 8px;
            background-color: white;
        }

        thead th {
            background-color: #4F46E5;
            color: white;
            padding: 8px 4px;
            text-align: center;
            font-weight: 600;
            font-size: 7px;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            border-right: 1px solid #6366F1;
        }

        thead th:last-child {
            border-right: none;
        }

        tbody td {
            padding: 6px 4px;
            border-bottom: 1px solid #F3F4F6;
            border-right: 1px solid #F3F4F6;
            font-size: 8px;
        }

        tbody td:last-child {
            border-right: none;
        }

        tbody tr:nth-child(even) {
            background-color: #FAFAFA;
        }

        .status-badge {
            padding: 2px 6px;
            border-radius: 10px;
            font-size: 7px;
            font-weight: 600;
            text-align: center;
            display: inline-block;
            min-width: 45px;
        }

        .status-habis {
            background-color: #FEE2E2;
            color: #DC2626;
        }

        .status-rendah {
            background-color: #FEF3C7;
            color: #D97706;
        }

        .status-normal {
            background-color: #D1FAE5;
            color: #059669;
        }

        .text-center {
            text-align: center;
        }

        .text-right {
            text-align: right;
        }

        .text-left {
            text-align: left;
        }

        .font-medium {
            font-weight: 600;
        }

        .empty-row {
            text-align: center;
            color: #9CA3AF;
            font-style: italic;
            padding: 20px;
            background-color: #F9FAFB;
        }

        .signature-section {
            margin-top: 30px;
            display: flex;
            justify-content: space-between;
            gap: 40px;
        }

        .signature-box {
            text-align: center;
            width: 180px;
        }

        .signature-box p {
            font-size: 9px;
            margin: 0 0 30px 0;
            font-weight: 500;
        }

        .signature-line {
            border-bottom: 1.5px solid #374151;
            margin-bottom: 5px;
        }

        .signature-name {
            font-size: 8px;
            color: #6B7280;
        }

        .footer {
            margin-top: 25px;
            text-align: center;
            font-size: 8px;
            color: #6B7280;
            border-top: 1px solid #E5E7EB;
            padding-top: 12px;
        }

        .footer p {
            margin: 2px 0;
        }

        .currency {
            font-family: 'Courier New', monospace;
        }

        @media print {
            body {
                background-color: white;
            }

            .container {
                box-shadow: none;
                padding: 10px;
            }
        }
    </style>
</head>

<body>
    <div class="container">
        <!-- Header Section -->
        <div class="header">
            <div class="company-section">
                <div class="company-logo">
                    <img src="{{ public_path('logobrawijaya.png') }}" alt="PT. Brawijaya">
                </div>
                <div class="company-info">
                    <h1>PT. BRAWIJAYA</h1>
                    <div class="company-details">
                        Jl. Raya Semplak No. 123, Kemang, Bogor Barat<br>
                        Kota Bogor, Jawa Barat 16113<br>
                        Telp: (0251) 123-4567 | Email: info@brawijaya.co.id<br>
                        NPWP: 01.234.567.8-901.000
                    </div>
                </div>
            </div>
            <div class="report-title">
                LAPORAN STOK BARANG<br>
                <span style="font-size: 10px; font-weight: 400; color: #6c757d;">
                    {{ \Carbon\Carbon::now()->format('d F Y H:i') }} WIB
                </span>
            </div>
        </div>

        <!-- Filter Information -->
        @if(!empty($filters) && (isset($filters['category_id']) || isset($filters['min_stock']) || isset($filters['max_stock'])))
        <div class="filters-info">
            <h4>Filter yang Diterapkan:</h4>
            @if(isset($filters['category_id']) && $filters['category_id'] !== 'all')
            <div class="filter-item">• Kategori: {{ $categories->where('id', $filters['category_id'])->first()->name ?? 'N/A' }}</div>
            @endif
            @if(isset($filters['min_stock']) && $filters['min_stock'])
            <div class="filter-item">• Stok Minimum: {{ number_format($filters['min_stock']) }}</div>
            @endif
            @if(isset($filters['max_stock']) && $filters['max_stock'])
            <div class="filter-item">• Stok Maksimum: {{ number_format($filters['max_stock']) }}</div>
            @endif
        </div>
        @endif

        <!-- Summary Cards -->
        @if(isset($summary) && !empty($summary))
        <div class="summary-cards">
            <div class="summary-card">
                <div class="value">{{ number_format($summary['total_products'] ?? count($products)) }}</div>
                <div class="label">Total Produk</div>
            </div>
            <div class="summary-card">
                <div class="value currency">{{ 'Rp ' . number_format($summary['total_value'] ?? 0, 0, ',', '.') }}</div>
                <div class="label">Nilai Total Stok</div>
            </div>
            <div class="summary-card">
                <div class="value">{{ number_format($summary['low_stock_count'] ?? 0) }}</div>
                <div class="label">Stok Rendah</div>
            </div>
            <div class="summary-card">
                <div class="value">{{ number_format($summary['zero_stock_count'] ?? 0) }}</div>
                <div class="label">Stok Habis</div>
            </div>
        </div>
        @endif

        <!-- Tabel Stok Barang -->
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th style="width: 4%;">No</th>
                        <th style="width: 10%;">Kode SKU</th>
                        <th style="width: 20%;">Nama Produk</th>
                        <th style="width: 12%;">Kategori</th>
                        <th style="width: 14%;">Supplier</th>
                        <th style="width: 8%;">Stok</th>
                        <th style="width: 6%;">ROP</th>
                        <th style="width: 6%;">EOQ</th>
                        <th style="width: 12%;">Nilai Stok</th>
                        <th style="width: 8%;">Status</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse($products as $index => $product)
                    @php
                    $currentStock = $product->current_stock ?? 0;
                    $rop = $product->rop ?? 0;
                    $stockValue = $currentStock * ($product->price ?? 0);

                    // Determine stock status
                    if ($currentStock <= 0) {
                        $statusClass='status-habis' ;
                        $statusText='Habis' ;
                        } elseif ($currentStock <=$rop) {
                        $statusClass='status-rendah' ;
                        $statusText='Stok Rendah' ;
                        } else {
                        $statusClass='status-normal' ;
                        $statusText='Normal' ;
                        }
                        @endphp
                        <tr>
                        <td class="text-center">{{ $loop->iteration }}</td>
                        <td class="text-center font-medium">{{ $product->sku ?? $product->code ?? '-' }}</td>
                        <td class="text-left">{{ $product->name }}</td>
                        <td class="text-center">{{ $product->category->name ?? '-' }}</td>
                        <td class="text-center">{{ $product->supplier->name ?? '-' }}</td>
                        <td class="text-center font-medium" style="color: #2563EB;">{{ number_format($currentStock) }}</td>
                        <td class="text-center font-medium" style="color: #EA580C;">{{ number_format($rop) }}</td>
                        <td class="text-center font-medium" style="color: #059669;">{{ number_format($product->eoq ?? 0) }}</td>
                        <td class="text-right font-medium currency" style="color: #7C3AED;">Rp {{ number_format($stockValue, 0, ',', '.') }}</td>
                        <td class="text-center">
                            <span class="status-badge {{ $statusClass }}">{{ $statusText }}</span>
                        </td>
                        </tr>
                        @empty
                        <tr>
                            <td colspan="10" class="empty-row">
                                Tidak ada data produk yang sesuai dengan filter yang diterapkan
                            </td>
                        </tr>
                        @endforelse
                </tbody>
            </table>
        </div>

        <!-- Signature Section -->
        <div class="signature-section">
            <div class="signature-box">
                <p>Mengetahui,<br>Manager Gudang</p>
                <div class="signature-line"></div>
                <div class="signature-name">(.............................)</div>
            </div>
            <div class="signature-box">
                <p>Dibuat Oleh,<br>{{ auth()->user()->name ?? 'Admin Sistem' }}</p>
                <div class="signature-line"></div>
                <div class="signature-name">(.............................)</div>
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p><strong>PT. Brawijaya</strong> - Sistem Manajemen Inventaris</p>
            <p>Dokumen ini dibuat secara otomatis dan sah tanpa tanda tangan basah</p>
            <p>Dicetak pada {{ \Carbon\Carbon::now()->format('d F Y H:i:s') }} WIB</p>
        </div>
    </div>
</body>

</html>