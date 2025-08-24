<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice {{ $transaction->invoice_number }}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            font-size: 12pt;
            line-height: 1.4;
            color: #333;
        }

        .invoice-container {
            max-width: 800px;
            margin: 0 auto;
        }

        .invoice-header {
            text-align: center;
            border-bottom: 2px solid #000;
            margin-bottom: 30px;
            padding-bottom: 20px;
        }

        .invoice-header h1 {
            margin: 0;
            font-size: 24pt;
            font-weight: bold;
            color: #2c3e50;
        }

        .invoice-header h2 {
            margin: 10px 0 0 0;
            font-size: 18pt;
            color: #7f8c8d;
        }

        .invoice-details {
            margin-bottom: 30px;
        }

        .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 12px;
            padding: 8px 0;
            border-bottom: 1px solid #ecf0f1;
        }

        .detail-row:last-child {
            border-bottom: none;
        }

        .detail-label {
            font-weight: bold;
            width: 40%;
            color: #2c3e50;
        }

        .detail-value {
            width: 60%;
            text-align: right;
        }

        .total-row {
            background-color: #f8f9fa;
            border: 2px solid #2c3e50;
            font-weight: bold;
            font-size: 14pt;
            margin-top: 20px;
            padding: 15px 8px;
        }

        .notes-section {
            margin-top: 30px;
            padding: 15px;
            background-color: #f8f9fa;
            border-left: 4px solid #3498db;
        }

        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #bdc3c7;
            text-align: center;
            font-size: 10pt;
            color: #7f8c8d;
        }

        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 4px;
            font-size: 10pt;
            font-weight: bold;
            text-transform: uppercase;
        }

        .status-pending {
            background-color: #f39c12;
            color: white;
        }

        .status-completed {
            background-color: #27ae60;
            color: white;
        }

        .status-cancelled {
            background-color: #e74c3c;
            color: white;
        }
    </style>
</head>

<body>
    <div class="invoice-container">
        <!-- Header -->
        <div class="invoice-header">
            <h1>INVOICE PEMBELIAN</h1>
            <h2>{{ $transaction->invoice_number }}</h2>
        </div>

        <!-- Transaction Details -->
        <div class="invoice-details">
            <div class="detail-row">
                <div class="detail-label">Supplier:</div>
                <div class="detail-value">{{ $transaction->supplier->name ?? 'N/A' }}</div>
            </div>

            <div class="detail-row">
                <div class="detail-label">Produk:</div>
                <div class="detail-value">{{ $transaction->product->name ?? 'N/A' }}</div>
            </div>

            <div class="detail-row">
                <div class="detail-label">Kuantitas:</div>
                <div class="detail-value">{{ number_format($transaction->quantity ?? 0, 0, ',', '.') }} pcs</div>
            </div>

            <div class="detail-row">
                <div class="detail-label">Harga per Unit:</div>
                <div class="detail-value">Rp {{ number_format($transaction->price_per_unit ?? 0, 0, ',', '.') }}</div>
            </div>

            <div class="detail-row total-row">
                <div class="detail-label">Total Harga:</div>
                <div class="detail-value">Rp {{ number_format($transaction->total_price ?? 0, 0, ',', '.') }}</div>
            </div>

            <div class="detail-row">
                <div class="detail-label">Tanggal Transaksi:</div>
                <div class="detail-value">
                    {{ $transaction->transaction_date ? \Carbon\Carbon::parse($transaction->transaction_date)->format('d F Y') : 'N/A' }}
                </div>
            </div>

            <div class="detail-row">
                <div class="detail-label">Status:</div>
                <div class="detail-value">
                    @if($transaction->status)
                    <span class="status-badge status-{{ $transaction->status }}">
                        {{ ucfirst($transaction->status) }}
                    </span>
                    @else
                    N/A
                    @endif
                </div>
            </div>

            <div class="detail-row">
                <div class="detail-label">Dicatat oleh:</div>
                <div class="detail-value">{{ $transaction->user->name ?? 'N/A' }}</div>
            </div>
        </div>

        <!-- Notes Section -->
        @if($transaction->notes)
        <div class="notes-section">
            <strong>Catatan:</strong><br>
            {{ $transaction->notes }}
        </div>
        @endif

        <!-- Footer -->
        <div class="footer">
            <p>Dicetak pada: {{ \Carbon\Carbon::now()->format('d F Y H:i:s') }}</p>
            <p>Terima kasih atas kerjasama Anda</p>
        </div>
    </div>
</body>

</html>