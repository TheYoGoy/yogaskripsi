// resources/js/Pages/PurchaseTransactions/Partials/PurchaseTransactionBarcodeModal.jsx

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/Components/ui/dialog";
import { Button } from "@/Components/ui/button";
import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

export default function PurchaseTransactionBarcodeModal({
    isOpen,
    onClose,
    purchaseTransaction,
}) {
    const barcodeRef = useRef(null);

    useEffect(() => {
        if (isOpen && purchaseTransaction) {
            JsBarcode(barcodeRef.current, purchaseTransaction.invoice_number, {
                format: "CODE128",
                width: 2,
                height: 80,
                displayValue: true,
            });
        }
    }, [isOpen, purchaseTransaction]);

    const downloadBarcode = () => {
        const svg = barcodeRef.current;
        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();

        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            const pngFile = canvas.toDataURL("image/png");

            const downloadLink = document.createElement("a");
            downloadLink.href = pngFile;
            downloadLink.download = `${purchaseTransaction.invoice_number}.png`;
            downloadLink.click();
        };

        img.src = "data:image/svg+xml;base64," + btoa(svgData);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Preview Barcode</DialogTitle>
                    <p className="text-sm text-gray-500">
                        Scan barcode ini untuk identifikasi invoice:{" "}
                        <span className="font-semibold">
                            {purchaseTransaction?.invoice_number}
                        </span>
                    </p>
                </DialogHeader>
                <div className="flex justify-center p-4">
                    <svg ref={barcodeRef}></svg>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Tutup
                    </Button>
                    <Button
                        onClick={downloadBarcode}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        Download Barcode
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
