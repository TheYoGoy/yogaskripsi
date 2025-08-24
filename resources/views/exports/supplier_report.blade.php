<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <title>Laporan Data Supplier</title>
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary-color: #007bff;
            --text-color: #333;
            --light-gray: #f8f9fa;
            --border-color: #e9ecef;
            --header-bg: #e9ecef;
            --shadow-light: rgba(0, 0, 0, 0.05);
        }

        body {
            font-family: 'Roboto', sans-serif;
            margin: 30px;
            background-color: var(--light-gray);
            color: var(--text-color);
            line-height: 1.6;
        }

        .header {
            text-align: center;
            margin-bottom: 10px;
        }

        .header h2 {
            color: var(--primary-color);
            font-weight: 700;
            letter-spacing: 0.5px;
            margin: 0;
            font-size: 20px;
        }

        .sub-header {
            text-align: center;
            font-size: 12px;
            color: #555;
            margin-bottom: 20px;
        }

        table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            box-shadow: 0 4px 12px var(--shadow-light);
            background-color: #fff;
            border-radius: 8px;
            overflow: hidden;
            font-size: 12px;
        }

        th,
        td {
            padding: 10px 14px;
            text-align: left;
            border-bottom: 1px solid var(--border-color);
        }

        th {
            background-color: var(--header-bg);
            color: var(--text-color);
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-size: 11px;
        }

        th:first-child {
            border-top-left-radius: 8px;
        }

        th:last-child {
            border-top-right-radius: 8px;
        }

        tbody tr:last-child td {
            border-bottom: none;
        }

        tbody tr:nth-child(even) {
            background-color: var(--light-gray);
        }

        tbody tr:hover {
            background-color: rgba(0, 123, 255, 0.05);
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
        <h2>LAPORAN DATA SUPPLIER</h2>
    </div>

    <div class="sub-header">
        Dicetak pada: {{ \Carbon\Carbon::now()->format('d-m-Y H:i') }}
    </div>

    <table>
        <thead>
            <tr>
                <th>No</th>
                <th>Nama Supplier</th>
                <th>Jumlah Transaksi</th>
                <th>Total Nilai Pembelian</th>
            </tr>
        </thead>
        <tbody>
            @forelse($suppliers as $i => $supplier)
            <tr>
                <td>{{ $i + 1 }}</td>
                <td>{{ $supplier->name }}</td>
                <td>{{ $supplier->total_transactions ?? 0 }}</td>
                <td>Rp{{ number_format($supplier->total_amount ?? 0, 0, ',', '.') }}</td>
            </tr>
            @empty
            <tr>
                <td colspan="4" style="text-align: center; color: #999;">Tidak ada data.</td>
            </tr>
            @endforelse
        </tbody>
    </table>

    <div class="footer">
        Laporan ini dihasilkan otomatis oleh sistem persediaan barang.
    </div>
</body>

</html>
