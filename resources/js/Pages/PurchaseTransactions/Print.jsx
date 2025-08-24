import React, { useEffect } from "react";
import dayjs from "dayjs";

export default function Print({ purchaseTransaction }) {
    useEffect(() => {
        // Wait a bit longer to ensure content is fully rendered
        const timer = setTimeout(() => {
            window.print();
            // Optional: close window after printing (for popup scenarios)
            // window.close();
        }, 1000);

        // Cleanup timeout if component unmounts
        return () => clearTimeout(timer);
    }, []);

    // Error handling for missing data
    if (!purchaseTransaction) {
        return (
            <div className="p-8">
                <h1 className="text-xl text-red-600">
                    Error: No transaction data found
                </h1>
            </div>
        );
    }

    // Format currency helper
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
        }).format(amount || 0);
    };

    // Format date helper
    const formatDate = (date) => {
        return date ? dayjs(date).format("DD MMMM YYYY") : "-";
    };

    return (
        <>
            {/* Print-specific styles */}
            <style jsx>{`
                @media print {
                    body {
                        margin: 0;
                    }
                    .no-print {
                        display: none !important;
                    }
                    .print-container {
                        max-width: 100%;
                        margin: 0;
                        font-size: 12pt;
                        line-height: 1.4;
                    }
                    .invoice-header {
                        border-bottom: 2px solid #000;
                        margin-bottom: 20px;
                        padding-bottom: 10px;
                    }
                    .invoice-details {
                        margin-bottom: 15px;
                    }
                    .invoice-row {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 8px;
                        padding: 5px 0;
                    }
                    .label {
                        font-weight: bold;
                        width: 40%;
                    }
                    .value {
                        width: 60%;
                        text-align: right;
                    }
                    .total-row {
                        border-top: 1px solid #ccc;
                        border-bottom: 2px solid #000;
                        font-weight: bold;
                        font-size: 14pt;
                        margin-top: 10px;
                        padding-top: 10px;
                    }
                }

                @media screen {
                    .print-container {
                        max-width: 800px;
                        margin: 0 auto;
                        background: white;
                        padding: 40px;
                        box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
                    }
                }
            `}</style>

            <div className="print-container p-8">
                {/* Header */}
                <div className="invoice-header">
                    <h1 className="text-3xl font-bold text-center mb-2">
                        INVOICE PEMBELIAN
                    </h1>
                    <h2 className="text-xl font-semibold text-center text-gray-700">
                        {purchaseTransaction.invoice_number || "N/A"}
                    </h2>
                </div>

                {/* Transaction Details */}
                <div className="invoice-details">
                    <div className="invoice-row">
                        <span className="label">Supplier:</span>
                        <span className="value">
                            {purchaseTransaction.supplier?.name || "N/A"}
                        </span>
                    </div>

                    <div className="invoice-row">
                        <span className="label">Produk:</span>
                        <span className="value">
                            {purchaseTransaction.product?.name || "N/A"}
                        </span>
                    </div>

                    <div className="invoice-row">
                        <span className="label">Kuantitas:</span>
                        <span className="value">
                            {(purchaseTransaction.quantity || 0).toLocaleString(
                                "id-ID"
                            )}{" "}
                            pcs
                        </span>
                    </div>

                    <div className="invoice-row">
                        <span className="label">Harga per Unit:</span>
                        <span className="value">
                            {formatCurrency(purchaseTransaction.price_per_unit)}
                        </span>
                    </div>

                    <div className="invoice-row total-row">
                        <span className="label">Total Harga:</span>
                        <span className="value">
                            {formatCurrency(purchaseTransaction.total_price)}
                        </span>
                    </div>

                    <div className="invoice-row">
                        <span className="label">Tanggal Transaksi:</span>
                        <span className="value">
                            {formatDate(purchaseTransaction.transaction_date)}
                        </span>
                    </div>

                    {purchaseTransaction.notes && (
                        <div className="invoice-row">
                            <span className="label">Catatan:</span>
                            <span className="value">
                                {purchaseTransaction.notes}
                            </span>
                        </div>
                    )}

                    <div className="invoice-row">
                        <span className="label">Dicatat oleh:</span>
                        <span className="value">
                            {purchaseTransaction.user?.name || "N/A"}
                        </span>
                    </div>

                    <div className="invoice-row">
                        <span className="label">Status:</span>
                        <span className="value">
                            {purchaseTransaction.status
                                ? purchaseTransaction.status
                                      .charAt(0)
                                      .toUpperCase() +
                                  purchaseTransaction.status.slice(1)
                                : "N/A"}
                        </span>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-8 pt-4 border-t border-gray-300 text-center text-sm text-gray-600">
                    <p>
                        Dicetak pada: {dayjs().format("DD MMMM YYYY HH:mm:ss")}
                    </p>
                    <p className="mt-2">Terima kasih atas kerjasama Anda</p>
                </div>
            </div>
        </>
    );
}
