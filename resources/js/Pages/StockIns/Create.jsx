import { useEffect, useState, useRef } from "react";
import { Head, Link, useForm } from "@inertiajs/react";
import axios from "axios";
import { toast } from "@/hooks/use-toast";

// Import UI components
import Layout from "@/Layouts/Layout";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/Components/ui/card";
import InputError from "@/Components/InputError";
import { Calendar } from "@/Components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/Components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { CalendarIcon, InfoIcon, Loader2, QrCode, Camera } from "lucide-react";

let Html5QrcodeScanner = null;

// Dynamically import Html5QrcodeScanner
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

export default function StockInCreate({ auth, products, suppliers }) {
    const [isProcessingAutofill, setIsProcessingAutofill] = useState(false);
    const [supplierInfo, setSupplierInfo] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isScannerReady, setIsScannerReady] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const prevCodeRef = useRef("");
    const scannerRef = useRef(null);
    const qrScannerInitialized = useRef(false);

    // Form dengan structure sesuai database
    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        code: "",
        product_id: "",
        supplier_name: "", // Menggunakan supplier_name bukan supplier_id
        quantity: "",
        transaction_date: format(new Date(), "yyyy-MM-dd"),
        source: "",
        purchase_transaction_id: "",
    });

    // State untuk purchase transaction info
    const [purchaseInfo, setPurchaseInfo] = useState(null);

    const submit = (e) => {
        e.preventDefault();
        
        console.log('Form submission data:', data);

        // Clear errors first
        clearErrors();

        // Client validation
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

        if (!data.transaction_date) {
            toast({
                title: "Error",
                description: "Tanggal transaksi harus diisi",
                variant: "destructive",
            });
            return;
        }

        // Clear scanner before submit
        if (scannerRef.current) {
            scannerRef.current.clear().catch(console.error);
        }

        // Submit dengan data yang sudah divalidasi
        post(route("stock-ins.store"), {
            preserveScroll: true,
            onSuccess: () => {
                toast({
                    title: "Berhasil!",
                    description: "Stock In berhasil ditambahkan",
                    variant: "success",
                });
                
                // Reset form
                reset();
                setSupplierInfo(null);
                setSelectedProduct(null);
                setPurchaseInfo(null);
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
                // Reset data when code is cleared
                setSelectedProduct(null);
                setSupplierInfo(null);
                setPurchaseInfo(null);
            }
            return;
        }

        const timeoutId = setTimeout(() => {
            if (data.code === prevCodeRef.current) return;
            
            prevCodeRef.current = data.code;
            setIsProcessingAutofill(true);
            
            const autofillUrl = `/stock-ins/autofill/${encodeURIComponent(data.code)}`;
            console.log('Calling autofill URL:', autofillUrl);
            
            axios.get(autofillUrl)
                .then((response) => {
                    const autofill = response.data;
                    console.log('Autofill response:', autofill);
                    
                    // Update form data
                    setData((prev) => ({
                        ...prev,
                        product_id: autofill.product_id ? String(autofill.product_id) : "",
                        supplier_name: autofill.supplier_name || "",
                        quantity: autofill.quantity ? String(autofill.quantity) : "1",
                        transaction_date: autofill.stockin_date || format(new Date(), "yyyy-MM-dd"),
                        source: autofill.source || "",
                        purchase_transaction_id: autofill.purchase_transaction_id ? String(autofill.purchase_transaction_id) : "",
                    }));

                    // Update purchase info jika ada
                    if (autofill.purchase_info) {
                        setPurchaseInfo(autofill.purchase_info);
                    } else {
                        setPurchaseInfo(null);
                    }

                    // Update selected product
                    if (autofill.product_id && products) {
                        const product = products.find(p => p.id == autofill.product_id);
                        setSelectedProduct(product || null);
                    }

                    // Update supplier info jika ada
                    if (autofill.supplier_name && suppliers) {
                        const supplier = suppliers.find(s => s.name === autofill.supplier_name);
                        setSupplierInfo(supplier || null);
                    }

                    // Show warning if fully received
                    if (autofill.warning) {
                        toast({
                            title: "Peringatan",
                            description: autofill.warning,
                            variant: "destructive",
                        });
                    } else {
                        toast({
                            title: "Berhasil",
                            description: autofill.source === 'Purchase Transaction' 
                                ? `Data dari Purchase Transaction ${autofill.purchase_info?.invoice_number} berhasil dimuat`
                                : "Data produk berhasil terisi dari barcode",
                            variant: "success",
                        });
                    }
                })
                .catch((error) => {
                    console.error('Autofill error:', error);
                    const errorMessage = error.response?.data?.message || "Kode tidak ditemukan";
                    
                    toast({
                        title: "Info",
                        description: errorMessage,
                        variant: "default",
                    });
                })
                .finally(() => {
                    setIsProcessingAutofill(false);
                });
        }, 800);

        return () => clearTimeout(timeoutId);
    }, [data.code, setData, suppliers, products]);

    // Update selected product when product_id changes
    useEffect(() => {
        if (data.product_id && products) {
            const product = products.find(p => p.id == data.product_id);
            setSelectedProduct(product || null);
            
            // Auto set supplier dari product jika belum ada
            if (product && product.supplier && !data.supplier_name) {
                setData('supplier_name', product.supplier.name);
                setSupplierInfo(product.supplier);
            }
        } else if (!data.product_id) {
            setSelectedProduct(null);
        }
    }, [data.product_id, products]);

    // Update supplier info when supplier_name changes
    useEffect(() => {
        if (data.supplier_name && suppliers) {
            const supplier = suppliers.find(s => s.name === data.supplier_name);
            setSupplierInfo(supplier || null);
        } else if (!data.supplier_name) {
            setSupplierInfo(null);
        }
    }, [data.supplier_name, suppliers]);

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
                    aspectRatio: 1.0,
                    showTorchButtonIfSupported: true,
                    showZoomSliderIfSupported: true,
                    defaultZoomValueIfSupported: 2
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

                                {/* Purchase Transaction Info */}
                                {purchaseInfo && (
                                    <div className="col-span-2 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            <InfoIcon className="h-4 w-4 text-purple-600" />
                                            <h4 className="font-medium text-purple-900">Informasi Purchase Transaction</h4>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                            <div>
                                                <span className="text-gray-600">Invoice:</span>
                                                <span className="ml-2 font-medium">{purchaseInfo.invoice_number}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Jumlah Pesanan:</span>
                                                <span className="ml-2 font-medium">{purchaseInfo.ordered_quantity}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Sudah Diterima:</span>
                                                <span className="ml-2 font-medium text-blue-600">{purchaseInfo.received_quantity}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Sisa:</span>
                                                <span className={`ml-2 font-semibold ${purchaseInfo.remaining_quantity > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                                                    {purchaseInfo.remaining_quantity}
                                                </span>
                                            </div>
                                        </div>
                                        {purchaseInfo.remaining_quantity <= 0 && (
                                            <div className="mt-2 p-2 bg-green-100 border border-green-300 rounded text-green-800 text-xs">
                                                Purchase transaction ini sudah fully received
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Product Info */}
                                {selectedProduct && (
                                    <div className="col-span-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            <InfoIcon className="h-4 w-4 text-blue-600" />
                                            <h4 className="font-medium text-blue-900">Informasi Produk</h4>
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

                                {/* Supplier Name Input */}
                                <div className="col-span-2">
                                    <Label htmlFor="supplier_name" className="text-sm font-medium">Nama Supplier</Label>
                                    <Input
                                        id="supplier_name"
                                        type="text"
                                        name="supplier_name"
                                        value={data.supplier_name}
                                        onChange={(e) => setData("supplier_name", e.target.value)}
                                        placeholder="Masukkan nama supplier"
                                        className="mt-1"
                                        list="suppliers-list"
                                    />
                                    {/* Datalist untuk autocomplete */}
                                    {suppliers && suppliers.length > 0 && (
                                        <datalist id="suppliers-list">
                                            {suppliers.map(supplier => (
                                                <option key={supplier.id} value={supplier.name} />
                                            ))}
                                        </datalist>
                                    )}
                                    <InputError message={errors.supplier_name} className="mt-2" />
                                </div>

                                {/* Supplier Info */}
                                {supplierInfo && (
                                    <div className="col-span-2 p-4 bg-green-50 border border-green-200 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            <InfoIcon className="h-4 w-4 text-green-600" />
                                            <h4 className="font-medium text-green-900">Informasi Supplier</h4>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                            <div>
                                                <span className="text-gray-600">Nama:</span>
                                                <span className="ml-2 font-medium">{supplierInfo.name}</span>
                                            </div>
                                            {supplierInfo.phone && (
                                                <div>
                                                    <span className="text-gray-600">Kontak:</span>
                                                    <span className="ml-2">{supplierInfo.phone}</span>
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

                                {/* Transaction Date */}
                                <div>
                                    <Label className="text-sm font-medium">
                                        Tanggal Masuk <span className="text-red-500">*</span>
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

                                {/* Source */}
                                <div className="col-span-2">
                                    <Label htmlFor="source" className="text-sm font-medium">Sumber Stock In</Label>
                                    <Select
                                        onValueChange={(value) => setData("source", value === "none" ? "" : value)}
                                        value={data.source || "none"}
                                    >
                                        <SelectTrigger className="w-full mt-1">
                                            <SelectValue placeholder="Pilih sumber stock in" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">-- Pilih Sumber --</SelectItem>
                                            <SelectItem value="Purchase Transaction">Transaksi Pembelian</SelectItem>
                                            <SelectItem value="Retur">Retur Barang</SelectItem>
                                            <SelectItem value="Transfer Masuk">Transfer Masuk</SelectItem>
                                            <SelectItem value="Penyesuaian">Penyesuaian Stok</SelectItem>
                                            <SelectItem value="Produksi">Hasil Produksi</SelectItem>
                                            <SelectItem value="Lainnya">Lainnya</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.source} className="mt-2" />
                                </div>

                                {/* Purchase Transaction ID */}
                                {data.source === "Purchase Transaction" && (
                                    <div className="col-span-2">
                                        <Label htmlFor="purchase_transaction_id" className="text-sm font-medium">
                                            ID Transaksi Pembelian (Opsional)
                                        </Label>
                                        <Input
                                            id="purchase_transaction_id"
                                            type="text"
                                            name="purchase_transaction_id"
                                            value={data.purchase_transaction_id}
                                            onChange={(e) => setData("purchase_transaction_id", e.target.value)}
                                            placeholder="ID transaksi pembelian"
                                            className="mt-1"
                                        />
                                        <InputError message={errors.purchase_transaction_id} className="mt-2" />
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="col-span-2 flex justify-end mt-6 gap-2 pt-4 border-t">
                                    <Link href={route("stock-ins.index")}>
                                        <Button type="button" variant="outline">
                                            Batal
                                        </Button>
                                    </Link>
                                    <Button
                                        type="submit"
                                        disabled={processing || isProcessingAutofill}
                                        className="bg-green-800 hover:bg-green-900 min-w-[160px]"
                                    >
                                        {processing ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Menyimpan...
                                            </>
                                        ) : (
                                            "Catat Barang Masuk"
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