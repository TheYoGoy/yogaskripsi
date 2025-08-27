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
import { CalendarIcon, InfoIcon, Loader2, QrCode, Camera } from "lucide-react";
import axios from "axios";
import { toast } from "@/hooks/use-toast";
import { useEffect, useState, useRef } from "react";

let Html5QrcodeScanner = null;

// Dynamically import QR Scanner
const initializeQrScanner = async () => {
    try {
        const module = await import("html5-qrcode");
        Html5QrcodeScanner = module.Html5QrcodeScanner;
        return true;
    } catch (error) {
        console.error("Failed to load QR scanner library:", error);
        return false;
    }
};

export default function PurchaseTransactionCreate({ auth, products, suppliers }) {
    const [isProcessingAutofill, setIsProcessingAutofill] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isScannerReady, setIsScannerReady] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const prevCodeRef = useRef("");
    const scannerRef = useRef(null);
    const qrScannerInitialized = useRef(false);

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        invoice_number: `INV-${format(new Date(), "yyMM")}-${String(Math.floor(Math.random() * 900) + 100).padStart(3, '0')}`,
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

        // Clear scanner before submit
        if (scannerRef.current) {
            scannerRef.current.clear().catch(console.error);
        }

        post(route("purchase-transactions.store"), {
            preserveScroll: true,
            onSuccess: () => {
                toast({
                    title: "Berhasil!",
                    description: "Transaksi pembelian berhasil dicatat",
                    variant: "success",
                });
                
                // Reset form and states
                reset();
                setSelectedSupplier(null);
                setSelectedProduct(null);
                setShowScanner(false);
                
                // Reset scanner
                if (scannerRef.current) {
                    scannerRef.current.clear().catch(console.error);
                    scannerRef.current = null;
                    qrScannerInitialized.current = false;
                }
            },
            onError: (errors) => {
                console.error('Submit errors:', errors);
                
                if (typeof errors === 'object' && errors !== null) {
                    Object.entries(errors).forEach(([field, messages]) => {
                        const message = Array.isArray(messages) ? messages[0] : messages;
                        toast({
                            title: `Error pada ${field}`,
                            description: message,
                            variant: "destructive",
                        });
                    });
                } else {
                    toast({
                        title: "Error",
                        description: "Terjadi kesalahan saat menyimpan data",
                        variant: "destructive",
                    });
                }
            }
        });
    };

    // Auto-fill dengan debouncing
    useEffect(() => {
        if (!data.code || data.code === prevCodeRef.current || data.code.length < 3) {
            if (data.code === "") {
                prevCodeRef.current = "";
                setSelectedProduct(null);
                setSelectedSupplier(null);
            }
            return;
        }

        const timeoutId = setTimeout(() => {
            if (data.code === prevCodeRef.current) return;
            
            prevCodeRef.current = data.code;
            setIsProcessingAutofill(true);
            
            axios.get(route("products.searchByCode", { code: data.code }))
                .then((response) => {
                    const product = response.data.product;
                    
                    if (!product) {
                        toast({
                            title: "Info",
                            description: "Produk tidak ditemukan untuk kode ini",
                            variant: "default",
                        });
                        return;
                    }

                    // Update form data
                    setData((prev) => ({
                        ...prev,
                        product_id: String(product.id),
                        supplier_id: String(product.supplier_id),
                    }));

                    // Update selected product and supplier
                    setSelectedProduct(product);
                    const supplier = suppliers.find(s => s.id === product.supplier_id);
                    setSelectedSupplier(supplier || null);

                    toast({
                        title: "Berhasil",
                        description: `Produk ${product.name} berhasil dimuat dari barcode`,
                        variant: "success",
                    });
                })
                .catch((error) => {
                    console.error('Autofill error:', error);
                    const errorMessage = error.response?.data?.message || "Produk tidak ditemukan";
                    
                    toast({
                        title: "Info",
                        description: errorMessage,
                        variant: "default",
                    });
                    
                    // Reset selections
                    setSelectedProduct(null);
                    setSelectedSupplier(null);
                })
                .finally(() => {
                    setIsProcessingAutofill(false);
                });
        }, 800);

        return () => clearTimeout(timeoutId);
    }, [data.code, setData, suppliers]);

    // Update selected supplier when supplier_id changes
    useEffect(() => {
        if (data.supplier_id && suppliers) {
            const supplier = suppliers.find(s => s.id == data.supplier_id);
            setSelectedSupplier(supplier || null);
        } else if (!data.supplier_id) {
            setSelectedSupplier(null);
        }
    }, [data.supplier_id, suppliers]);

    // Update selected product when product_id changes
    useEffect(() => {
        if (data.product_id && products) {
            const product = products.find(p => p.id == data.product_id);
            setSelectedProduct(product || null);
            
            // Auto set supplier if not set
            if (product && product.supplier_id && !data.supplier_id) {
                setData('supplier_id', String(product.supplier_id));
            }
        } else if (!data.product_id) {
            setSelectedProduct(null);
        }
    }, [data.product_id, products]);

    // Initialize QR Scanner library
    useEffect(() => {
        initializeQrScanner().then(success => {
            setIsScannerReady(success);
        });
    }, []);

    // QR Scanner setup
    const setupScanner = async () => {
        if (!isScannerReady || !Html5QrcodeScanner || scannerRef.current) return;

        try {
            const scanner = new Html5QrcodeScanner(
                "qr-reader",
                { 
                    fps: 10, 
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0
                },
                false
            );

            scannerRef.current = scanner;
            qrScannerInitialized.current = true;

            await scanner.render(
                (decodedText) => {
                    console.log('QR Code detected:', decodedText);
                    setData("code", decodedText.trim());
                    
                    toast({
                        title: "Berhasil",
                        description: `QR/Barcode terdeteksi: ${decodedText}`,
                        variant: "success",
                    });

                    // Stop scanner after successful scan
                    scanner.clear().catch(console.error);
                    scannerRef.current = null;
                    qrScannerInitialized.current = false;
                    setShowScanner(false);
                },
                (errorMessage) => {
                    // Suppress frequent errors
                    if (!errorMessage.includes('No MultiFormat Readers') && 
                        !errorMessage.includes('No code found') &&
                        !errorMessage.includes('NotFoundException')) {
                        console.log('QR Scanner error:', errorMessage);
                    }
                }
            );
        } catch (error) {
            console.error('Failed to initialize QR scanner:', error);
            toast({
                title: "Error",
                description: "Gagal menginisialisasi scanner",
                variant: "destructive",
            });
            setShowScanner(false);
        }
    };

    // Start scanner when showScanner becomes true
    useEffect(() => {
        if (showScanner && !qrScannerInitialized.current) {
            setupScanner();
        }
        
        return () => {
            if (scannerRef.current && !showScanner) {
                scannerRef.current.clear().catch(console.error);
                scannerRef.current = null;
                qrScannerInitialized.current = false;
            }
        };
    }, [showScanner, isScannerReady]);

    const handleToggleScanner = () => {
        if (showScanner) {
            // Stop scanner
            if (scannerRef.current) {
                scannerRef.current.clear().catch(console.error);
                scannerRef.current = null;
                qrScannerInitialized.current = false;
            }
            setShowScanner(false);
        } else {
            // Start scanner
            if (isScannerReady) {
                setShowScanner(true);
            } else {
                toast({
                    title: "Error",
                    description: "Scanner belum siap, silakan coba lagi",
                    variant: "destructive",
                });
            }
        }
    };

    return (
        <Layout user={auth.user}>
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
                            <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                                {/* Code Scanner */}
                                <div className="col-span-2">
                                    <div className="flex items-center justify-between mb-2">
                                        <Label htmlFor="code">
                                            Pindai Barcode / Input Kode
                                            {isProcessingAutofill && (
                                                <span className="ml-2 text-sm text-blue-600 flex items-center gap-1">
                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                    Memproses...
                                                </span>
                                            )}
                                        </Label>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={handleToggleScanner}
                                            disabled={!isScannerReady}
                                            className="flex items-center gap-2"
                                        >
                                            {showScanner ? <Camera className="h-4 w-4" /> : <QrCode className="h-4 w-4" />}
                                            {showScanner ? "Tutup Scanner" : "Buka Scanner"}
                                        </Button>
                                    </div>
                                    <Input
                                        id="code"
                                        type="text"
                                        name="code"
                                        value={data.code}
                                        onChange={(e) => setData("code", e.target.value)}
                                        placeholder="Pindai barcode di sini atau ketik manual"
                                        autoFocus
                                        disabled={isProcessingAutofill}
                                        className="mt-1"
                                    />
                                    <InputError message={errors.code} className="mt-2" />
                                </div>

                                {/* QR Scanner */}
                                {showScanner && (
                                    <div className="col-span-2">
                                        <div className="border rounded-lg p-4 bg-gray-50">
                                            <h3 className="text-sm font-medium mb-2">Scanner QR/Barcode</h3>
                                            <div id="qr-reader" className="rounded border bg-white" />
                                            <p className="text-xs text-gray-500 mt-2">
                                                Arahkan kamera ke barcode/QR code produk
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Supplier Selection */}
                                <div className="col-span-2">
                                    <Label htmlFor="supplier_id" className="text-sm font-medium">
                                        Supplier <span className="text-red-500">*</span>
                                    </Label>
                                    <Select
                                        onValueChange={(value) => {
                                            setData("supplier_id", value);
                                            clearErrors('supplier_id');
                                        }}
                                        value={data.supplier_id || ""}
                                    >
                                        <SelectTrigger className="w-full mt-1">
                                            <SelectValue placeholder="Pilih supplier" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {suppliers && suppliers.length > 0 ? (
                                                suppliers.map((supplier) => (
                                                    <SelectItem 
                                                        key={supplier.id} 
                                                        value={String(supplier.id)}
                                                    >
                                                        {supplier.name}
                                                    </SelectItem>
                                                ))
                                            ) : (
                                                <SelectItem value="no-suppliers" disabled>
                                                    Tidak ada supplier tersedia
                                                </SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.supplier_id} className="mt-2" />
                                </div>

                                {/* Supplier Info */}
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

                                {/* Product Selection */}
                                <div className="col-span-2">
                                    <Label htmlFor="product_id" className="text-sm font-medium">
                                        Produk <span className="text-red-500">*</span>
                                    </Label>
                                    <Select
                                        onValueChange={(value) => {
                                            setData("product_id", value);
                                            clearErrors('product_id');
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
                                                        value={String(product.id)}
                                                    >
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">{product.name}</span>
                                                            <span className="text-xs text-gray-500">
                                                                Stok: {product.current_stock || 0}
                                                                {product.sku && ` | SKU: ${product.sku}`}
                                                            </span>
                                                        </div>
                                                    </SelectItem>
                                                ))
                                            ) : (
                                                <SelectItem value="no-products" disabled>
                                                    Tidak ada produk tersedia
                                                </SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.product_id} className="mt-2" />
                                </div>

                                {/* Product Info */}
                                {selectedProduct && (
                                    <div className="col-span-2 p-4 bg-green-50 border border-green-200 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            <InfoIcon className="h-4 w-4 text-green-600" />
                                            <h4 className="font-medium text-green-900">Informasi Produk</h4>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                            <div>
                                                <span className="text-gray-600">Nama:</span>
                                                <span className="ml-2 font-medium">{selectedProduct.name}</span>
                                            </div>
                                            {selectedProduct.sku && (
                                                <div>
                                                    <span className="text-gray-600">SKU:</span>
                                                    <span className="ml-2">{selectedProduct.sku}</span>
                                                </div>
                                            )}
                                            <div>
                                                <span className="text-gray-600">Stok Saat Ini:</span>
                                                <span className="ml-2 font-semibold">{selectedProduct.current_stock || 0}</span>
                                            </div>
                                            {selectedProduct.supplier && (
                                                <div>
                                                    <span className="text-gray-600">Supplier Default:</span>
                                                    <span className="ml-2">{selectedProduct.supplier.name}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Quantity */}
                                <div>
                                    <Label htmlFor="quantity" className="text-sm font-medium">
                                        Jumlah <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="quantity"
                                        type="number"
                                        name="quantity"
                                        value={data.quantity}
                                        onChange={(e) => {
                                            setData("quantity", e.target.value);
                                            clearErrors('quantity');
                                        }}
                                        min="1"
                                        step="1"
                                        placeholder="Masukkan jumlah"
                                        className="mt-1"
                                    />
                                    <InputError message={errors.quantity} className="mt-2" />
                                </div>

                                {/* Price Per Unit */}
                                <div>
                                    <Label htmlFor="price_per_unit" className="text-sm font-medium">
                                        Harga Per Unit <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="price_per_unit"
                                        type="number"
                                        name="price_per_unit"
                                        value={data.price_per_unit}
                                        onChange={(e) => {
                                            setData("price_per_unit", e.target.value);
                                            clearErrors('price_per_unit');
                                        }}
                                        step="0.01"
                                        min="0"
                                        placeholder="Masukkan harga per unit"
                                        className="mt-1"
                                    />
                                    <InputError message={errors.price_per_unit} className="mt-2" />
                                </div>

                                {/* Invoice Number */}
                                <div>
                                    <Label htmlFor="invoice_number" className="text-sm font-medium">
                                        Nomor Invoice
                                    </Label>
                                    <Input
                                        id="invoice_number"
                                        type="text"
                                        name="invoice_number"
                                        value={data.invoice_number}
                                        readOnly
                                        className="bg-gray-100 cursor-not-allowed mt-1"
                                    />
                                    <InputError message={errors.invoice_number} className="mt-2" />
                                </div>

                                {/* Transaction Date */}
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
                                                    ? format(new Date(data.transaction_date), "dd MMMM yyyy", { locale: localeId })
                                                    : "Pilih tanggal"}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar
                                                mode="single"
                                                selected={data.transaction_date ? new Date(data.transaction_date) : undefined}
                                                onSelect={(date) => {
                                                    if (date) {
                                                        const formattedDate = format(date, "yyyy-MM-dd");
                                                        setData("transaction_date", formattedDate);
                                                        clearErrors('transaction_date');
                                                    }
                                                }}
                                                initialFocus
                                                locale={localeId}
                                                disabled={(date) => date > new Date()}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <InputError message={errors.transaction_date} className="mt-2" />
                                </div>

                                {/* Notes */}
                                <div className="col-span-2">
                                    <Label htmlFor="notes" className="text-sm font-medium">
                                        Catatan (Opsional)
                                    </Label>
                                    <Input
                                        id="notes"
                                        type="text"
                                        name="notes"
                                        value={data.notes}
                                        onChange={(e) => setData("notes", e.target.value)}
                                        placeholder="Tambahkan catatan jika diperlukan"
                                        className="mt-1"
                                    />
                                    <InputError message={errors.notes} className="mt-2" />
                                </div>

                                {/* Total Price Preview */}
                                {data.quantity && data.price_per_unit && (
                                    <div className="col-span-2 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-medium text-gray-600">Total Harga:</span>
                                            <span className="text-lg font-bold text-gray-900">
                                                Rp {(parseFloat(data.quantity || 0) * parseFloat(data.price_per_unit || 0)).toLocaleString('id-ID')}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="col-span-2 flex justify-end mt-6 gap-2 pt-4 border-t">
                                    <Link href={route("purchase-transactions.index")}>
                                        <Button type="button" variant="outline">
                                            Batal
                                        </Button>
                                    </Link>
                                    <Button
                                        type="submit"
                                        disabled={processing || isProcessingAutofill}
                                        className="bg-blue-800 hover:bg-blue-900 min-w-[160px]"
                                    >
                                        {processing ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Menyimpan...
                                            </>
                                        ) : (
                                            "Catat Pembelian"
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </Layout>
    );}