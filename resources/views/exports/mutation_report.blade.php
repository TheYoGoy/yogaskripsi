<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="utf-8">
    <title>Laporan Mutasi Stok</title>
    <style>
        body {
            font-family: sans-serif;
            color: #333;
            font-size: 12px;
        }

        .header {
            text-align: center;
            margin-bottom: 5px;
        }

        .header h2 {
            margin: 0;
            font-size: 18px;
        }

        .company-info {
            text-align: center;
            font-size: 12px;
            color: #555;
            line-height: 1.4;
        }

        .divider {
            border-top: 1px solid #ddd;
            margin: 10px 0;
        }

        .report-info {
            text-align: right;
            font-size: 11px;
            color: #555;
            margin-bottom: 10px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            font-size: 11.5px;
        }

        th,
        td {
            border: 1px solid #ddd;
            padding: 6px;
        }

        th {
            background-color: #f5f5f5;
            text-align: left;
        }

        .empty-row {
            text-align: center;
            color: #999;
        }

        .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 11px;
            color: #777;
        }
    </style>
</head>

<body>
    <div class="header">
        <h2>LAPORAN MUTASI STOK</h2>
    </div>

    <div class="company-info">
        <strong>{{ $setting->company_name ?? 'Nama Perusahaan' }}</strong><br>
        {{ $setting->company_address ?? 'Alamat Perusahaan' }}<br>
        Telp: {{ $setting->company_phone ?? '-' }} | Email: {{ $setting->company_email ?? '-' }}
    </div>

    <div class="divider"></div>

    <div class="report-info">
        Dicetak pada: {{ \Carbon\Carbon::now()->format('d-m-Y H:i') }}
    </div>

    <table>
        <thead>
            <tr>
                <th>No</th>
                <th>Tanggal Transaksi</th>
                <th>Produk</th>
                <th>Jenis</th>
                <th>Jumlah</th>
                <th>User</th>
                <th>Keterangan</th>
            </tr>
        </thead>
        <tbody>
            @forelse($transactions as $index => $transaction)
            <tr>
                <td>{{ $index + 1 }}</td>
                <td>{{ \Carbon\Carbon::parse($transaction->transaction_date)->format('d-m-Y') }}</td>
                <td>{{ $transaction->product->name ?? '-' }}</td>
                <td>{{ $transaction->type == 'in' ? 'Masuk' : 'Keluar' }}</td>
                <td>{{ $transaction->quantity }}</td>
                <td>{{ $transaction->user->name ?? '-' }}</td>
                <td>{{ $transaction->note ?? '-' }}</td>
            </tr>
            @empty
            <tr>
                <td colspan="7" class="empty-row">Tidak ada data mutasi stok.</td>
            </tr>
            @endforelse
        </tbody>
    </table>

    <div class="footer">
        Laporan ini dihasilkan otomatis oleh sistem persediaan barang.
    </div>
</body>

</html>
