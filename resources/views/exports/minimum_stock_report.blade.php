<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <title>Laporan Stok Minimum - PT. Brawijaya</title>
    <style>
        @page {
            size: A4 landscape;
            margin: 1.5cm 1cm;
        }

        body {
            font-family: Arial, sans-serif;
            color: #212529;
            background: white;
            font-size: 10px;
            line-height: 1.4;
            margin: 0;
            padding: 0;
        }

        .container {
            max-width: 100%;
            margin: 0;
            background: white;
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

        .company-logo {
            margin-right: 15px;
            flex-shrink: 0;
            margin-top: 8px;
        }

        .company-logo img {
            max-height: 50px;
            width: auto;
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
            background: #F8FAFC;
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
            background: #F8FAFC;
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
            font-size: 9px;
            background: white;
        }

        thead th {
            background: #4F46E5;
            color: white;
            padding: 8px 4px;
            text-align: center;
            font-weight: 600;
            font-size: 8px;
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
            background: #f8f9fa;
        }

        .status-critical {
            color: #DC2626;
            font-weight: 700;
            background: #FEE2E2;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 8px;
        }

        .status-warning {
            color: #D97706;
            font-weight: 700;
            background: #FEF3C7;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 8px;
        }

        .status-out-of-stock {
            color: #6B7280;
            font-weight: 700;
            background: #F3F4F6;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 8px;
        }

        .status-low {
            color: #EA580C;
            font-weight: 700;
            background: #FED7AA;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 8px;
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

        .stock-critical {
            color: #DC2626;
            font-weight: 600;
        }

        .stock-out {
            color: #6B7280;
            font-weight: 600;
        }

        .rop-blue {
            color: #2563EB;
            font-weight: 600;
        }

        .eoq-green {
            color: #16A34A;
            font-weight: 600;
        }

        .days-orange {
            color: #EA580C;
            font-weight: 600;
        }

        .empty-row {
            text-align: center;
            color: #16A34A;
            font-style: italic;
            padding: 20px;
        }

        .signature-section {
            margin-top: 40px;
            display: flex;
            justify-content: space-between;
            gap: 40px;
        }

        .signature-box {
            text-align: center;
            width: 200px;
        }

        .signature-box p {
            font-size: 10px;
            margin: 0 0 35px 0;
            font-weight: 500;
        }

        .signature-line {
            border-bottom: 1.5px solid #4a5568;
            margin-bottom: 5px;
        }

        .signature-name {
            font-size: 9px;
            color: #64748b;
        }

        .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 9px;
            color: #718096;
            border-top: 1px solid #e2e8f0;
            padding-top: 15px;
        }

        .footer p {
            margin: 2px 0;
        }

        .currency {
            font-family: 'Courier New', monospace;
        }

        @media print {
            body {
                background: white;
            }

            .container {
                box-shadow: none;
                padding: 10px;
            }

            .table-container {
                box-shadow: none;
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
                LAPORAN STOK MINIMUM<br>
                <span style="font-size: 10px; font-weight: 400; color: #6c757d;">
                    {{ $generated_at ?? \Carbon\Carbon::now()->format('d F Y H:i') }} WIB
                </span>
            </div>
        </div>

        <!-- Filter Information -->
        @if(!empty($filters))
        <div class="filters-info">
            <h4>Filter yang Diterapkan:</h4>
            @if(isset($filters['category_id']) && $filters['category_id'] !== 'all')
            <div class="filter-item">• Kategori ID: {{ $filters['category_id'] }}</div>
            @else
            <div class="filter-item">• Kategori: Semua Kategori</div>
            @endif
        </div>
        @endif

        <!-- Summary Cards -->
        @php
        $totalProducts = $products->count();
        $criticalProducts = $products->filter(function($product) {
        $currentStock = $product->current_stock ?? 0;
        $rop = $product->rop ?? ($product->minimum_stock ?? 0);
        return $currentStock > 0 && $currentStock <= ($rop * 0.5);
            })->count();
            $outOfStockProducts = $products->filter(function($product) {
            return ($product->current_stock ?? 0) <= 0;
                })->count();
                $needRestockProducts = $products->filter(function($product) {
                $currentStock = $product->current_stock ?? 0;
                $minimumStock = $product->minimum_stock ?? 0;
                return $currentStock > 0 && $currentStock <= $minimumStock;
                    })->count();
                    @endphp

                    @if(isset($summary) && !empty($summary) || $totalProducts > 0)
                    <div class="summary-cards">
                        <div class="summary-card">
                            <div class="value" style="color: #DC2626;">{{ number_format($criticalProducts) }}</div>
                            <div class="label">Produk Kritis</div>
                            <div style="font-size: 6px; color: #DC2626; font-weight: 500; margin-top: 1px;">
                                Perlu perhatian segera
                            </div>
                        </div>
                        <div class="summary-card">
                            <div class="value" style="color: #6B7280;">{{ number_format($outOfStockProducts) }}</div>
                            <div class="label">Stok Habis</div>
                            <div style="font-size: 6px; color: #6B7280; font-weight: 500; margin-top: 1px;">
                                Tidak ada inventaris
                            </div>
                        </div>
                        <div class="summary-card">
                            <div class="value" style="color: #2563EB;">{{ number_format($needRestockProducts) }}</div>
                            <div class="label">Perlu Restock</div>
                            <div style="font-size: 6px; color: #2563EB; font-weight: 500; margin-top: 1px;">
                                Di bawah batas minimum
                            </div>
                        </div>
                        <div class="summary-card">
                            <div class="value" style="color: #7C3AED;">{{ number_format($totalProducts) }}</div>
                            <div class="label">Total Produk</div>
                            <div style="font-size: 6px; color: #7C3AED; font-weight: 500; margin-top: 1px;">
                                Yang diperiksa
                            </div>
                        </div>
                    </div>
                    @endif

                    <!-- Tabel Stok Minimum -->
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th style="width: 4%;">No</th>
                                    <th style="width: 25%;">Nama Produk</th>
                                    <th style="width: 12%;">SKU</th>
                                    <th style="width: 15%;">Kategori</th>
                                    <th style="width: 10%;">Stok Saat Ini</th>
                                    <th style="width: 10%;">Stok Minimum</th>
                                    <th style="width: 8%;">ROP</th>
                                    <th style="width: 8%;">EOQ</th>
                                    <th style="width: 8%;">Satuan</th>
                                    <th style="width: 12%;">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                @forelse($products as $index => $product)
                                @php
                                $currentStock = $product->current_stock ?? 0;
                                $minimumStock = $product->minimum_stock ?? 0;
                                $rop = $product->rop ?? $minimumStock;

                                $statusClass = 'status-low';
                                $statusText = 'Stok Rendah';
                                $stockClass = 'stock-critical';

                                if ($currentStock <= 0) {
                                    $statusClass='status-out-of-stock' ;
                                    $statusText='Stok Habis' ;
                                    $stockClass='stock-out' ;
                                    } elseif ($currentStock <=$minimumStock) {
                                    $statusClass='status-warning' ;
                                    $statusText='Perlu Restock' ;
                                    } elseif ($currentStock <=($rop * 0.5)) {
                                    $statusClass='status-critical' ;
                                    $statusText='Kritis' ;
                                    }
                                    @endphp
                                    <tr>
                                    <td class="text-center">{{ $index + 1 }}</td>
                                    <td class="text-left font-medium">{{ $product->name }}</td>
                                    <td class="text-center">{{ $product->sku ?? '-' }}</td>
                                    <td class="text-left">{{ $product->category->name ?? '-' }}</td>
                                    <td class="text-right {{ $stockClass }}">{{ number_format($currentStock) }}</td>
                                    <td class="text-right">{{ number_format($minimumStock) }}</td>
                                    <td class="text-right rop-blue">{{ number_format($rop) }}</td>
                                    <td class="text-right eoq-green">{{ number_format($product->eoq ?? 0) }}</td>
                                    <td class="text-center">{{ $product->unit->name ?? 'pcs' }}</td>
                                    <td class="text-center">
                                        <span class="{{ $statusClass }}">{{ $statusText }}</span>
                                    </td>
                                    </tr>
                                    @empty
                                    <tr>
                                        <td colspan="10" class="empty-row">
                                            🎉 Kabar Baik! Tidak ada produk dengan stok di bawah minimum.<br>
                                            <small style="color: #16A34A; font-size: 7px;">Semua level inventaris dalam kondisi sehat</small>
                                        </td>
                                    </tr>
                                    @endforelse
                            </tbody>
                        </table>
                    </div>

                    <!-- Signature Section -->
                    <div class="signature-section">
                        <div class="signature-box">
                            <p>Mengetahui,<br>Manager Operasional</p>
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