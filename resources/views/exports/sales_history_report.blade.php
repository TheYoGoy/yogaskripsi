<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <title>Laporan Riwayat Penjualan - PT. Brawijaya</title>
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

        .products-blue {
            color: #2563EB;
            font-weight: 600;
        }

        .transactions-purple {
            color: #7C3AED;
            font-weight: 600;
        }

        .amount-green {
            color: #16A34A;
            font-weight: 600;
        }

        .empty-row {
            text-align: center;
            color: #a0aec0;
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
                LAPORAN RIWAYAT PENJUALAN<br>
                <span style="font-size: 10px; font-weight: 400; color: #6c757d;">
                    {{ \Carbon\Carbon::now()->format('d F Y H:i') }} WIB
                </span>
            </div>
        </div>

        <!-- Summary Section -->
        @if(isset($summary) && $summary['total_transactions'] > 0)
        <div class="summary-section">
            <div class="summary-item">
                <div class="summary-label">Total Penjualan</div>
                <div class="summary-value">{{ number_format($summary['total_transactions']) }}</div>
            </div>
            <div class="summary-item">
                <div class="summary-label">Total Kuantitas</div>
                <div class="summary-value">{{ number_format($summary['total_quantity']) }}</div>
            </div>
            <div class="summary-item">
                <div class="summary-label">Total Nilai Penjualan</div>
                <div class="summary-value">Rp {{ number_format($summary['total_amount'], 0, ',', '.') }}</div>
            </div>
            <div class="summary-item">
                <div class="summary-label">Rata-rata per Transaksi</div>
                <div class="summary-value">Rp {{ number_format($summary['average_amount'], 0, ',', '.') }}</div>
            </div>
        </div>
        @endif

        <!-- Tabel Riwayat Penjualan -->
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th style="width: 5%;">No</th>
                        <th style="width: 12%;">Invoice/Kode</th>
                        <th style="width: 10%;">Tanggal</th>
                        <th style="width: 20%;">Produk</th>
                        <th style="width: 15%;">Customer</th>
                        <th style="width: 8%;">Qty</th>
                        <th style="width: 10%;">Harga Satuan</th>
                        <th style="width: 10%;">Total Harga</th>
                        <th style="width: 10%;">Petugas</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse($sales as $index => $sale)
                    <tr>
                        <td class="text-center">{{ $index + 1 }}</td>
                        <td class="text-center">{{ $sale->invoice_number ?? $sale->code ?? '-' }}</td>
                        <td class="text-center">
                            {{ \Carbon\Carbon::parse($sale->transaction_date ?? $sale->sale_date ?? $sale->created_at)->format('d/m/Y') }}
                        </td>
                        <td>
                            {{ $sale->product->name ?? '-' }}
                            @if($sale->product && $sale->product->sku)
                            <br><small style="color: #6c757d; font-size: 7px;">SKU: {{ $sale->product->sku }}</small>
                            @endif
                        </td>
                        <td>{{ $sale->customer->name ?? $sale->customer_name ?? '-' }}</td>
                        <td class="text-right">{{ number_format($sale->quantity ?? 0) }}</td>
                        <td class="text-right">
                            Rp {{ number_format($sale->price_per_unit ?? ($sale->quantity > 0 ? ($sale->total_price / $sale->quantity) : 0), 0, ',', '.') }}
                        </td>
                        <td class="text-right">Rp {{ number_format($sale->total_price ?? 0, 0, ',', '.') }}</td>
                        <td class="text-center">{{ $sale->user->name ?? 'Sistem' }}</td>
                    </tr>
                    @empty
                    <tr>
                        <td colspan="9" class="empty-row">Tidak ada data riwayat penjualan</td>
                    </tr>
                    @endforelse
                </tbody>
            </table>
        </div>

        <!-- Signature Section -->
        <div class="signature-section">
            <div class="signature-box">
                <p>Mengetahui,<br>Manager Penjualan</p>
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