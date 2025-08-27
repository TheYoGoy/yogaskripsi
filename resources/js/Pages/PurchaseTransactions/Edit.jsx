import Layout from "@/Layouts/Layout";
import { Head, useForm } from "@inertiajs/react";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/Components/ui/card";
import InputError from "@/Components/InputError";
import { Calendar } from "@/Components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/Components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

export default function PurchaseTransactionEdit({
    auth,
    products,
    suppliers,
    purchaseTransaction,
}) {
    const [supplierName, setSupplierName] = useState("");
    const [supplierPhone, setSupplierPhone] = useState("");

    const { data, setData, put, processing, errors } = useForm({
        invoice_number: purchaseTransaction.invoice_number || "",
        code: purchaseTransaction.code || "",
        supplier_id: purchaseTransaction.supplier_id?.toString() ?? "",
        product_id: purchaseTransaction.product_id?.toString() ?? "",
        quantity: purchaseTransaction.quantity?.toString() ?? "",
        price_per_unit: purchaseTransaction.price_per_unit?.toString() ?? "",
        transaction_date: purchaseTransaction.transaction_date
            ? format(
                  new Date(purchaseTransaction.transaction_date),
                  "yyyy-MM-dd"
              )
            : format(new Date(), "yyyy-MM-dd"),
        notes: purchaseTransaction.notes ?? "",
    });

    const submit = (e) => {
        e.preventDefault();
        put(route("purchase-transactions.update", purchaseTransaction.id), {
            onSuccess: () => {
                toast.success("Transaksi pembelian berhasil diperbarui!");
            },
            onError: () => {
                toast.error("Gagal memperbarui transaksi pembelian.");
            },
        });
    };

    // Set data supplier awal
    useEffect(() => {
        if (data.supplier_id && suppliers) {
            const foundSupplier = suppliers.find(
                (s) => s.id.toString() === data.supplier_id
            );
            setSupplierName(foundSupplier?.name ?? "");
            setSupplierPhone(foundSupplier?.phone ?? "");
        }
    }, [data.supplier_id, suppliers]);

    // Autofill saat kode berubah
    useEffect(() => {
        if (data.code && data.code !== purchaseTransaction.code) {
            axios
                .get(route("products.searchByCode", { code: data.code }))
                .then((response) => {
                    const product = response.data.product;
                    
                    if (!product) {
                        toast.error("Produk tidak ditemukan");
                        return;
                    }

                    const foundSupplier = suppliers.find(
                        (s) => s.id === product.supplier_id
                    );

                    setData((prevData) => ({
                        ...prevData,
                        product_id: product.id.toString(),
                        supplier_id: product.supplier_id.toString(),
                    }));

                    setSupplierName(foundSupplier?.name ?? "");
                    setSupplierPhone(foundSupplier?.phone ?? "");

                    toast.success(`Produk ${product.name} berhasil dimuat dari barcode`);
                })
                .catch(() => {
                    toast.error("Produk tidak ditemukan untuk barcode ini.");
                });
        }
    }, [data.code, suppliers, purchaseTransaction.code]);

    // Inisialisasi scanner QR
    useEffect(() => {
        const scanner = new Html5QrcodeScanner(
            "reader",
            { fps: 10, qrbox: 250 },
            false
        );

        scanner.render(
            (decodedText) => {
                setData("code", decodedText);
                toast.success(`QR/Barcode terdeteksi: ${decodedText}`);
                scanner.clear();
            },
            (errorMessage) => {
                if (!errorMessage.includes("No MultiFormat Readers") &&
                    !errorMessage.includes("No code found")) {
                    console.log(errorMessage);
                }
            }
        );

        return () => {
            scanner.clear().catch((error) => console.error(error));
        };
    }, [setData]);

    // Handle perubahan supplier
    const handleSupplierChange = (value) => {
        setData("supplier_id", value);
        const foundSupplier = suppliers.find(s => s.id.toString() === value);
        setSupplierName(foundSupplier?.name ?? "");
        setSupplierPhone(foundSupplier?.phone ?? "");
    };

    return (
        <Layout
            user={auth.user}
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Edit Transaksi Pembelian
                </h2>
            }
        >
            <Head title="Edit Transaksi Pembelian" />
            <div className="py-6">
                <div className="max-w-3xl mx-auto sm:px-6 lg:px-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Edit Detail Pembelian</CardTitle>
                            <CardDescription>
                                Perbarui detail transaksi pembelian.
                                <span className="block text-xs text-gray-500 mt-1">
                                    Nomor Invoice: {purchaseTransaction.invoice_number}
                                </span>
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form
                                onSubmit={submit}
                                className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4"
                            >
                                {/* Input/Scan Barcode */}
                                <div className="col-span-2">
                                    <Label htmlFor="code">Scan Barcode / Masukkan Kode</Label>
                                    <Input
                                        id="code"
                                        type="text"
                                        value={data.code}
                                        onChange={(e) =>
                                            setData("code", e.target.value)
                                        }
                                        placeholder="Scan barcode di sini atau ketik manual"
                                        className="mt-1"
                                    />
                                    <InputError
                                        message={errors.code}
                                        className="mt-2"
                                    />
                                </div>

                                {/* QR Scanner */}
                                <div className="col-span-2">
                                    <div className="border rounded-lg p-4 bg-gray-50">
                                        <h3 className="text-sm font-medium mb-2">Pemindai QR/Barcode</h3>
                                        <div
                                            id="reader"
                                            className="rounded border bg-white"
                                        />
                                        <p className="text-xs text-gray-500 mt-2">
                                            Arahkan kamera ke barcode/QR produk
                                        </p>
                                    </div>
                                </div>

                                {/* Supplier */}
                                <div className="col-span-2">
                                    <Label htmlFor="supplier_id" className="text-sm font-medium">
                                        Supplier <span className="text-red-500">*</span>
                                    </Label>
                                    <Select
                                        onValueChange={handleSupplierChange}
                                        value={data.supplier_id}
                                    >
                                        <SelectTrigger className="w-full mt-1">
                                            <SelectValue placeholder="Pilih supplier" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {suppliers.map((supplier) => (
                                                <SelectItem
                                                    key={supplier.id}
                                                    value={supplier.id.toString()}
                                                >
                                                    {supplier.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError
                                        message={errors.supplier_id}
                                        className="mt-2"
                                    />
                                </div>

                                {/* Info Supplier */}
                                {(supplierName || supplierPhone) && (
                                    <div className="col-span-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                        <h4 className="font-medium text-blue-900 mb-2">Informasi Supplier</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                            {supplierName && (
                                                <div>
                                                    <span className="text-gray-600">Nama:</span>
                                                    <span className="ml-2 font-medium">{supplierName}</span>
                                                </div>
                                            )}
                                            {supplierPhone && (
                                                <div>
                                                    <span className="text-gray-600">Telepon:</span>
                                                    <span className="ml-2">{supplierPhone}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Produk */}
                                <div className="col-span-2">
                                    <Label htmlFor="product_id" className="text-sm font-medium">
                                        Produk <span className="text-red-500">*</span>
                                    </Label>
                                    <Select
                                        onValueChange={(value) =>
                                            setData("product_id", value)
                                        }
                                        value={data.product_id}
                                    >
                                        <SelectTrigger className="w-full mt-1">
                                            <SelectValue placeholder="Pilih produk" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {products.map((product) => (
                                                <SelectItem
                                                    key={product.id}
                                                    value={product.id.toString()}
                                                >
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{product.name}</span>
                                                        <span className="text-xs text-gray-500">
                                                            Stok: {product.current_stock || 0}
                                                            {product.sku && ` | SKU: ${product.sku}`}
                                                        </span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError
                                        message={errors.product_id}
                                        className="mt-2"
                                    />
                                </div>

                                {/* Jumlah */}
                                <div>
                                    <Label htmlFor="quantity" className="text-sm font-medium">
                                        Jumlah <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="quantity"
                                        type="number"
                                        value={data.quantity}
                                        onChange={(e) =>
                                            setData("quantity", e.target.value)
                                        }
                                        min="1"
                                        step="1"
                                        placeholder="Masukkan jumlah"
                                        className="mt-1"
                                    />
                                    <InputError
                                        message={errors.quantity}
                                        className="mt-2"
                                    />
                                </div>

                                {/* Harga Per Unit */}
                                <div>
                                    <Label htmlFor="price_per_unit" className="text-sm font-medium">
                                        Harga Per Unit <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="price_per_unit"
                                        type="number"
                                        value={data.price_per_unit}
                                        onChange={(e) =>
                                            setData("price_per_unit", e.target.value)
                                        }
                                        step="0.01"
                                        min="0"
                                        placeholder="Masukkan harga per unit"
                                        className="mt-1"
                                    />
                                    <InputError
                                        message={errors.price_per_unit}
                                        className="mt-2"
                                    />
                                </div>

                                {/* Nomor Invoice */}
                                <div>
                                    <Label htmlFor="invoice_number" className="text-sm font-medium">
                                        Nomor Invoice
                                    </Label>
                                    <Input
                                        id="invoice_number"
                                        type="text"
                                        value={data.invoice_number}
                                        onChange={(e) =>
                                            setData("invoice_number", e.target.value)
                                        }
                                        placeholder="Nomor invoice"
                                        className="mt-1"
                                    />
                                    <InputError
                                        message={errors.invoice_number}
                                        className="mt-2"
                                    />
                                </div>

                                {/* Tanggal Transaksi */}
                                <div>
                                    <Label className="text-sm font-medium">
                                        Tanggal Transaksi <span className="text-red-500">*</span>
                                    </Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className={cn(
                                                    "w-full justify-start text-left font-normal mt-1",
                                                    !data.transaction_date && "text-muted-foreground"
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {data.transaction_date
                                                    ? format(
                                                          new Date(data.transaction_date),
                                                          "PPP"
                                                      )
                                                    : "Pilih tanggal"}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar
                                                mode="single"
                                                selected={
                                                    data.transaction_date
                                                        ? new Date(data.transaction_date)
                                                        : undefined
                                                }
                                                onSelect={(date) => {
                                                    if (date) {
                                                        setData(
                                                            "transaction_date",
                                                            format(date, "yyyy-MM-dd")
                                                        );
                                                    }
                                                }}
                                                initialFocus
                                                disabled={(date) => date > new Date()}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <InputError
                                        message={errors.transaction_date}
                                        className="mt-2"
                                    />
                                </div>

                                {/* Catatan */}
                                <div className="col-span-2">
                                    <Label htmlFor="notes" className="text-sm font-medium">
                                        Catatan (Opsional)
                                    </Label>
                                    <Input
                                        id="notes"
                                        type="text"
                                        value={data.notes}
                                        onChange={(e) =>
                                            setData("notes", e.target.value)
                                        }
                                        placeholder="Tambahkan catatan jika diperlukan"
                                        className="mt-1"
                                    />
                                    <InputError
                                        message={errors.notes}
                                        className="mt-2"
                                    />
                                </div>

                                {/* Preview Total Harga */}
                                {data.quantity && data.price_per_unit && (
                                    <div className="col-span-2 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-medium text-gray-600">Total Harga:</span>
                                            <span className="text-lg font-bold text-gray-900">
                                                Rp {(parseFloat(data.quantity || 0) * parseFloat(data.price_per_unit || 0)).toLocaleString("id-ID")}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Tombol Aksi */}
                                <div className="col-span-2 flex justify-end gap-2 mt-6 pt-4 border-t">
                                    <Button type="button" variant="outline">
                                        Batal
                                    </Button>
                                    <Button type="submit" disabled={processing}>
                                        {processing ? "Memperbarui..." : "Perbarui Transaksi"}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </Layout>
    );
}
