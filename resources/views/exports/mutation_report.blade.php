<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <title>Laporan Mutasi Stok - PT. Brawijaya</title>
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

        .summary-card.blue .value {
            color: #2563EB;
        }

        .summary-card.green .value {
            color: #059669;
        }

        .summary-card.red .value {
            color: #DC2626;
        }

        .summary-card.emerald .value {
            color: #10B981;
        }

        .summary-card.orange .value {
            color: #EA580C;
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
            min-width: 50px;
        }

        .status-masuk {
            background-color: #D1FAE5;
            color: #059669;
        }

        .status-keluar {
            background-color: #FEE2E2;
            color: #DC2626;
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

        .quantity-positive {
            color: #059669;
            font-weight: 600;
        }

        .quantity-negative {
            color: #DC2626;
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

        .analysis-section {
            background-color: #F8FAFC;
            border: 1px solid #E2E8F0;
            border-radius: 6px;
            padding: 10px;
            margin: 15px 0;
            font-size: 8px;
            line-height: 1.4;
        }

        .analysis-section h4 {
            margin: 0 0 8px 0;
            color: #374151;
            font-weight: 600;
            font-size: 9px;
        }

        .analysis-section p {
            margin: 3px 0;
            color: #6B7280;
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
                    {{-- <img src="{{ public_path('logobrawijaya.png') }}" alt="PT. Brawijaya"> --}}
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
                LAPORAN MUTASI STOK<br>
                <span style="font-size: 10px; font-weight: 400; color: #6c757d;">
                    {{ $generated_at ?? \Carbon\Carbon::now()->format('d F Y H:i') }} WIB
                </span>
            </div>
        </div>

        <!-- Filter Information -->
        @if(!empty($filters))
        <div class="filters-info">
            <h4>Filter yang Diterapkan:</h4>
            @if(isset($filters['product_id']) && $filters['product_id'] !== 'all')
            @php
            $selectedProduct = collect($products ?? [])->firstWhere('id', (int) $filters['product_id']);
            @endphp
            <div class="filter-item">• Produk: {{ optional($selectedProduct)->name ?? 'Produk Dipilih' }}</div>
            @endif
            @if(isset($filters['start_date']))
            <div class="filter-item">• Dari Tanggal: {{ \Carbon\Carbon::parse($filters['start_date'])->format('d/m/Y') }}</div>
            @endif
            @if(isset($filters['end_date']))
            <div class="filter-item">• Sampai Tanggal: {{ \Carbon\Carbon::parse($filters['end_date'])->format('d/m/Y') }}</div>
            @endif
            @if(!isset($filters['product_id']) && !isset($filters['start_date']) && !isset($filters['end_date']))
            <div class="filter-item">• Semua data mutasi stok</div>
            @endif
        </div>
        @endif

        <!-- Summary Cards -->
        @php
        $stockInTransactions = $transactions->where('type', 'in');
        $stockOutTransactions = $transactions->where('type', 'out');
        $stockInCount = $stockInTransactions->count();
        $stockOutCount = $stockOutTransactions->count();
        $stockInQuantity = $stockInTransactions->sum('quantity');
        $stockOutQuantity = $stockOutTransactions->sum('quantity');
        $netMovement = $stockInQuantity - $stockOutQuantity;
        @endphp

        <div class="summary-cards">
            <div class="summary-card blue">
                <div class="value">{{ number_format($transactions->count()) }}</div>
                <div class="label">Total Transaksi</div>
            </div>
            <div class="summary-card green">
                <div class="value">{{ number_format($stockInCount) }}</div>
                <div class="label">Stok Masuk</div>
                <div style="font-size: 6px; color: #059669; font-weight: 500; margin-top: 1px;">
                    Qty: {{ number_format($stockInQuantity) }}
                </div>
            </div>
            <div class="summary-card red">
                <div class="value">{{ number_format($stockOutCount) }}</div>
                <div class="label">Stok Keluar</div>
                <div style="font-size: 6px; color: #DC2626; font-weight: 500; margin-top: 1px;">
                    Qty: {{ number_format($stockOutQuantity) }}
                </div>
            </div>
            <div class="summary-card {{ $netMovement >= 0 ? 'emerald' : 'orange' }}">
                <div class="value">
                    {{ $netMovement >= 0 ? '+' : '' }}{{ number_format($netMovement) }}
                </div>
                <div class="label">Selisih Stok</div>
            </div>
        </div>

        <!-- Tabel Mutasi Stok -->
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th style="width: 4%;">No</th>
                        <th style="width: 9%;">Tanggal</th>
                        <th style="width: 11%;">Kode</th>
                        <th style="width: 8%;">Tipe</th>
                        <th style="width: 22%;">Produk</th>
                        <th style="width: 9%;">Kuantitas</th>
                        <th style="width: 15%;">Pihak Terkait</th>
                        <th style="width: 12%;">Dicatat Oleh</th>
                        <th style="width: 10%;">Keterangan</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse($transactions as $index => $transaction)
                    <tr>
                        <td class="text-center">{{ $index + 1 }}</td>
                        <td class="text-center">
                            {{ \Carbon\Carbon::parse($transaction->transaction_date)->format('d/m/Y') }}
                        </td>
                        <td class="text-center font-medium">{{ $transaction->code ?? '-' }}</td>
                        <td class="text-center">
                            <span class="status-badge {{ $transaction->type == 'in' ? 'status-masuk' : 'status-keluar' }}">
                                {{ $transaction->type == 'in' ? 'Stok Masuk' : 'Stok Keluar' }}
                            </span>
                        </td>
                        <td class="text-left">
                            {{ optional($transaction->product)->name ?? 'Produk Tidak Diketahui' }}
                            @if(optional($transaction->product)->sku)
                            <br><small style="color: #6b7280; font-size: 7px;">SKU: {{ $transaction->product->sku }}</small>
                            @endif
                        </td>
                        <td class="text-center font-medium {{ $transaction->type == 'in' ? 'quantity-positive' : 'quantity-negative' }}">
                            {{ $transaction->type == 'in' ? '+' : '-' }}{{ number_format($transaction->quantity ?? 0) }}
                        </td>
                        <td class="text-center">
                            @if($transaction->type == 'in')
                            {{ optional($transaction->supplier)->name ?? $transaction->source ?? '-' }}
                            @else
                            {{ $transaction->customer ?? '-' }}
                            @endif
                        </td>
                        <td class="text-center">{{ optional($transaction->user)->name ?? 'User Tidak Diketahui' }}</td>
                        <td class="text-left" style="font-size: 7px;">{{ $transaction->note ?? '-' }}</td>
                    </tr>
                    @empty
                    <tr>
                        <td colspan="9" class="empty-row">
                            Tidak ada data mutasi stok yang sesuai dengan filter yang diterapkan
                        </td>
                    </tr>
                    @endforelse
                </tbody>
            </table>
        </div>

        <!-- Analysis Section -->
        @if($transactions->count() > 0)
        <div class="analysis-section">
            <h4>Analisis Mutasi Stok</h4>
            <p><strong>Aktivitas Stok Masuk:</strong> {{ $stockInCount }} transaksi dengan total {{ number_format($stockInQuantity) }} unit</p>
            <p><strong>Aktivitas Stok Keluar:</strong> {{ $stockOutCount }} transaksi dengan total {{ number_format($stockOutQuantity) }} unit</p>

            @if($netMovement > 0)
            <p><strong>Status:</strong> <span style="color: #059669; font-weight: 600;">Stok mengalami penambahan {{ number_format($netMovement) }} unit</span></p>
            <p><strong>Rekomendasi:</strong> Pastikan kapasitas penyimpanan mencukupi dan evaluasi tingkat perputaran stok.</p>
            @elseif($netMovement < 0)
                <p><strong>Status:</strong> <span style="color: #DC2626; font-weight: 600;">Stok mengalami pengurangan {{ number_format(abs($netMovement)) }} unit</span></p>
                <p><strong>Rekomendasi:</strong> Monitor stok untuk memastikan ketersediaan barang dan pertimbangkan pengadaan tambahan.</p>
                @else
                <p><strong>Status:</strong> Stok dalam kondisi seimbang (tidak ada perubahan net)</p>
                <p><strong>Rekomendasi:</strong> Pertahankan keseimbangan stok dan monitor tren pergerakan secara berkala.</p>
                @endif
        </div>
        @endif

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