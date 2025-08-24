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
import { CalendarIcon, Loader2 } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useEffect, useState, useRef } from "react";

export default function StockOutCreate({ auth, products, suppliers, flash }) {
    const [productInfo, setProductInfo] = useState(null);
    const [isScanning, setIsScanning] = useState(false);
    const [autofilling, setAutofilling] = useState(false);
    const scannerRef = useRef(null);

    const { data, setData, post, processing, errors, reset, clearErrors } =
        useForm({
            code: "",
            product_id: "",
            quantity: "",
            customer: "",
            transaction_date: format(new Date(), "yyyy-MM-dd"),
            supplier_id: "",
        });

    const submit = (e) => {
        e.preventDefault();

        // Clear previous errors
        clearErrors();

        // Validate required fields on frontend
        if (!data.product_id) {
            toast.error("Product harus dipilih");
            return;
        }
        if (!data.quantity || data.quantity <= 0) {
            toast.error("Quantity harus diisi dan lebih dari 0");
            return;
        }
        if (!data.transaction_date) {
            toast.error("Tanggal transaksi harus diisi");
            return;
        }

        // Check stock availability
        const selectedProduct = products.find(
            (p) => p.id === parseInt(data.product_id)
        );
        if (
            selectedProduct &&
            parseInt(data.quantity) > selectedProduct.current_stock
        ) {
            toast.error(
                `Quantity melebihi stok tersedia (${selectedProduct.current_stock})`
            );
            return;
        }

        // Clean data before submission
        const submitData = { ...data };

        // Remove empty optional fields
        Object.keys(submitData).forEach((key) => {
            if (submitData[key] === "" || submitData[key] === null) {
                if (
                    !["product_id", "quantity", "transaction_date"].includes(
                        key
                    )
                ) {
                    delete submitData[key];
                }
            }
        });

        console.log("Submitting data:", submitData);

        post(route("stock-outs.store"), {
            data: submitData,
            onSuccess: () => {
                toast.success("Stock Out berhasil ditambahkan");
                reset();
                setProductInfo(null);
                // Clear scanner if active
                if (scannerRef.current) {
                    scannerRef.current.clear().catch(console.error);
                }
            },
            onError: (errors) => {
                console.error("Validation errors:", errors);

                // Show specific error messages
                if (typeof errors === "object") {
                    Object.keys(errors).forEach((key) => {
                        const errorMessage = Array.isArray(errors[key])
                            ? errors[key][0]
                            : errors[key];
                        toast.error(`${key}: ${errorMessage}`);
                    });
                } else {
                    toast.error("Gagal menambahkan Stock Out");
                }
            },
        });
    };

    // Auto-fill product using barcode/QR code
    useEffect(() => {
        if (data.code && data.code.length > 2) {
            setAutofilling(true);

            const autofillUrl = `/stock-outs/autofill/${encodeURIComponent(
                data.code
            )}`;

            console.log("Calling autofill for code:", data.code);

            axios
                .get(autofillUrl)
                .then((response) => {
                    const responseData = response.data;
                    console.log("Autofill response:", responseData);

                    setData((prev) => ({
                        ...prev,
                        product_id: String(responseData.product_id),
                        quantity: String(responseData.quantity),
                        transaction_date: responseData.transaction_date,
                    }));

                    // Set product info from response
                    setProductInfo({
                        id: responseData.product_id,
                        name: responseData.product_name,
                        sku: responseData.product_sku,
                        code: responseData.product_code,
                        current_stock: responseData.current_stock,
                        rop: responseData.rop,
                    });

                    toast.success(
                        `Product ${responseData.product_name} berhasil terdeteksi!`
                    );
                })
                .catch((error) => {
                    console.error("Autofill error:", error);

                    if (error.response?.status === 404) {
                        const suggestions = error.response.data?.suggestions;
                        if (
                            suggestions &&
                            Object.keys(suggestions).length > 0
                        ) {
                            toast.error(
                                `Product dengan code "${
                                    data.code
                                }" tidak ditemukan. Mungkin yang dimaksud: ${
                                    Object.keys(suggestions)[0]
                                }?`
                            );
                        } else {
                            toast.error(
                                `Product dengan code "${data.code}" tidak ditemukan`
                            );
                        }
                    } else if (error.response?.status === 400) {
                        toast.error("Format barcode/QR code tidak valid");
                    } else {
                        toast.error(
                            "Terjadi kesalahan saat mengambil data product"
                        );
                    }
                    setProductInfo(null);
                })
                .finally(() => {
                    setAutofilling(false);
                });
        } else if (data.code === "") {
            // Reset product info when code is cleared
            setProductInfo(null);
        }
    }, [data.code]);

    // QR Scanner setup
    useEffect(() => {
        let scanner;

        const startScanner = () => {
            try {
                scanner = new Html5QrcodeScanner(
                    "reader",
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 },
                        aspectRatio: 1.0,
                        showTorchButtonIfSupported: true,
                        showZoomSliderIfSupported: true,
                    },
                    false
                );

                scannerRef.current = scanner;

                scanner.render(
                    (decodedText, decodedResult) => {
                        console.log("QR Code detected:", decodedText);
                        setData("code", decodedText);
                        toast.success(`Barcode detected: ${decodedText}`);

                        // Stop scanning after successful scan
                        scanner.clear().catch(console.error);
                        setIsScanning(false);
                    },
                    (errorMessage) => {
                        // Only log actual errors, not camera permission issues
                        if (
                            !errorMessage.includes("NotFoundError") &&
                            !errorMessage.includes("permission") &&
                            !errorMessage.includes("NotAllowedError")
                        ) {
                            console.log("QR Scanner error:", errorMessage);
                        }
                    }
                );

                setIsScanning(true);
            } catch (error) {
                console.error("QR Scanner initialization error:", error);
                toast.error(
                    "Gagal memulai scanner. Pastikan kamera dapat diakses."
                );
                setIsScanning(false);
            }
        };

        // Auto-start scanner when component mounts
        const timer = setTimeout(startScanner, 1000);

        return () => {
            clearTimeout(timer);
            if (scanner) {
                scanner.clear().catch(console.error);
            }
        };
    }, []);

    // Get selected product info
    const selectedProduct = products.find(
        (p) => p.id === parseInt(data.product_id)
    );
    const displayedProduct = selectedProduct || productInfo;

    // Handle manual product selection
    const handleProductChange = (value) => {
        setData("product_id", value);
        // Clear autofilled product info when manually selecting
        if (productInfo && productInfo.id !== parseInt(value)) {
            setProductInfo(null);
        }
    };

    return (
        <Layout user={auth.user}>
            <Head title="Record Stock Out" />

            <div className="py-6">
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                Stock Out Details
                                {processing && (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                )}
                            </CardTitle>
                            <CardDescription>
                                Scan barcode atau masukkan detail transaksi
                                keluar barang.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {/* Flash Messages */}
                            {flash?.success && (
                                <div className="bg-green-100 border border-green-400 text-green-800 px-4 py-2 rounded mb-6">
                                    ✅ {flash.success}
                                </div>
                            )}

                            {flash?.error && (
                                <div className="bg-red-100 border border-red-400 text-red-800 px-4 py-2 rounded mb-6">
                                    ❌ {flash.error}
                                </div>
                            )}

                            {flash?.warning && (
                                <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded mb-6">
                                    ⚠️ {flash.warning}
                                </div>
                            )}

                            <form
                                onSubmit={submit}
                                className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4"
                            >
                                {/* Code Scanner Section */}
                                <div className="col-span-2">
                                    <Label
                                        htmlFor="code"
                                        className="flex items-center gap-2"
                                    >
                                        Scan Barcode / Input Code
                                        {autofilling && (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        )}
                                    </Label>
                                    <Input
                                        id="code"
                                        type="text"
                                        name="code"
                                        value={data.code}
                                        onChange={(e) =>
                                            setData("code", e.target.value)
                                        }
                                        placeholder="Scan barcode atau masukkan kode product manual"
                                        autoFocus
                                        disabled={autofilling}
                                    />
                                    <InputError
                                        message={errors.code}
                                        className="mt-2"
                                    />

                                    {data.code && (
                                        <div className="mt-2 text-sm text-gray-600">
                                            Searching for:{" "}
                                            <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                                                {data.code}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* QR Scanner */}
                                <div className="col-span-2">
                                    <div className="border rounded-lg p-4 bg-gray-50">
                                        <h4 className="font-medium mb-2 flex items-center gap-2">
                                            QR/Barcode Scanner
                                            {isScanning && (
                                                <span className="text-green-600 text-sm">
                                                    (Active)
                                                </span>
                                            )}
                                        </h4>
                                        <div
                                            id="reader"
                                            className="rounded border bg-white"
                                            style={{ minHeight: "200px" }}
                                        />
                                    </div>
                                </div>

                                {/* Product Selection */}
                                <div className="col-span-2">
                                    <Label htmlFor="product_id">
                                        Product *
                                    </Label>
                                    <Select
                                        onValueChange={handleProductChange}
                                        value={data.product_id}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Pilih product atau scan barcode" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {products
                                                .filter(
                                                    (product) =>
                                                        product.id &&
                                                        product.name
                                                ) // ✅ FIX: Filter invalid products
                                                .map((product) => (
                                                    <SelectItem
                                                        key={product.id}
                                                        value={String(
                                                            product.id
                                                        )}
                                                    >
                                                        {product.name} -{" "}
                                                        {product.sku} (Stock:{" "}
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

                                {/* Product Info Display */}
                                {displayedProduct && (
                                    <div className="col-span-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                        <h4 className="font-semibold text-blue-800 mb-3">
                                            📦 Informasi Produk
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                            <div className="space-y-2">
                                                <div>
                                                    <span className="font-medium text-gray-700">
                                                        Nama:
                                                    </span>
                                                    <div className="text-blue-900 font-medium">
                                                        {displayedProduct.name}
                                                    </div>
                                                </div>
                                                <div>
                                                    <span className="font-medium text-gray-700">
                                                        SKU:
                                                    </span>
                                                    <div className="font-mono text-gray-800">
                                                        {displayedProduct.sku}
                                                    </div>
                                                </div>
                                                {displayedProduct.code && (
                                                    <div>
                                                        <span className="font-medium text-gray-700">
                                                            Kode:
                                                        </span>
                                                        <div className="font-mono text-gray-800">
                                                            {
                                                                displayedProduct.code
                                                            }
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                <div>
                                                    <span className="font-medium text-gray-700">
                                                        Stok Saat Ini:
                                                    </span>
                                                    <div
                                                        className={`inline-block ml-2 px-3 py-1 rounded-full text-sm font-medium ${
                                                            displayedProduct.current_stock >
                                                            10
                                                                ? "bg-green-100 text-green-800"
                                                                : displayedProduct.current_stock >
                                                                  0
                                                                ? "bg-yellow-100 text-yellow-800"
                                                                : "bg-red-100 text-red-800"
                                                        }`}
                                                    >
                                                        {
                                                            displayedProduct.current_stock
                                                        }{" "}
                                                        unit
                                                    </div>
                                                </div>
                                                <div>
                                                    <span className="font-medium text-gray-700">
                                                        ROP (Reorder Point):
                                                    </span>
                                                    <div className="text-gray-800">
                                                        {displayedProduct.rop ||
                                                            0}{" "}
                                                        unit
                                                    </div>
                                                </div>
                                                {displayedProduct.current_stock <=
                                                    (displayedProduct.rop ||
                                                        0) && (
                                                    <div className="bg-red-100 text-red-700 p-2 rounded text-xs">
                                                        ⚠️ Stok sudah mencapai
                                                        atau di bawah ROP!
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Quantity & Customer */}
                                <div>
                                    <Label htmlFor="quantity">Quantity *</Label>
                                    <Input
                                        id="quantity"
                                        type="number"
                                        name="quantity"
                                        value={data.quantity}
                                        onChange={(e) =>
                                            setData("quantity", e.target.value)
                                        }
                                        min="1"
                                        max={
                                            displayedProduct?.current_stock ||
                                            999999
                                        }
                                        required
                                        placeholder="Jumlah barang keluar"
                                    />
                                    <InputError
                                        message={errors.quantity}
                                        className="mt-2"
                                    />
                                    {displayedProduct &&
                                        data.quantity &&
                                        parseInt(data.quantity) >
                                            displayedProduct.current_stock && (
                                            <p className="text-red-500 text-sm mt-1">
                                                ⚠️ Quantity melebihi stok
                                                tersedia (
                                                {displayedProduct.current_stock}
                                                )
                                            </p>
                                        )}
                                </div>

                                <div>
                                    <Label htmlFor="customer">Customer</Label>
                                    <Input
                                        id="customer"
                                        type="text"
                                        name="customer"
                                        value={data.customer}
                                        onChange={(e) =>
                                            setData("customer", e.target.value)
                                        }
                                        placeholder="Nama customer/pelanggan (opsional)"
                                    />
                                    <InputError
                                        message={errors.customer}
                                        className="mt-2"
                                    />
                                </div>

                                {/* Supplier (Optional) */}
                                {suppliers && suppliers.length > 0 && (
                                    <div>
                                        <Label htmlFor="supplier_id">
                                            Supplier
                                        </Label>
                                        <Select
                                            onValueChange={(value) =>
                                                setData(
                                                    "supplier_id",
                                                    value === "none"
                                                        ? ""
                                                        : value
                                                )
                                            }
                                            value={data.supplier_id || "none"}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Pilih supplier (opsional)" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">
                                                    -- Tidak ada --
                                                </SelectItem>
                                                {suppliers
                                                    .filter(
                                                        (supplier) =>
                                                            supplier.id &&
                                                            supplier.name
                                                    ) // ✅ FIX: Filter invalid suppliers
                                                    .map((supplier) => (
                                                        <SelectItem
                                                            key={supplier.id}
                                                            value={String(
                                                                supplier.id
                                                            )}
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
                                )}

                                {/* Transaction Date */}
                                <div
                                    className={
                                        suppliers && suppliers.length > 0
                                            ? ""
                                            : "md:col-span-1"
                                    }
                                >
                                    <Label htmlFor="transaction_date">
                                        Tanggal Transaksi *
                                    </Label>
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
                                                {data.transaction_date ? (
                                                    format(
                                                        new Date(
                                                            data.transaction_date
                                                        ),
                                                        "dd/MM/yyyy"
                                                    )
                                                ) : (
                                                    <span>Pilih tanggal</span>
                                                )}
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
                                                disabled={(date) =>
                                                    date > new Date()
                                                }
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <InputError
                                        message={errors.transaction_date}
                                        className="mt-2"
                                    />
                                </div>

                                {/* Stock Calculation Preview */}
                                {displayedProduct &&
                                    data.quantity &&
                                    parseInt(data.quantity) > 0 && (
                                        <div className="col-span-2 p-4 bg-gray-50 rounded-lg border">
                                            <h4 className="font-semibold text-gray-800 mb-3">
                                                📊 Preview Stok Setelah
                                                Transaksi
                                            </h4>
                                            <div className="grid grid-cols-3 gap-4 text-center">
                                                <div className="bg-blue-100 p-3 rounded">
                                                    <div className="text-sm font-medium text-blue-700">
                                                        Stok Saat Ini
                                                    </div>
                                                    <div className="text-2xl font-bold text-blue-600">
                                                        {
                                                            displayedProduct.current_stock
                                                        }
                                                    </div>
                                                </div>
                                                <div className="bg-red-100 p-3 rounded">
                                                    <div className="text-sm font-medium text-red-700">
                                                        Akan Keluar
                                                    </div>
                                                    <div className="text-2xl font-bold text-red-600">
                                                        -{data.quantity}
                                                    </div>
                                                </div>
                                                <div className="bg-green-100 p-3 rounded">
                                                    <div className="text-sm font-medium text-green-700">
                                                        Stok Tersisa
                                                    </div>
                                                    <div
                                                        className={`text-2xl font-bold ${
                                                            displayedProduct.current_stock -
                                                                parseInt(
                                                                    data.quantity
                                                                ) <
                                                            (displayedProduct.rop ||
                                                                0)
                                                                ? "text-red-600"
                                                                : "text-green-600"
                                                        }`}
                                                    >
                                                        {displayedProduct.current_stock -
                                                            parseInt(
                                                                data.quantity
                                                            )}
                                                    </div>
                                                    {displayedProduct.current_stock -
                                                        parseInt(
                                                            data.quantity
                                                        ) <
                                                        (displayedProduct.rop ||
                                                            0) && (
                                                        <div className="text-xs text-red-600 mt-1">
                                                            ⚠️ Di bawah ROP (
                                                            {displayedProduct.rop ||
                                                                0}
                                                            )
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                {/* Action Buttons */}
                                <div className="col-span-2 flex justify-end mt-6 gap-3">
                                    <Link href={route("stock-outs.index")}>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            disabled={processing}
                                        >
                                            Batal
                                        </Button>
                                    </Link>
                                    <Button
                                        type="submit"
                                        disabled={
                                            processing ||
                                            !data.product_id ||
                                            !data.quantity ||
                                            !data.transaction_date ||
                                            (displayedProduct &&
                                                parseInt(data.quantity) >
                                                    displayedProduct.current_stock)
                                        }
                                        className="bg-red-600 hover:bg-red-700"
                                    >
                                        {processing ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            "Catat Stock Out"
                                        )}
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
