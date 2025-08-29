<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice Pembelian {{ $transaction->invoice_number }}</title>
    <style>
        /* BASE STYLES & CONTAINER */
        body {
            font-family: 'Inter', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif;
            margin: 0;
            padding: 50px;
            background-color: #f0f2f5;
        }

        .invoice-container {
            max-width: 900px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
            padding: 40px 60px;
        }

        /* HEADER SECTION */
        .invoice-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 50px;
            border-bottom: 3px solid #007bff;
            padding-bottom: 20px;
        }

        .invoice-header .logo {
            padding-top: 10px;
        }

        .invoice-header .logo img {
            max-width: 150px;
            height: auto;
        }

        .invoice-header .invoice-info {
            text-align: right;
        }

        .invoice-header .invoice-info h1 {
            font-size: 38px;
            color: #2c3e50;
            margin: 0 0 10px 0;
            font-weight: 700;
        }

        .invoice-header .invoice-info .invoice-number {
            font-size: 16px;
            color: #7f8c8d;
            font-weight: 400;
            margin: 0;
        }

        .invoice-header .invoice-info .invoice-date {
            font-size: 14px;
            color: #95a5a6;
            margin-top: 5px;
        }

        /* CONTACT DETAILS */
        .contact-details {
            display: flex;
            justify-content: space-between;
            margin-bottom: 40px;
            padding: 20px;
            background-color: #f8f9fa;
            border-left: 5px solid #007bff;
            border-radius: 6px;
        }

        .contact-details .info-block {
            flex: 1;
            margin-right: 20px;
        }

        .contact-details .info-block:last-child {
            margin-right: 0;
        }

        .contact-details h3 {
            font-size: 14px;
            color: #007bff;
            text-transform: uppercase;
            margin: 0 0 10px 0;
            font-weight: 600;
        }

        .contact-details p {
            font-size: 13px;
            margin: 5px 0;
            color: #555;
        }

        .contact-details strong {
            display: inline-block;
            width: 80px;
            font-weight: 600;
        }

        /* ITEMS TABLE */
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 40px;
        }

        .items-table th,
        .items-table td {
            padding: 15px;
            text-align: left;
            border-bottom: 1px solid #e0e0e0;
        }

        .items-table th {
            font-size: 12px;
            text-transform: uppercase;
            color: #7f8c8d;
            background-color: #f8f9fa;
        }

        .items-table td {
            font-size: 14px;
            color: #333;
        }

        .items-table .quantity,
        .items-table .unit-price,
        .items-table .total {
            text-align: right;
        }

        .items-table .total {
            font-weight: 600;
            color: #2c3e50;
        }

        /* TOTALS SECTION */
        .totals {
            text-align: right;
            margin-bottom: 40px;
        }

        .totals .total-row {
            display: flex;
            justify-content: flex-end;
            align-items: center;
            margin-bottom: 10px;
        }

        .totals .total-row .label {
            font-size: 16px;
            font-weight: 600;
            color: #555;
            margin-right: 20px;
        }

        .totals .total-row .value {
            font-size: 24px;
            font-weight: 700;
            color: #007bff;
            min-width: 150px;
            text-align: right;
        }

        .status-badge {
            font-size: 12px;
            padding: 6px 15px;
            border-radius: 20px;
            font-weight: 700;
            text-transform: uppercase;
            color: #fff;
            background-color: #27ae60;
            margin-top: 10px;
            display: inline-block;
        }

        .status-pending {
            background-color: #f39c12;
        }

        .status-completed {
            background-color: #27ae60;
        }

        .status-cancelled {
            background-color: #e74c3c;
        }

        /* FOOTER */
        .invoice-footer {
            text-align: center;
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            font-size: 12px;
            color: #95a5a6;
        }
    </style>
</head>

<body>
    <div class="invoice-container">
        <div class="invoice-header">
            <div class="logo">
                {{-- PERBAIKAN: Mengubah path menjadi asset('images/logobrawijaya.png') --}}
                <img src="{{ asset('logobrawijaya.png') }}" alt="Logo Perusahaan">
            </div>
            <div class="invoice-info">
                <h1>INVOICE</h1>
                <p class="invoice-number">#{{ $transaction->invoice_number }}</p>
                <p class="invoice-date">Tanggal: {{ $transaction->transaction_date ? \Carbon\Carbon::parse($transaction->transaction_date)->format('d F Y') : 'N/A' }}</p>
            </div>
        </div>

        <div class="contact-details">
            <div class="info-block">
                <h3>Informasi Supplier</h3>
                <p><strong>Nama:</strong> {{ $transaction->supplier->name ?? 'N/A' }}</p>
                <p><strong>Alamat:</strong> {{ $transaction->supplier->address ?? 'N/A' }}</p>
                <p><strong>Telepon:</strong> {{ $transaction->supplier->phone ?? 'N/A' }}</p>
            </div>
            <div class="info-block">
                <h3>Detail Transaksi</h3>
                <p><strong>Dicatat oleh:</strong> {{ $transaction->user->name ?? 'N/A' }}</p>
                <p><strong>Status:</strong>
                    @if($transaction->status)
                    <span class="status-badge status-{{ strtolower($transaction->status) }}">
                        {{ ucfirst($transaction->status) }}
                    </span>
                    @else
                    N/A
                    @endif
                </p>
            </div>
        </div>

        <table class="items-table">
            <thead>
                <tr>
                    <th>Deskripsi Produk</th>
                    <th class="quantity">Kuantitas</th>
                    <th class="unit-price">Harga per Unit</th>
                    <th class="total">Total</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>{{ $transaction->product->name ?? 'N/A' }}</td>
                    <td class="quantity">{{ number_format($transaction->quantity ?? 0, 0, ',', '.') }} pcs</td>
                    <td class="unit-price">Rp {{ number_format($transaction->price_per_unit ?? 0, 0, ',', '.') }}</td>
                    <td class="total">Rp {{ number_format(($transaction->quantity ?? 0) * ($transaction->price_per_unit ?? 0), 0, ',', '.') }}</td>
                </tr>
            </tbody>
        </table>

        <div class="totals">
            <div class="total-row">
                <span class="label">GRAND TOTAL</span>
                <span class="value">Rp {{ number_format($transaction->total_price ?? 0, 0, ',', '.') }}</span>
            </div>
        </div>

        @if($transaction->notes)
        <div class="contact-details" style="margin-bottom: 0;">
            <div class="info-block" style="flex: none; width: 100%;">
                <h3>Catatan</h3>
                <p>{{ $transaction->notes }}</p>
            </div>
        </div>
        @endif

        <div class="invoice-footer">
            <p>Terima kasih atas kepercayaan Anda.</p>
            <p>Dicetak pada: {{ \Carbon\Carbon::now()->format('d F Y H:i:s') }}</p>
            <p>&copy; {{ date('Y') }} Nama Perusahaan Anda. Semua Hak Cipta Dilindungi.</p>
        </div>
    </div>
</body>

</html>