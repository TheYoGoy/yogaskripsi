<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <title>Laporan Analisis EOQ & ROP - PT. Brawijaya</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');

        @page {
            size: A4 landscape;
            margin: 1.5cm 1cm;
        }

        body,
        h1,
        h2,
        h3,
        h4,
        p,
        span,
        strong,
        div,
        table,
        thead,
        tbody,
        tr,
        th,
        td {
            font-family: 'Poppins', sans-serif;
        }

        body {
            color: #212529;
            font-size: 10px;
            line-height: 1.6;
            margin: 0;
            padding: 0;
        }

        .container {
            max-width: 100%;
            background-color: white;
            padding: 25px;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
        }

        .header {
            display: flex;
            align-items: center;
            justify-content: flex-start;
            margin-bottom: 30px;
            padding-bottom: 25px;
            border-bottom: 1px solid #e9ecef;
        }

        .company-branding {
            display: flex;
            align-items: center;
            width: 100%;
        }

        .company-logo {
            flex-shrink: 0;
            margin-right: 20px;
        }

        .company-logo img {
            max-height: 50px;
            width: auto;
            filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
        }

        .company-info {
            flex-grow: 1;
            text-align: left;
        }

        .company-info h1 {
            font-size: 18px;
            font-weight: 700;
            color: #1a365d;
            margin: 0 0 5px 0;
        }

        .company-details {
            font-size: 9px;
            color: #6c757d;
            line-height: 1.4;
        }

        .report-title {
            font-size: 18px;
            font-weight: 600;
            color: #343a40;
            margin: 0;
            text-transform: uppercase;
            letter-spacing: 1.2px;
            text-align: right;
            align-self: flex-end;
            margin-left: auto;
        }

        .section-box {
            background: linear-gradient(135deg, #f7f9fc 0%, #e8f4fd 100%);
            border: 1px solid #e0e6ed;
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 25px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
        }

        .section-box h3 {
            font-size: 13px;
            font-weight: 600;
            color: #495057;
            margin: 0 0 10px 0;
        }

        .info-block p {
            margin: 3px 0;
            font-size: 10px;
            color: #495057;
        }

        .info-block strong {
            font-weight: 700;
        }

        .print-meta {
            text-align: right;
            font-size: 9px;
            color: #adb5bd;
        }

        .summary-grid {
            display: flex;
            justify-content: space-between;
            gap: 20px;
            margin-bottom: 30px;
        }

        .summary-item {
            flex: 1;
            background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
            border: 1px solid #e9ecef;
            border-radius: 10px;
            padding: 18px 15px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.06);
            transition: transform 0.2s ease, box-shadow 0.2s ease;
            text-align: center;
            min-width: 0;
        }

        .summary-item:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
        }

        .summary-item .number {
            font-size: 24px;
            font-weight: 700;
            color: #1a365d;
            display: block;
        }

        .summary-item .label {
            font-size: 10px;
            font-weight: 500;
            color: #6c757d;
            margin-top: 8px;
        }

        .table-container {
            margin-top: 10px;
            border: 1px solid #dee2e6;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9px;
            background-color: white;
        }

        thead th {
            background-color: #1A537C;
            color: white;
            padding: 8px 4px;
            text-align: center;
            font-weight: 600;
            font-size: 8px;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            border-right: 1px solid #2B6995;
        }

        thead th:last-child {
            border-right: none;
        }

        tbody td {
            padding: 6px 4px;
            border-bottom: 1px solid #e9ecef;
            border-right: 1px solid #e9ecef;
            font-size: 8px;
        }

        tbody td:last-child {
            border-right: none;
        }

        tbody tr:nth-child(even) {
            background-color: #f8f9fa;
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

        .status-normal {
            color: #28a745;
            font-weight: 700;
            background-color: #d4edda;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 8px;
        }

        .status-warning {
            color: #856404;
            font-weight: 700;
            background-color: #fff3cd;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 8px;
        }

        .status-critical {
            color: #721c24;
            font-weight: 700;
            background-color: #f8d7da;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 8px;
        }

        .empty-row {
            text-align: center;
            color: #adb5bd;
            font-style: italic;
            padding: 30px;
        }

        .signature-section {
            margin-top: 50px;
            display: flex;
            justify-content: space-between;
        }

        .signature-box {
            text-align: center;
            width: 250px;
        }

        .signature-box p {
            font-size: 11px;
            margin: 0 0 50px 0;
            font-weight: 500;
            color: #495057;
        }

        .signature-line {
            border-bottom: 2px solid #343a40;
            margin-bottom: 8px;
        }

        .signature-name {
            font-size: 10px;
            color: #495057;
        }

        .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 9px;
            color: #6c757d;
            border-top: 1px solid #e9ecef;
            padding-top: 20px;
        }

        .footer p {
            margin: 4px 0;
        }

        @media print {
            body {
                background-color: white;
            }

            .container {
                box-shadow: none;
                padding: 15px;
                margin: 0;
            }

            .section-box,
            .table-container,
            .summary-item {
                box-shadow: none;
                border: 1px solid #dee2e6;
            }

            .summary-item:hover {
                transform: none;
            }

            tbody tr:hover {
                background-color: transparent;
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
                LAPORAN ANALISIS EOQ & ROP<br>
                <span style="font-size: 10px; font-weight: 400; color: #6c757d;">
                    {{ \Carbon\Carbon::now()->format('d F Y H:i') }} WIB
                </span>
            </div>
        </div>

        <!-- Tabel EOQ & ROP -->
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th style="width: 3%;">No</th>
                        <th style="width: 15%;">Nama Produk</th>
                        <th style="width: 8%;">SKU</th>
                        <th style="width: 8%;">Stok</th>
                        <th style="width: 8%;">ROP</th>
                        <th style="width: 8%;">EOQ</th>
                        <th style="width: 8%;">Lead Time</th>
                        <th style="width: 10%;">Penggunaan Harian</th>
                        <th style="width: 10%;">Biaya Simpan</th>
                        <th style="width: 10%;">Biaya Pesan</th>
                        <th style="width: 12%;">Status Stok</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse($products as $index => $product)
                    @php
                    $currentStock = $product->current_stock ?? 0;
                    $rop = $product->rop ?? 0;
                    $statusClass = 'status-normal';
                    $statusText = 'Normal';

                    if ($currentStock <= $rop) {
                        $statusClass='status-critical' ;
                        $statusText='Di Bawah ROP' ;
                        } elseif ($currentStock <=($rop * 1.5)) {
                        $statusClass='status-warning' ;
                        $statusText='Mendekati ROP' ;
                        }
                        @endphp
                        <tr>
                        <td class="text-center">{{ $index + 1 }}</td>
                        <td class="text-left">{{ $product->name }}</td>
                        <td class="text-center">{{ $product->sku ?? '-' }}</td>
                        <td class="text-right">{{ number_format($currentStock) }}</td>
                        <td class="text-right">{{ number_format($rop) }}</td>
                        <td class="text-right">{{ number_format($product->eoq ?? 0) }}</td>
                        <td class="text-right">{{ ($product->lead_time ?? 0) }} hari</td>
                        <td class="text-right">{{ number_format($product->daily_usage_rate ?? 0, 2) }}</td>
                        <td class="text-right">{{ number_format(($product->holding_cost_percentage ?? 0) * 100, 1) }}%</td>
                        <td class="text-right">Rp {{ number_format($product->ordering_cost ?? 0, 0, ',', '.') }}</td>
                        <td class="text-center">
                            <span class="{{ $statusClass }}">{{ $statusText }}</span>
                        </td>
                        </tr>
                        @empty
                        <tr>
                            <td colspan="11" class="empty-row">Tidak ada data produk untuk dianalisis</td>
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