import Layout from "@/Layouts/Layout";
import { Head, Link, useForm } from "@inertiajs/react";
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
import { Html5QrcodeScanner } from "html5-qrcode";
import { useEffect, useState } from "react";

export default function StockInCreate({ auth, products, suppliers }) {
    const [supplierName, setSupplierName] = useState("");
    const [supplierPhone, setSupplierPhone] = useState("");

    const { data, setData, post, processing, errors, reset } = useForm({
        code: "",
        product_id: "",
        quantity: "",
        supplier_id: "",
        stockin_date: format(new Date(), "yyyy-MM-dd"),
        source: "",
        purchase_transaction_id: "",
    });

    const submit = (e) => {
        e.preventDefault();
        post(route("stock-ins.store"), {
            onSuccess: () => {
                toast.success("Stock In berhasil ditambahkan");
                reset();
                setSupplierName("");
                setSupplierPhone("");
            },
            onError: () => {
                toast.error("Gagal menambahkan Stock In");
            },
        });
    };

    // Auto-fill berdasarkan barcode/QR code
    useEffect(() => {
        if (data.code) {
            axios
                .get(route("stock-ins.autofill", { code: data.code }))
                .then((response) => {
                    const autofill = response.data;
                    const foundSupplier = suppliers.find(
                        (s) => s.id === autofill.supplier_id
                    );

                    setData((prev) => ({
                        ...prev,
                        product_id: autofill.product_id
                            ? String(autofill.product_id)
                            : "",
                        supplier_id: autofill.supplier_id
                            ? String(autofill.supplier_id)
                            : "",
                        quantity: autofill.quantity ?? "",
                        stockin_date:
                            autofill.stockin_date ??
                            format(new Date(), "yyyy-MM-dd"),
                        purchase_transaction_id:
                            autofill.purchase_transaction_id ?? "",
                    }));

                    setSupplierName(foundSupplier?.name ?? "");
                    setSupplierPhone(foundSupplier?.phone ?? "");

                    toast.success(
                        "Data berhasil terisi otomatis dari barcode."
                    );
                })
                .catch(() => {
                    toast.error("Kode tidak ditemukan dalam sistem.");
                    setSupplierName("");
                    setSupplierPhone("");
                    setData((prev) => ({
                        ...prev,
                        product_id: "",
                        supplier_id: "",
                        quantity: "",
                        purchase_transaction_id: "",
                    }));
                });
        }
    }, [data.code, suppliers]);

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
        <Layout user={auth.user}>
            <Head title="Record Stock In" />

            <div className="py-6">
                <div className="max-w-3xl mx-auto sm:px-6 lg:px-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Stock In Details</CardTitle>
                            <CardDescription>
                                Enter the details for the incoming stock
                                transaction.
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
                                        Scan Barcode / Input Code
                                    </Label>
                                    <Input
                                        id="code"
                                        type="text"
                                        name="code"
                                        value={data.code}
                                        onChange={(e) =>
                                            setData("code", e.target.value)
                                        }
                                        placeholder="Scan barcode di sini"
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

                                {/* Product */}
                                <div className="col-span-2">
                                    <Label htmlFor="product_id">Product</Label>
                                    <Select
                                        onValueChange={(value) =>
                                            setData("product_id", value)
                                        }
                                        value={data.product_id || ""}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select a product" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {products.map((product) => (
                                                <SelectItem
                                                    key={product.id}
                                                    value={String(product.id)}
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
                                    <Label htmlFor="quantity">Quantity</Label>
                                    <Input
                                        id="quantity"
                                        type="number"
                                        name="quantity"
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

                                {/* Supplier */}
                                <div>
                                    <Label htmlFor="supplier_id">
                                        Supplier
                                    </Label>
                                    <Select
                                        onValueChange={(value) =>
                                            setData("supplier_id", value)
                                        }
                                        value={data.supplier_id || ""}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select a supplier" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {suppliers.map((supplier) => (
                                                <SelectItem
                                                    key={supplier.id}
                                                    value={String(supplier.id)}
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

                                {/* Stock In Date */}
                                <div>
                                    <Label htmlFor="stockin_date">
                                        Stock In Date
                                    </Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className={cn(
                                                    "w-full justify-start text-left font-normal",
                                                    !data.stockin_date &&
                                                        "text-muted-foreground"
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {data.stockin_date
                                                    ? format(
                                                          new Date(
                                                              data.stockin_date
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
                                                    data.stockin_date
                                                        ? new Date(
                                                              data.stockin_date
                                                          )
                                                        : undefined
                                                }
                                                onSelect={(date) =>
                                                    setData(
                                                        "stockin_date",
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
                                        message={errors.stockin_date}
                                        className="mt-2"
                                    />
                                </div>

                                {/* Source */}
                                <div>
                                    <Label htmlFor="source">Sumber</Label>
                                    <Select
                                        onValueChange={(value) =>
                                            setData("source", value)
                                        }
                                        value={data.source || ""}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Pilih sumber" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Purchase Transaction">
                                                Purchase Transaction
                                            </SelectItem>
                                            <SelectItem value="Retur">
                                                Retur
                                            </SelectItem>
                                            <SelectItem value="Penyesuaian">
                                                Penyesuaian
                                            </SelectItem>
                                            <SelectItem value="Lainnya">
                                                Lainnya
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <InputError
                                        message={errors.source}
                                        className="mt-2"
                                    />
                                </div>

                                {/* Actions */}
                                <div className="col-span-2 flex justify-end mt-6 gap-2">
                                    <Link href={route("stock-ins.index")}>
                                        <Button type="button" variant="outline">
                                            Cancel
                                        </Button>
                                    </Link>
                                    <Button
                                        disabled={processing}
                                        className="bg-green-800 hover:bg-green-900"
                                    >
                                        Record Stock In
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
