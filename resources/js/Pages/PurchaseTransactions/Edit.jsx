import Layout from "@/Layouts/Layout";
import { Head, useForm, Link } from "@inertiajs/react";
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
import {
    CalendarIcon,
    InfoIcon,
    Loader2,
    AlertCircle,
    Package,
    User,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/Components/ui/alert";

export default function PurchaseTransactionEdit({
    auth,
    purchaseTransaction,
    products,
    suppliers,
}) {
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [stockInsInfo, setStockInsInfo] = useState(null);

    const { data, setData, put, processing, errors, clearErrors } = useForm({
        invoice_number: purchaseTransaction.invoice_number || "",
        supplier_id: purchaseTransaction.supplier_id
            ? String(purchaseTransaction.supplier_id)
            : "",
        product_id: purchaseTransaction.product_id
            ? String(purchaseTransaction.product_id)
            : "",
        quantity: purchaseTransaction.quantity || "",
        price_per_unit: purchaseTransaction.price_per_unit || "",
        transaction_date: purchaseTransaction.transaction_date
            ? format(
                  new Date(purchaseTransaction.transaction_date),
                  "yyyy-MM-dd"
              )
            : format(new Date(), "yyyy-MM-dd"),
        notes: purchaseTransaction.notes || "",
        status: purchaseTransaction.status || "pending",
    });

    // Calculate stock ins info
    useEffect(() => {
        if (
            purchaseTransaction.stock_ins &&
            purchaseTransaction.stock_ins.length > 0
        ) {
            const totalStockIn = purchaseTransaction.stock_ins.reduce(
                (sum, stockIn) => sum + stockIn.quantity,
                0
            );
            const remainingQuantity =
                purchaseTransaction.quantity - totalStockIn;

            setStockInsInfo({
                total: totalStockIn,
                remaining: remainingQuantity,
                count: purchaseTransaction.stock_ins.length,
                stockIns: purchaseTransaction.stock_ins,
            });
        }
    }, [purchaseTransaction]);

    const submit = (e) => {
        e.preventDefault();

        // Client validation
        if (!data.supplier_id) {
            toast({
                title: "Error",
                description: "Supplier harus dipilih",
                variant: "destructive",
            });
            return;
        }

        if (!data.product_id) {
            toast({
                title: "Error",
                description: "Produk harus dipilih",
                variant: "destructive",
            });
            return;
        }

        if (!data.quantity || parseInt(data.quantity) <= 0) {
            toast({
                title: "Error",
                description: "Jumlah harus lebih dari 0",
                variant: "destructive",
            });
            return;
        }

        if (!data.price_per_unit || parseFloat(data.price_per_unit) <= 0) {
            toast({
                title: "Error",
                description: "Harga per unit harus lebih dari 0",
                variant: "destructive",
            });
            return;
        }

        // Check if new quantity is less than total stock ins
        if (stockInsInfo && parseInt(data.quantity) < stockInsInfo.total) {
            toast({
                title: "Error",
                description: `Jumlah tidak boleh kurang dari total stock in (${stockInsInfo.total})`,
                variant: "destructive",
            });
            return;
        }

        put(route("purchase-transactions.update", purchaseTransaction.id), {
            preserveScroll: true,
            onSuccess: () => {
                toast({
                    title: "Berhasil!",
                    description: "Transaksi pembelian berhasil diupdate",
                    variant: "success",
                });
            },
            onError: (errors) => {
                console.error("Update errors:", errors);

                if (typeof errors === "object" && errors !== null) {
                    Object.entries(errors).forEach(([field, messages]) => {
                        const message = Array.isArray(messages)
                            ? messages[0]
                            : messages;
                        toast({
                            title: `Error pada ${field}`,
                            description: message,
                            variant: "destructive",
                        });
                    });
                } else {
                    toast({
                        title: "Error",
                        description: "Terjadi kesalahan saat mengupdate data",
                        variant: "destructive",
                    });
                }
            },
        });
    };

    // Update selected supplier when supplier_id changes
    useEffect(() => {
        if (data.supplier_id && suppliers) {
            const supplier = suppliers.find((s) => s.id == data.supplier_id);
            setSelectedSupplier(supplier || null);
        } else if (!data.supplier_id) {
            setSelectedSupplier(null);
        }
    }, [data.supplier_id, suppliers]);

    // Update selected product when product_id changes
    useEffect(() => {
        if (data.product_id && products) {
            const product = products.find((p) => p.id == data.product_id);
            setSelectedProduct(product || null);
        } else if (!data.product_id) {
            setSelectedProduct(null);
        }
    }, [data.product_id, products]);

    // Initialize selected supplier and product on mount
    useEffect(() => {
        if (purchaseTransaction.supplier && suppliers) {
            const supplier = suppliers.find(
                (s) => s.id === purchaseTransaction.supplier.id
            );
            setSelectedSupplier(supplier || purchaseTransaction.supplier);
        }

        if (purchaseTransaction.product && products) {
            const product = products.find(
                (p) => p.id === purchaseTransaction.product.id
            );
            setSelectedProduct(product || purchaseTransaction.product);
        }
    }, [purchaseTransaction, suppliers, products]);

    return (
        <Layout user={auth.user}>
            <Head
                title={`Edit Transaksi ${purchaseTransaction.invoice_number}`}
            />

            <div className="py-6">
                <div className="max-w-3xl mx-auto sm:px-6 lg:px-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Package className="h-5 w-5" />
                                Edit Transaksi Pembelian
                            </CardTitle>
                            <CardDescription>
                                Update detail transaksi pembelian{" "}
                                {purchaseTransaction.invoice_number}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {/* Stock In Warning */}
                            {stockInsInfo && stockInsInfo.total > 0 && (
                                <Alert className="mb-6 border-amber-200 bg-amber-50">
                                    <AlertCircle className="h-4 w-4 text-amber-600" />
                                    <AlertDescription className="text-amber-800">
                                        <p className="font-medium">
                                            Sudah ada stock in:{" "}
                                            <span className="text-lg">
                                                {stockInsInfo.total}
                                            </span>{" "}
                                            unit | Sisa:{" "}
                                            <span className="text-lg">
                                                {stockInsInfo.remaining}
                                            </span>{" "}
                                            unit
                                        </p>
                                    </AlertDescription>
                                </Alert>
                            )}

                            <form
                                onSubmit={submit}
                                className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4"
                            >
                                {/* Invoice Number */}
                                <div>
                                    <Label
                                        htmlFor="invoice_number"
                                        className="text-sm font-medium"
                                    >
                                        Nomor Invoice{" "}
                                        <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="invoice_number"
                                        type="text"
                                        name="invoice_number"
                                        value={data.invoice_number}
                                        onChange={(e) => {
                                            setData(
                                                "invoice_number",
                                                e.target.value
                                            );
                                            clearErrors("invoice_number");
                                        }}
                                        placeholder="Masukkan nomor invoice"
                                        className="mt-1"
                                    />
                                    <InputError
                                        message={errors.invoice_number}
                                        className="mt-2"
                                    />
                                </div>

                                {/* Status */}
                                <div>
                                    <Label
                                        htmlFor="status"
                                        className="text-sm font-medium"
                                    >
                                        Status
                                    </Label>
                                    <Select
                                        onValueChange={(value) => {
                                            setData("status", value);
                                            clearErrors("status");
                                        }}
                                        value={data.status || "pending"}
                                    >
                                        <SelectTrigger className="w-full mt-1">
                                            <SelectValue placeholder="Pilih status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="pending">
                                                Pending
                                            </SelectItem>
                                            <SelectItem value="completed">
                                                Completed
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <InputError
                                        message={errors.status}
                                        className="mt-2"
                                    />
                                </div>

                                {/* Supplier Selection */}
                                <div className="col-span-2">
                                    <Label
                                        htmlFor="supplier_id"
                                        className="text-sm font-medium"
                                    >
                                        Supplier{" "}
                                        <span className="text-red-500">*</span>
                                    </Label>
                                    <Select
                                        onValueChange={(value) => {
                                            setData("supplier_id", value);
                                            clearErrors("supplier_id");
                                        }}
                                        value={data.supplier_id || ""}
                                    >
                                        <SelectTrigger className="w-full mt-1">
                                            <SelectValue placeholder="Pilih supplier" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {suppliers &&
                                            suppliers.length > 0 ? (
                                                suppliers.map((supplier) => (
                                                    <SelectItem
                                                        key={supplier.id}
                                                        value={String(
                                                            supplier.id
                                                        )}
                                                    >
                                                        {supplier.name}
                                                    </SelectItem>
                                                ))
                                            ) : (
                                                <SelectItem
                                                    value="no-suppliers"
                                                    disabled
                                                >
                                                    Tidak ada supplier tersedia
                                                </SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <InputError
                                        message={errors.supplier_id}
                                        className="mt-2"
                                    />
                                </div>

                                {/* Supplier Info */}
                                {selectedSupplier && (
                                    <div className="col-span-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                        <div className="flex items-center gap-2 mb-1">
                                            <User className="h-4 w-4 text-blue-600" />
                                            <h4 className="font-medium text-blue-900">
                                                Supplier:{" "}
                                                {selectedSupplier.name}
                                            </h4>
                                        </div>
                                        {selectedSupplier.phone && (
                                            <p className="text-sm text-gray-600">
                                                Kontak: {selectedSupplier.phone}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Product Selection */}
                                <div className="col-span-2">
                                    <Label
                                        htmlFor="product_id"
                                        className="text-sm font-medium"
                                    >
                                        Produk{" "}
                                        <span className="text-red-500">*</span>
                                    </Label>
                                    <Select
                                        onValueChange={(value) => {
                                            setData("product_id", value);
                                            clearErrors("product_id");
                                        }}
                                        value={data.product_id || ""}
                                    >
                                        <SelectTrigger className="w-full mt-1">
                                            <SelectValue placeholder="Pilih produk" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {products && products.length > 0 ? (
                                                products.map((product) => (
                                                    <SelectItem
                                                        key={product.id}
                                                        value={String(
                                                            product.id
                                                        )}
                                                    >
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">
                                                                {product.name}
                                                            </span>
                                                            <span className="text-xs text-gray-500">
                                                                Stok:{" "}
                                                                {product.current_stock ||
                                                                    0}
                                                                {product.sku &&
                                                                    ` | SKU: ${product.sku}`}
                                                            </span>
                                                        </div>
                                                    </SelectItem>
                                                ))
                                            ) : (
                                                <SelectItem
                                                    value="no-products"
                                                    disabled
                                                >
                                                    Tidak ada produk tersedia
                                                </SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <InputError
                                        message={errors.product_id}
                                        className="mt-2"
                                    />
                                </div>

                                {/* Product Info */}
                                {selectedProduct && (
                                    <div className="col-span-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Package className="h-4 w-4 text-green-600" />
                                            <h4 className="font-medium text-green-900">
                                                Produk: {selectedProduct.name}
                                            </h4>
                                        </div>
                                        <p className="text-sm text-gray-600">
                                            Stok:{" "}
                                            {selectedProduct.current_stock || 0}
                                            {selectedProduct.sku &&
                                                ` | SKU: ${selectedProduct.sku}`}
                                        </p>
                                    </div>
                                )}

                                {/* Stock In Summary */}
                                {stockInsInfo &&
                                    stockInsInfo.stockIns &&
                                    stockInsInfo.stockIns.length > 0 && (
                                        <div className="col-span-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                            <div className="flex items-center gap-2 mb-2">
                                                <InfoIcon className="h-4 w-4 text-yellow-600" />
                                                <h4 className="font-medium text-yellow-900">
                                                    Riwayat Stock In (
                                                    {stockInsInfo.count} kali)
                                                </h4>
                                            </div>
                                            <div className="flex justify-between items-center text-sm font-semibold">
                                                <span>
                                                    Total sudah masuk stok:
                                                </span>
                                                <span className="text-lg">
                                                    {stockInsInfo.total} unit
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                {/* Quantity */}
                                <div>
                                    <Label
                                        htmlFor="quantity"
                                        className="text-sm font-medium"
                                    >
                                        Jumlah{" "}
                                        <span className="text-red-500">*</span>
                                        {stockInsInfo &&
                                            stockInsInfo.total > 0 && (
                                                <span className="text-xs text-amber-600 ml-2">
                                                    (Min: {stockInsInfo.total})
                                                </span>
                                            )}
                                    </Label>
                                    <Input
                                        id="quantity"
                                        type="number"
                                        name="quantity"
                                        value={data.quantity}
                                        onChange={(e) => {
                                            setData("quantity", e.target.value);
                                            clearErrors("quantity");
                                        }}
                                        min={
                                            stockInsInfo
                                                ? stockInsInfo.total
                                                : 1
                                        }
                                        step="1"
                                        placeholder="Masukkan jumlah"
                                        className="mt-1"
                                    />
                                    <InputError
                                        message={errors.quantity}
                                        className="mt-2"
                                    />
                                </div>

                                {/* Price Per Unit */}
                                <div>
                                    <Label
                                        htmlFor="price_per_unit"
                                        className="text-sm font-medium"
                                    >
                                        Harga Per Unit{" "}
                                        <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="price_per_unit"
                                        type="number"
                                        name="price_per_unit"
                                        value={data.price_per_unit}
                                        onChange={(e) => {
                                            setData(
                                                "price_per_unit",
                                                e.target.value
                                            );
                                            clearErrors("price_per_unit");
                                        }}
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

                                {/* Transaction Date */}
                                <div className="col-span-2">
                                    <Label className="text-sm font-medium">
                                        Tanggal Transaksi{" "}
                                        <span className="text-red-500">*</span>
                                    </Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className={cn(
                                                    "w-full justify-start text-left font-normal mt-1",
                                                    !data.transaction_date &&
                                                        "text-muted-foreground"
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {data.transaction_date
                                                    ? format(
                                                          new Date(
                                                              data.transaction_date
                                                          ),
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
                                                        ? new Date(
                                                              data.transaction_date
                                                          )
                                                        : undefined
                                                }
                                                onSelect={(date) => {
                                                    if (date) {
                                                        const formattedDate =
                                                            format(
                                                                date,
                                                                "yyyy-MM-dd"
                                                            );
                                                        setData(
                                                            "transaction_date",
                                                            formattedDate
                                                        );
                                                        clearErrors(
                                                            "transaction_date"
                                                        );
                                                    }
                                                }}
                                                initialFocus
                                                locale={localeId}
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

                                {/* Notes */}
                                <div className="col-span-2">
                                    <Label
                                        htmlFor="notes"
                                        className="text-sm font-medium"
                                    >
                                        Catatan (Opsional)
                                    </Label>
                                    <Input
                                        id="notes"
                                        type="text"
                                        name="notes"
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

                                {/* Total Price Preview */}
                                {data.quantity && data.price_per_unit && (
                                    <div className="col-span-2 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-medium text-gray-600">
                                                Total Harga:
                                            </span>
                                            <span className="text-lg font-bold text-gray-900">
                                                Rp{" "}
                                                {(
                                                    parseFloat(
                                                        data.quantity || 0
                                                    ) *
                                                    parseFloat(
                                                        data.price_per_unit || 0
                                                    )
                                                ).toLocaleString("id-ID")}
                                            </span>
                                        </div>
                                        {stockInsInfo && (
                                            <div className="flex justify-between items-center mt-2 pt-2 border-t text-sm">
                                                <span className="text-gray-600">
                                                    Sisa yang belum di-stock in:
                                                </span>
                                                <span className="font-medium">
                                                    {parseInt(
                                                        data.quantity || 0
                                                    ) - stockInsInfo.total}{" "}
                                                    unit
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="col-span-2 flex justify-end mt-6 gap-2 pt-4 border-t">
                                    <Link
                                        href={route(
                                            "purchase-transactions.index"
                                        )}
                                    >
                                        <Button type="button" variant="outline">
                                            Batal
                                        </Button>
                                    </Link>
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="bg-blue-800 hover:bg-blue-900 min-w-[160px]"
                                    >
                                        {processing ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Mengupdate...
                                            </>
                                        ) : (
                                            "Update Transaksi"
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
