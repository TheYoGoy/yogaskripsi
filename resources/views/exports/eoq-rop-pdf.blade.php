<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Laporan EOQ & ROP</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            font-size: 10px;
            margin: 0;
            padding: 15px;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #0f766e;
            padding-bottom: 10px;
        }
        .header h1 {
            color: #0f766e;
            font-size: 18px;
            margin: 0;
        }
        .header p {
            margin: 5px 0;
            color: #666;
        }
        .info-section {
            margin-bottom: 15px;
            display: flex;
            justify-content: space-between;
        }
        .info-box {
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            width: 23%;
            text-align: center;
        }
        .info-box h4 {
            margin: 0 0 5px 0;
            color: #0f766e;
        }
        .table-container {
            width: 100%;
            margin-top: 20px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 6px;
            text-align: left;
            font-size: 8px;
        }
        th {
            background-color: #0f766e;
            color: white;
            font-weight: bold;
            text-align: center;
        }
        .text-center {
            text-align: center;
        }
        .text-right {
            text-align: right;
        }
        .status-normal {
            color: #16a34a;
            font-weight: bold;
        }
        .status-warning {
            color: #ea580c;
            font-weight: bold;
        }
        .status-critical {
            color: #dc2626;
            font-weight: bold;
        }
        .footer {
            margin-top: 20px;
            text-align: center;
            font-size: 8px;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 10px;
        }
        .summary {
            margin-bottom: 15px;
            padding: 10px;
            background-color: #f8f9fa;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
        .summary h3 {
            margin: 0 0 10px 0;
            color: #0f766e;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Laporan Optimasi Inventaris Produk (EOQ & ROP)</h1>
        <p>Tanggal Generate: {{ $generated_at }}</p>
        @if(isset($filters['search']) && $filters['search'])
            <p>Filter Pencarian: {{ $filters['search'] }}</p>
        @endif
        @if(isset($filters['created_at']) && $filters['created_at'])
            <p>Tanggal Dibuat: {{ date('d/m/Y', strtotime($filters['created_at'])) }}</p>
        @endif
    </div>

    <div class="info-section">
        <div class="info-box">
            <h4>ROP</h4>
            <p>Reorder Point - Titik pemesanan ulang stok</p>
        </div>
        <div class="info-box">
            <h4>EOQ</h4>
            <p>Economic Order Quantity - Jumlah pemesanan optimal</p>
        </div>
        <div class="info-box">
            <h4>Lead Time</h4>
            <p>Waktu tunggu pemesanan dalam hari</p>
        </div>
        <div class="info-box">
            <h4>Daily Usage</h4>
            <p>Tingkat penggunaan harian produk</p>
        </div>
    </div>

    <div class="summary">
        <h3>Ringkasan</h3>
        <p><strong>Total Produk:</strong> {{ $products->count() }}</p>
        <p><strong>Produk di Bawah ROP:</strong> {{ $products->where('current_stock', '<=', $products->pluck('rop')->toArray())->count() }}</p>
        <p><strong>Produk Mendekati ROP:</strong> {{ $products->filter(function($p) { return $p->current_stock > $p->rop && $p->current_stock <= ($p->rop * 1.5); })->count() }}</p>
        <p><strong>Produk Stok Normal:</strong> {{ $products->filter(function($p) { return $p->current_stock > ($p->rop * 1.5); })->count() }}</p>
    </div>

    <div class="table-container">
        <table>
            <thead>
                <tr>
                    <th style="width: 12%;">Nama Produk</th>
                    <th style="width: 8%;">SKU</th>
                    <th style="width: 8%;">Stok Saat Ini</th>
                    <th style="width: 6%;">ROP</th>
                    <th style="width: 6%;">EOQ</th>
                    <th style="width: 8%;">Lead Time</th>
                    <th style="width: 8%;">Penggunaan Harian</th>
                    <th style="width: 8%;">Biaya Penyimpanan</th>
                    <th style="width: 10%;">Biaya Pemesanan</th>
                    <th style="width: 8%;">Harga</th>
                    <th style="width: 10%;">Status Stok</th>
                    <th style="width: 8%;">Tgl Dibuat</th>
                </tr>
            </thead>
            <tbody>
                @foreach($products as $product)
                    @php
                        $statusClass = 'status-normal';
                        $statusText = 'Normal';
                        if ($product->current_stock <= $product->rop) {
                            $statusClass = 'status-critical';
                            $statusText = 'Di Bawah ROP';
                        } elseif ($product->current_stock <= ($product->rop * 1.5)) {
                            $statusClass = 'status-warning';
                            $statusText = 'Mendekati ROP';
                        }
                    @endphp
                    <tr>
                        <td>{{ $product->name }}</td>
                        <td class="text-center">{{ $product->sku }}</td>
                        <td class="text-right">{{ number_format($product->current_stock) }}</td>
                        <td class="text-right">{{ number_format($product->rop) }}</td>
                        <td class="text-right">{{ number_format($product->eoq) }}</td>
                        <td class="text-right">{{ $product->lead_time ?? 0 }}</td>
                        <td class="text-right">{{ number_format($product->daily_usage_rate ?? 0, 2) }}</td>
                        <td class="text-right">{{ number_format(($product->holding_cost_percentage ?? 0) * 100, 2) }}%</td>
                        <td class="text-right">Rp {{ number_format($product->ordering_cost ?? 0) }}</td>
                        <td class="text-right">Rp {{ number_format($product->price ?? 0) }}</td>
                        <td class="text-center {{ $statusClass }}">{{ $statusText }}</td>
                        <td class="text-center">{{ $product->created_at->format('d/m/Y') }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    </div>

    <div class="footer">
        <p>Laporan ini dibuat secara otomatis oleh sistem pada {{ $generated_at }}</p>
        <p>Total {{ $products->count() }} produk dianalisis</p>
    </div>
</body>
</html>