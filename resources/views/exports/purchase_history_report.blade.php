<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <title>Laporan Riwayat Pembelian - PT. Brawijaya</title>
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
            font-size: 10px;
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
            font-size: 9px;
            background-color: white;
        }

        thead th {
            background-color: #4F46E5;
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
            background-color: #f8f9fa;
        }

        .status-completed {
            color: #28a745;
            font-weight: 700;
            background-color: #d4edda;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 8px;
        }

        .status-pending {
            color: #856404;
            font-weight: 700;
            background-color: #fff3cd;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 8px;
        }

        .status-draft {
            color: #6B7280;
            font-weight: 700;
            background-color: #F3F4F6;
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
                LAPORAN RIWAYAT PEMBELIAN<br>
                <span style="font-size: 10px; font-weight: 400; color: #6c757d;">
                    {{ $generated_at ?? \Carbon\Carbon::now()->format('d F Y H:i') }} WIB
                </span>
            </div>
        </div>

        <!-- Filter Information -->
        @if(!empty($filters))
        <div class="filters-info">
            <h4>Filter yang Diterapkan:</h4>
            @if(isset($filters['supplier_id']) && $filters['supplier_id'] !== 'all')
            <div class="filter-item">• Supplier ID: {{ $filters['supplier_id'] }}</div>
            @endif
            @if(isset($filters['start_date']))
            <div class="filter-item">• Dari Tanggal: {{ \Carbon\Carbon::parse($filters['start_date'])->format('d/m/Y') }}</div>
            @endif
            @if(isset($filters['end_date']))
            <div class="filter-item">• Sampai Tanggal: {{ \Carbon\Carbon::parse($filters['end_date'])->format('d/m/Y') }}</div>
            @endif
        </div>
        @endif

        <!-- Summary Cards -->
        @php
        $totalPurchases = $purchases->count();
        $totalQuantity = $purchases->sum('quantity');
        $totalAmount = $purchases->sum('total_price');
        $averageAmount = $totalPurchases > 0 ? $totalAmount / $totalPurchases : 0;
        @endphp

        @if(isset($summary) && !empty($summary))
        <div class="summary-cards">
            <div class="summary-card">
                <div class="value">{{ number_format($totalPurchases) }}</div>
                <div class="label">Total Pembelian</div>
            </div>
            <div class="summary-card">
                <div class="value">{{ number_format($totalQuantity) }}</div>
                <div class="label">Total Kuantitas</div>
            </div>
            <div class="summary-card">
                <div class="value currency">{{ 'Rp ' . number_format($totalAmount, 0, ',', '.') }}</div>
                <div class="label">Total Nilai Pembelian</div>
            </div>
            <div class="summary-card">
                <div class="value currency">{{ 'Rp ' . number_format($averageAmount, 0, ',', '.') }}</div>
                <div class="label">Rata-rata per Pembelian</div>
            </div>
        </div>
        @endif

        <!-- Tabel Riwayat Pembelian -->
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th style="width: 5%;">No</th>
                        <th style="width: 12%;">Invoice</th>
                        <th style="width: 10%;">Tanggal</th>
                        <th style="width: 18%;">Supplier</th>
                        <th style="width: 20%;">Produk</th>
                        <th style="width: 8%;">Qty</th>
                        <th style="width: 10%;">Harga Satuan</th>
                        <th style="width: 10%;">Total Harga</th>
                        <th style="width: 12%;">Petugas</th>
                        <th style="width: 10%;">Status</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse($purchases as $index => $purchase)
                    <tr>
                        <td class="text-center">{{ $index + 1 }}</td>
                        <td class="text-center">{{ $purchase->invoice_number ?? '-' }}</td>
                        <td class="text-center">
                            {{ \Carbon\Carbon::parse($purchase->transaction_date ?? $purchase->purchase_date ?? $purchase->created_at)->format('d/m/Y') }}
                        </td>
                        <td>{{ $purchase->supplier->name ?? '-' }}</td>
                        <td>{{ $purchase->product->name ?? '-' }}</td>
                        <td class="text-right">{{ number_format($purchase->quantity ?? 0) }}</td>
                        <td class="text-right">Rp {{ number_format($purchase->price_per_unit ?? 0, 0, ',', '.') }}</td>
                        <td class="text-right">Rp {{ number_format($purchase->total_price ?? 0, 0, ',', '.') }}</td>
                        <td class="text-center">{{ $purchase->user->name ?? 'Sistem' }}</td>
                        <td class="text-center">
                            <span class="{{ ($purchase->status ?? 'pending') == 'completed' ? 'status-completed' : (($purchase->status ?? 'pending') == 'pending' ? 'status-pending' : 'status-draft') }}">
                                {{ ($purchase->status ?? 'pending') == 'completed' ? 'Selesai' : (($purchase->status ?? 'pending') == 'pending' ? 'Pending' : 'Draft') }}
                            </span>
                        </td>
                    </tr>
                    @empty
                    <tr>
                        <td colspan="10" class="empty-row">Tidak ada data riwayat pembelian</td>
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