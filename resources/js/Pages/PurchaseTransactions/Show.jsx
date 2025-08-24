// resources/js/Components/PurchaseTransactionShow.jsx
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import axios from "axios";
import { Loader2 } from "lucide-react";

/**
 * Modal khusus untuk menampilkan barcode Purchase Transaction.
 *
 * Props:
 * - isOpen: boolean
 * - onOpenChange: function
 * - transactionId: number
 * - invoiceNumber: string
 */
export default function PurchaseTransactionShow({
    isOpen,
    onOpenChange,
    transactionId,
    invoiceNumber,
}) {
    const [barcodeSVG, setBarcodeSVG] = useState("");
    const [isLoadingBarcode, setIsLoadingBarcode] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchBarcode = async () => {
            if (!isOpen || !transactionId) {
                setBarcodeSVG("");
                setError(null);
                return;
            }

            setIsLoadingBarcode(true);
            setBarcodeSVG("");
            setError(null);

            try {
                const response = await axios.get(
                    route(
                        "purchase-transactions.barcode.generate",
                        transactionId
                    )
                );
                setBarcodeSVG(response.data.svg);
            } catch (err) {
                console.error("Gagal mengambil barcode:", err);
                setError("Gagal memuat barcode. Silakan coba lagi.");
                setBarcodeSVG(null);
            } finally {
                setIsLoadingBarcode(false);
            }
        };

        fetchBarcode();
    }, [isOpen, transactionId]);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md p-6 rounded-xl shadow-xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-gray-800">
                        Preview Barcode
                    </DialogTitle>
                    <DialogDescription className="text-gray-600">
                        Scan barcode ini untuk identifikasi transaksi:{" "}
                        <span className="font-semibold text-gray-800">
                            {invoiceNumber ?? "-"}
                        </span>
                    </DialogDescription>
                </DialogHeader>

                <div className="flex justify-center items-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-200 min-h-[150px]">
                    {isLoadingBarcode ? (
                        <div className="flex flex-col items-center text-gray-500">
                            <Loader2 className="h-8 w-8 animate-spin mb-2" />
                            <p>Memuat barcode...</p>
                        </div>
                    ) : error ? (
                        <p className="text-red-500 text-center">{error}</p>
                    ) : barcodeSVG ? (
                        <div
                            dangerouslySetInnerHTML={{ __html: barcodeSVG }}
                            className="w-full h-auto max-w-[80%] flex justify-center items-center"
                        />
                    ) : (
                        <p className="text-gray-500">
                            Tidak ada barcode untuk ditampilkan.
                        </p>
                    )}
                </div>

                <DialogFooter className="mt-4 flex justify-end gap-2">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        className="border-gray-300 text-gray-700 hover:bg-gray-100 rounded-md"
                    >
                        Tutup
                    </Button>
                    {transactionId && (
                        <a
                            href={route(
                                "purchase-transactions.barcode.download",
                                transactionId
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <Button
                                variant="default"
                                className="bg-blue-600 text-white hover:bg-blue-700 rounded-md"
                            >
                                Download Barcode
                            </Button>
                        </a>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
