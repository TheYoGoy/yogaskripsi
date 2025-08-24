// resources/js/Components/ProductShow.jsx (atau Pages/Products/ProductShow.jsx)
import React, { useState, useEffect } from "react";
import { Button } from "@/Components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/Components/ui/dialog";
import axios from "axios";
import { Loader2 } from "lucide-react"; // Import ikon loading

// Komponen ProductShow sekarang berfungsi sebagai modal khusus untuk menampilkan barcode.
// Props:
// - isOpen: boolean, mengontrol apakah modal terbuka atau tertutup
// - onOpenChange: function, callback saat status buka/tutup modal berubah
// - productId: number, ID produk untuk mengambil barcode dari backend
// - productCode: string, kode produk untuk ditampilkan di deskripsi modal
export default function ProductShow({
    isOpen,
    onOpenChange,
    productId,
    productCode,
}) {
    const [barcodeSVG, setBarcodeSVG] = useState("");
    const [isLoadingBarcode, setIsLoadingBarcode] = useState(false);
    const [error, setError] = useState(null); // State untuk menangani error

    // useEffect untuk mengambil barcode saat modal dibuka atau productId berubah
    useEffect(() => {
        const fetchBarcode = async () => {
            // Hanya fetch jika modal terbuka dan productId tersedia
            if (!isOpen || !productId) {
                setBarcodeSVG(""); // Bersihkan SVG saat modal tertutup
                setError(null);
                return;
            }

            setIsLoadingBarcode(true);
            setBarcodeSVG(""); // Bersihkan SVG sebelumnya
            setError(null); // Bersihkan error sebelumnya

            try {
                const response = await axios.get(
                    route("products.barcode", productId)
                );
                setBarcodeSVG(response.data.barcode);
            } catch (err) {
                console.error("Gagal mengambil barcode:", err);
                setError("Gagal memuat barcode. Silakan coba lagi.");
                setBarcodeSVG(null); // Pastikan barcodeSVG null jika ada error
            } finally {
                setIsLoadingBarcode(false);
            }
        };

        fetchBarcode();
    }, [isOpen, productId]); // Efek akan berjalan saat isOpen atau productId berubah

    // Tidak ada lagi rendering detail produk di sini, hanya modal
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md p-6 rounded-xl shadow-xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-gray-800">
                        Preview Barcode
                    </DialogTitle>
                    <DialogDescription className="text-gray-600">
                        Scan barcode ini untuk identifikasi produk:{" "}
                        <span className="font-semibold text-gray-800">
                            {productCode}
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
                        // Fallback jika tidak ada barcode dan tidak ada error/loading
                        <p className="text-gray-500">
                            Tidak ada barcode untuk ditampilkan.
                        </p>
                    )}
                </div>
                <DialogFooter className="mt-4 flex justify-end gap-2">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)} // Menggunakan onOpenChange dari props
                        className="border-gray-300 text-gray-700 hover:bg-gray-100 rounded-md"
                    >
                        Tutup
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
