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
    const [scannerStarted, setScannerStarted] = useState(false);
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
                toast.success("Purchase transaction recorded successfully!");
                setBarcodeInvoice(data.invoice_number);
                generateBarcode(data.invoice_number);
                reset();
                setSupplierName("");
                setSupplierPhone("");
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

    // 📌 SCAN BARCODE TO FETCH PRODUCT AND SUPPLIER DATA
    useEffect(() => {
        if (data.code) {
            axios
                .get(route("products.searchByCode", { code: data.code }))
                .then((response) => {
                    const product = response.data.product;
                    const foundSupplier = suppliers.find(
                        (s) => s.id === product.supplier_id
                    );

                    if (!product) {
                        toast.error("Product not found");
                        return;
                    }

                    setData((prevData) => ({
                        ...prevData,
                        product_id: product.id.toString(),
                        supplier_id: product.supplier_id.toString(),
                    }));

                    setSupplierName(foundSupplier?.name ?? "");
                    setSupplierPhone(foundSupplier?.phone ?? "");

                    toast.success(
                        `Product ${product.name} loaded from barcode`
                    );
                })
                .catch(() => {
                    toast.error("Product not found for this barcode.");
                    setSupplierName("");
                    setSupplierPhone("");
                    setData((prevData) => ({
                        ...prevData,
                        product_id: "",
                        supplier_id: "",
                    }));
                });
        }
    }, [data.code, suppliers]);

    useEffect(() => {
        const scanner = new Html5QrcodeScanner(
            "reader",
            { fps: 10, qrbox: 250 },
            false
        );

        scanner.render(
            (decodedText) => {
                setData("code", decodedText);
                toast.success(`QR/Barcode detected: ${decodedText}`);
                scanner.clear(); // Stop scanning setelah berhasil
            },
            (errorMessage) => {
                console.log(errorMessage);
            }
        );

        return () => {
            scanner.clear().catch((error) => console.error(error));
        };
    }, []);

    return (
        <Layout
            user={auth.user}
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Record Purchase Transaction
                </h2>
            }
        >
            <Head title="Record Purchase Transaction" />
            <div className="py-6">
                <div className="max-w-3xl mx-auto sm:px-6 lg:px-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Purchase Details</CardTitle>
                            <CardDescription>
                                Manage your purchase transactions.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form
                                onSubmit={submit}
                                className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4"
                            >
                                {/* Scan Barcode */}
                                <div className="col-span-2">
                                    <Label>Scan Barcode / Input Code</Label>
                                    <Input
                                        type="text"
                                        value={data.code}
                                        onChange={(e) =>
                                            setData("code", e.target.value)
                                        }
                                        placeholder="Scan barcode here"
                                        autoFocus
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
                                    <Label>Supplier</Label>
                                    <Select
                                        onValueChange={(value) =>
                                            setData("supplier_id", value)
                                        }
                                        value={data.supplier_id}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select a supplier" />
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

                                {/* Supplier Name (Auto) */}
                                {supplierName && (
                                    <div>
                                        <Label>Supplier Name (Auto)</Label>
                                        <Input
                                            value={supplierName}
                                            readOnly
                                            className="bg-gray-100 cursor-not-allowed"
                                        />
                                    </div>
                                )}

                                {/* Supplier Phone (Auto) */}
                                {supplierPhone && (
                                    <div>
                                        <Label>Supplier Phone (Auto)</Label>
                                        <Input
                                            value={supplierPhone}
                                            readOnly
                                            className="bg-gray-100 cursor-not-allowed"
                                        />
                                    </div>
                                )}

                                {/* Product */}
                                <div className="col-span-2">
                                    <Label>Product</Label>
                                    <Select
                                        onValueChange={(value) =>
                                            setData("product_id", value)
                                        }
                                        value={data.product_id}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select a product" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {products.map((product) => (
                                                <SelectItem
                                                    key={product.id}
                                                    value={product.id.toString()}
                                                >
                                                    {product.name} (Stock:{" "}
                                                    {product.current_stock})
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
                                    <Label>Quantity</Label>
                                    <Input
                                        type="number"
                                        value={data.quantity}
                                        onChange={(e) =>
                                            setData("quantity", e.target.value)
                                        }
                                        min="1"
                                    />
                                    <InputError
                                        message={errors.quantity}
                                        className="mt-2"
                                    />
                                </div>

                                {/* Invoice */}
                                <div>
                                    <Label>Invoice Number</Label>
                                    <Input
                                        type="text"
                                        value={data.invoice_number}
                                        readOnly
                                        className="bg-gray-100 cursor-not-allowed"
                                    />
                                    <InputError
                                        message={errors.invoice_number}
                                        className="mt-2"
                                    />
                                </div>

                                {/* Price Per Unit */}
                                <div>
                                    <Label>Price Per Unit</Label>
                                    <Input
                                        type="number"
                                        value={data.price_per_unit}
                                        onChange={(e) =>
                                            setData(
                                                "price_per_unit",
                                                e.target.value
                                            )
                                        }
                                        step="0.01"
                                        min="0"
                                    />
                                    <InputError
                                        message={errors.price_per_unit}
                                        className="mt-2"
                                    />
                                </div>

                                {/* Transaction Date */}
                                <div>
                                    <Label>Transaction Date</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className="w-full justify-start text-left font-normal"
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {data.transaction_date
                                                    ? format(
                                                          new Date(
                                                              data.transaction_date
                                                          ),
                                                          "PPP"
                                                      )
                                                    : "Pick a date"}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar
                                                mode="single"
                                                selected={
                                                    data.transaction_date
                                                        ? new Date(
                                                              data.transaction_date
                                                          )
                                                        : undefined
                                                }
                                                onSelect={(date) =>
                                                    setData(
                                                        "transaction_date",
                                                        format(
                                                            date,
                                                            "yyyy-MM-dd"
                                                        )
                                                    )
                                                }
                                                initialFocus
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
                                    <Label>Notes (Optional)</Label>
                                    <Input
                                        type="text"
                                        value={data.notes}
                                        onChange={(e) =>
                                            setData("notes", e.target.value)
                                        }
                                    />
                                    <InputError
                                        message={errors.notes}
                                        className="mt-2"
                                    />
                                </div>

                                {/* Submit Button */}
                                <div className="col-span-2 flex justify-end gap-2 mt-4">
                                    <Button type="submit" disabled={processing}>
                                        Record Purchase
                                    </Button>
                                </div>
                            </form>

                            {/* Barcode & Print */}
                            {barcodeInvoice && (
                                <div className="flex flex-col items-center mt-6 p-4 border rounded-md bg-gray-50">
                                    <p className="text-sm mb-2">
                                        Barcode for Invoice:{" "}
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
