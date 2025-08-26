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
import { id as localeId } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useEffect, useState, useRef } from "react";

export default function StockInCreate({ auth, products }) {
    const [isProcessingAutofill, setIsProcessingAutofill] = useState(false);
    const prevCodeRef = useRef("");

    const { data, setData, post, processing, errors, reset } = useForm({
        code: "",
        product_id: "",
        quantity: "",
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
            },
            onError: () => {
                toast.error("Gagal menambahkan Stock In");
            },
        });
    };

    // Auto-fill berdasarkan barcode/QR code - untuk product dan quantity
    useEffect(() => {
        if (data.code && data.code !== prevCodeRef.current && data.code.length > 2) {
            prevCodeRef.current = data.code;
            setIsProcessingAutofill(true);
            
            axios
                .get(route("stock-ins.autofill", { code: data.code }))
                .then((response) => {
                    const autofill = response.data;
                    
                    // Update field yang relevan untuk barcode scan
                    setData((prev) => ({
                        ...prev,
                        product_id: autofill.product_id ? String(autofill.product_id) : "",
                        quantity: autofill.quantity ?? "",
                        stockin_date: autofill.stockin_date ?? format(new Date(), "yyyy-MM-dd"),
                        purchase_transaction_id: autofill.purchase_transaction_id ?? "",
                    }));

                    toast.success("Data produk berhasil terisi dari barcode");
                })
                .catch((error) => {
                    const errorMessage = error.response?.data?.message || 
                        "Kode tidak ditemukan dalam sistem";
                    
                    toast.error(errorMessage);
                    
                    // Clear auto-fillable fields tapi keep scanned code
                    setData((prev) => ({
                        ...prev,
                        product_id: "",
                        quantity: "",
                        purchase_transaction_id: "",
                    }));
                })
                .finally(() => {
                    setIsProcessingAutofill(false);
                });
        } else if (data.code === "") {
            prevCodeRef.current = "";
        }
    }, [data.code, setData]);

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
    }, [setData]);

    return (
        <Layout user={auth.user}>
            <Head title="Catat Barang Masuk" />

            <div className="py-6">
                <div className="max-w-3xl mx-auto sm:px-6 lg:px-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Detail Stock Masuk</CardTitle>
                            <CardDescription>
                                Masukkan detail untuk transaksi barang masuk.
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
                                                    value={String(product.id)}
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

                                {/* Stock In Date */}
                                <div>
                                    <Label htmlFor="stockin_date">Tanggal Masuk</Label>
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
                                                          new Date(data.stockin_date),
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
                                                    data.stockin_date
                                                        ? new Date(data.stockin_date)
                                                        : undefined
                                                }
                                                onSelect={(date) =>
                                                    setData(
                                                        "stockin_date",
                                                        format(date, "yyyy-MM-dd")
                                                    )
                                                }
                                                initialFocus
                                                locale={localeId}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <InputError
                                        message={errors.stockin_date}
                                        className="mt-2"
                                    />
                                </div>

                                {/* Source */}
                                <div className="col-span-2">
                                    <Label htmlFor="source">Sumber Stock In</Label>
                                    <Select
                                        onValueChange={(value) =>
                                            setData("source", value)
                                        }
                                        value={data.source || ""}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Pilih sumber stock in" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Purchase Transaction">
                                                Transaksi Pembelian
                                            </SelectItem>
                                            <SelectItem value="Retur">
                                                Retur Barang
                                            </SelectItem>
                                            <SelectItem value="Transfer Masuk">
                                                Transfer Masuk
                                            </SelectItem>
                                            <SelectItem value="Penyesuaian">
                                                Penyesuaian Stok
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

                                {/* Purchase Transaction ID - Optional field */}
                                {data.source === "Purchase Transaction" && (
                                    <div className="col-span-2">
                                        <Label htmlFor="purchase_transaction_id">
                                            ID Transaksi Pembelian (Opsional)
                                        </Label>
                                        <Input
                                            id="purchase_transaction_id"
                                            type="text"
                                            name="purchase_transaction_id"
                                            value={data.purchase_transaction_id}
                                            onChange={(e) =>
                                                setData("purchase_transaction_id", e.target.value)
                                            }
                                            placeholder="Masukkan ID transaksi pembelian jika ada"
                                        />
                                        <InputError
                                            message={errors.purchase_transaction_id}
                                            className="mt-2"
                                        />
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="col-span-2 flex justify-end mt-6 gap-2">
                                    <Link href={route("stock-ins.index")}>
                                        <Button type="button" variant="outline">
                                            Batal
                                        </Button>
                                    </Link>
                                    <Button
                                        disabled={processing}
                                        className="bg-green-800 hover:bg-green-900"
                                    >
                                        Catat Barang Masuk
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