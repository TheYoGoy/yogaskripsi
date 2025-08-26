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
import { id as localeId } from "date-fns/locale";
import { CalendarIcon, InfoIcon } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { useEffect, useState, useRef } from "react";
import JsBarcode from "jsbarcode";
import { Html5QrcodeScanner } from "html5-qrcode";

export default function PurchaseTransactionCreate({
    auth,
    products,
    suppliers,
}) {
    const [barcodeInvoice, setBarcodeInvoice] = useState("");
    const [supplierName, setSupplierName] = useState("");
    const [supplierPhone, setSupplierPhone] = useState("");
    const [isProcessingAutofill, setIsProcessingAutofill] = useState(false);
    const prevCodeRef = useRef("");

    const { data, setData, post, processing, errors, reset } = useForm({
        invoice_number: `INV-${format(new Date(), "yyyyMMdd")}-${Math.floor(
            Math.random() * 9000 + 1000
        )}`,
        code: "",
        supplier_id: "",
        product_id: "",
        quantity: "",
        price_per_unit: "",
        transaction_date: format(new Date(), "yyyy-MM-dd"),
        notes: "",
    });

    const submit = (e) => {
        e.preventDefault();
        post(route("purchase-transactions.store"), {
            onSuccess: () => {
                toast.success("Transaksi pembelian berhasil dicatat!");
                setBarcodeInvoice(data.invoice_number);
                generateBarcode(data.invoice_number);
                reset();
                setSupplierName("");
                setSupplierPhone("");
            },
            onError: () => {
                toast.error("Gagal mencatat transaksi pembelian");
            },
        });
    };

    const generateBarcode = (invoice) => {
        const svg = document.getElementById("invoiceBarcode");
        if (svg) {
            JsBarcode(svg, invoice, {
                format: "CODE128",
                lineColor: "#000",
                width: 2,
                height: 60,
                displayValue: true,
            });
        }
    };

    // Auto-fill berdasarkan barcode/QR code
    useEffect(() => {
        if (data.code && data.code !== prevCodeRef.current && data.code.length > 2) {
            prevCodeRef.current = data.code;
            setIsProcessingAutofill(true);
            
            axios
                .get(route("products.searchByCode", { code: data.code }))
                .then((response) => {
                    const product = response.data.product;
                    const foundSupplier = suppliers.find(
                        (s) => s.id === product.supplier_id
                    );

                    if (!product) {
                        toast.error("Produk tidak ditemukan");
                        return;
                    }

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
                    toast.error("Produk tidak ditemukan untuk barcode ini");
                    setSupplierName("");
                    setSupplierPhone("");
                    setData((prevData) => ({
                        ...prevData,
                        product_id: "",
                        supplier_id: "",
                    }));
                })
                .finally(() => {
                    setIsProcessingAutofill(false);
                });
        } else if (data.code === "") {
            prevCodeRef.current = "";
        }
    }, [data.code, suppliers, setData]);

    // QR Scanner
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
                console.log(errorMessage);
            }
        );

        return () => {
            scanner.clear().catch((error) => console.error(error));
        };
    }, [setData]);

    // Get selected supplier info for display
    const selectedSupplier = suppliers.find(s => s.id == data.supplier_id);

    return (
        <Layout
            user={auth.user}
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Catat Transaksi Pembelian
                </h2>
            }
        >
            <Head title="Catat Transaksi Pembelian" />
            <div className="py-6">
                <div className="max-w-3xl mx-auto sm:px-6 lg:px-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Detail Pembelian</CardTitle>
                            <CardDescription>
                                Kelola transaksi pembelian barang dari supplier.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form
                                onSubmit={submit}
                                className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4"
                            >
                                {/* Code Scanner */}
                                <div className="col-span-2">
                                    <Label htmlFor="code">
                                        Pindai Barcode / Input Kode
                                        {isProcessingAutofill && (
                                            <span className="ml-2 text-sm text-blue-600">
                                                (Memproses...)
                                            </span>
                                        )}
                                    </Label>
                                    <Input
                                        id="code"
                                        type="text"
                                        name="code"
                                        value={data.code}
                                        onChange={(e) => setData("code", e.target.value)}
                                        placeholder="Pindai barcode di sini"
                                        autoFocus
                                        disabled={isProcessingAutofill}
                                    />
                                    <InputError
                                        message={errors.code}
                                        className="mt-2"
                                    />
                                </div>

                                {/* QR Scanner */}
                                <div
                                    id="reader"
                                    className="col-span-2 my-4 rounded border p-2"
                                />

                                {/* Supplier */}
                                <div className="col-span-2">
                                    <Label htmlFor="supplier_id">Supplier</Label>
                                    <Select
                                        onValueChange={(value) => {
                                            setData("supplier_id", value);
                                            const supplier = suppliers.find(s => s.id == value);
                                            setSupplierName(supplier?.name ?? "");
                                            setSupplierPhone(supplier?.phone ?? "");
                                        }}
                                        value={data.supplier_id || ""}
                                    >
                                        <SelectTrigger className="w-full">
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

                                {/* Supplier Info Display */}
                                {selectedSupplier && (
                                    <div className="col-span-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            <InfoIcon className="h-4 w-4 text-blue-600" />
                                            <h4 className="font-medium text-blue-900">Informasi Supplier</h4>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                            <div>
                                                <span className="text-gray-600">Nama:</span>
                                                <span className="ml-2 font-medium">{selectedSupplier.name}</span>
                                            </div>
                                            {selectedSupplier.phone && (
                                                <div>
                                                    <span className="text-gray-600">Kontak:</span>
                                                    <span className="ml-2">{selectedSupplier.phone}</span>
                                                </div>
                                            )}
                                            {selectedSupplier.address && (
                                                <div className="col-span-2">
                                                    <span className="text-gray-600">Alamat:</span>
                                                    <span className="ml-2">{selectedSupplier.address}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Product */}
                                <div className="col-span-2">
                                    <Label htmlFor="product_id">Produk</Label>
                                    <Select
                                        onValueChange={(value) =>
                                            setData("product_id", value)
                                        }
                                        value={data.product_id || ""}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Pilih produk" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {products.map((product) => (
                                                <SelectItem
                                                    key={product.id}
                                                    value={product.id.toString()}
                                                >
                                                    {product.name} (Stok: {product.current_stock})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError
                                        message={errors.product_id}
                                        className="mt-2"
                                    />
                                </div>

                                {/* Quantity */}
                                <div>
                                    <Label htmlFor="quantity">Jumlah</Label>
                                    <Input
                                        id="quantity"
                                        type="number"
                                        name="quantity"
                                        value={data.quantity}
                                        onChange={(e) =>
                                            setData("quantity", e.target.value)
                                        }
                                        min="1"
                                        placeholder="Masukkan jumlah"
                                    />
                                    <InputError
                                        message={errors.quantity}
                                        className="mt-2"
                                    />
                                </div>

                                {/* Price Per Unit */}
                                <div>
                                    <Label htmlFor="price_per_unit">Harga Per Unit</Label>
                                    <Input
                                        id="price_per_unit"
                                        type="number"
                                        name="price_per_unit"
                                        value={data.price_per_unit}
                                        onChange={(e) =>
                                            setData("price_per_unit", e.target.value)
                                        }
                                        step="0.01"
                                        min="0"
                                        placeholder="Masukkan harga per unit"
                                    />
                                    <InputError
                                        message={errors.price_per_unit}
                                        className="mt-2"
                                    />
                                </div>

                                {/* Invoice Number */}
                                <div>
                                    <Label htmlFor="invoice_number">Nomor Invoice</Label>
                                    <Input
                                        id="invoice_number"
                                        type="text"
                                        name="invoice_number"
                                        value={data.invoice_number}
                                        readOnly
                                        className="bg-gray-100 cursor-not-allowed"
                                    />
                                    <InputError
                                        message={errors.invoice_number}
                                        className="mt-2"
                                    />
                                </div>

                                {/* Transaction Date */}
                                <div>
                                    <Label htmlFor="transaction_date">Tanggal Transaksi</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className={cn(
                                                    "w-full justify-start text-left font-normal",
                                                    !data.transaction_date &&
                                                        "text-muted-foreground"
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {data.transaction_date
                                                    ? format(
                                                          new Date(data.transaction_date),
                                                          "dd MMMM yyyy",
                                                          { locale: localeId }
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
                                                onSelect={(date) =>
                                                    setData(
                                                        "transaction_date",
                                                        format(date, "yyyy-MM-dd")
                                                    )
                                                }
                                                initialFocus
                                                locale={localeId}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <InputError
                                        message={errors.transaction_date}
                                        className="mt-2"
                                    />
                                </div>

                                {/* Notes */}
                                <div className="col-span-2">
                                    <Label htmlFor="notes">Catatan (Opsional)</Label>
                                    <Input
                                        id="notes"
                                        type="text"
                                        name="notes"
                                        value={data.notes}
                                        onChange={(e) =>
                                            setData("notes", e.target.value)
                                        }
                                        placeholder="Tambahkan catatan jika diperlukan"
                                    />
                                    <InputError
                                        message={errors.notes}
                                        className="mt-2"
                                    />
                                </div>

                                {/* Actions */}
                                <div className="col-span-2 flex justify-end gap-2 mt-4">
                                    <Button 
                                        type="submit" 
                                        disabled={processing}
                                        className="bg-blue-800 hover:bg-blue-900"
                                    >
                                        Catat Pembelian
                                    </Button>
                                </div>
                            </form>

                            {/* Barcode & Print */}
                            {barcodeInvoice && (
                                <div className="flex flex-col items-center mt-6 p-4 border rounded-md bg-gray-50">
                                    <p className="text-sm mb-2">
                                        Barcode untuk Invoice:{" "}
                                        <strong>{barcodeInvoice}</strong>
                                    </p>
                                    <svg id="invoiceBarcode"></svg>
                                    <Button
                                        variant="outline"
                                        className="mt-4"
                                        onClick={() => window.print()}
                                    >
                                        Cetak Barcode
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </Layout>
    );
}