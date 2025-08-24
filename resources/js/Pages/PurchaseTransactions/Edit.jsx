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
        invoice_number: purchaseTransaction.invoice_number,
        code: "",
        supplier_id: purchaseTransaction.supplier_id?.toString() ?? "",
        product_id: purchaseTransaction.product_id?.toString() ?? "",
        quantity: purchaseTransaction.quantity ?? "",
        price_per_unit: purchaseTransaction.price_per_unit ?? "",
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
                toast.success("Purchase transaction updated successfully!");
            },
        });
    };

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
                scanner.clear();
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
                    Edit Purchase Transaction
                </h2>
            }
        >
            <Head title="Edit Purchase Transaction" />
            <div className="py-6">
                <div className="max-w-3xl mx-auto sm:px-6 lg:px-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Edit Details</CardTitle>
                            <CardDescription>
                                Update your purchase transaction.
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

                                {/* Submit */}
                                <div className="col-span-2 flex justify-end gap-2 mt-4">
                                    <Button type="submit" disabled={processing}>
                                        Update Purchase
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
