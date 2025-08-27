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
import { Calendar as CalendarIcon, Info as InfoIcon, Loader2, QrCode, Camera, ArrowUpCircle } from "lucide-react";

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

export default function StockOutCreate({ auth, products }) {
    const [isProcessingAutofill, setIsProcessingAutofill] = useState(false);
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
        customer: "",
        quantity: "",
        transaction_date: format(new Date(), "yyyy-MM-dd"),
    });

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

        // Validasi stok
        if (selectedProduct && parseInt(data.quantity) > selectedProduct.current_stock) {
            toast({
                title: "Error",
                description: `Stok tidak mencukupi. Stok tersedia: ${selectedProduct.current_stock}`,
                variant: "destructive",
            });
            return;
        }

        // Clear scanner before submit
        if (scannerRef.current) {
            scannerRef.current.clear().catch(console.error);
        }

        // Submit dengan data yang sudah divalidasi
        post(route("stock-outs.store"), {
            preserveScroll: true,
            onSuccess: () => {
                toast({
                    title: "Berhasil!",
                    description: "Stock Out berhasil ditambahkan",
                    variant: "success",
                });
                
                // Reset form
                reset();
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
                // Reset data when code is cleared
                setSelectedProduct(null);
            }
            return;
        }

        const timeoutId = setTimeout(() => {
            if (data.code === prevCodeRef.current) return;
            
            prevCodeRef.current = data.code;
            setIsProcessingAutofill(true);
            
            const autofillUrl = `/stock-outs/autofill/${encodeURIComponent(data.code)}`;
            console.log('Calling autofill URL:', autofillUrl);
            
            axios.get(autofillUrl)
                .then((response) => {
                    const autofill = response.data;
                    console.log('StockOut Autofill response:', autofill);
                    
                    // Update form data
                    setData((prev) => ({
                        ...prev,
                        product_id: autofill.product_id ? String(autofill.product_id) : "",
                        quantity: autofill.quantity ? String(autofill.quantity) : "1",
                        transaction_date: autofill.stockout_date || format(new Date(), "yyyy-MM-dd"),
                    }));

                    // Update selected product
                    if (autofill.product_id && products) {
                        const product = products.find(p => p.id == autofill.product_id);
                        console.log('Found product:', product);
                        setSelectedProduct(product || null);
                    }

                    // Show warning if no stock
                    if (autofill.warning) {
                        toast({
                            title: "Peringatan",
                            description: autofill.warning,
                            variant: "destructive",
                        });
                    } else {
                        toast({
                            title: "Berhasil",
                            description: `Data produk berhasil terisi dari barcode. Stok tersedia: ${autofill.available_stock}`,
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
    }, [data.code, setData, products]);

    // Update selected product when product_id changes
    useEffect(() => {
        if (data.product_id && products) {
            const product = products.find(p => p.id == data.product_id);
            setSelectedProduct(product || null);
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
            <Head title="Catat Barang Keluar" />

            <div className="py-6">
                <div className="max-w-3xl mx-auto sm:px-6 lg:px-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ArrowUpCircle className="h-6 w-6 text-red-600" />
                                Detail Stock Keluar
                            </CardTitle>
                            <CardDescription>
                                Masukkan detail untuk transaksi barang keluar.
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
                                                        disabled={product.current_stock <= 0}
                                                    >
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">{product.name}</span>
                                                            <span className={`text-xs ${
                                                                product.current_stock <= 0 
                                                                    ? 'text-red-500' 
                                                                    : product.current_stock < 10 
                                                                        ? 'text-orange-500' 
                                                                        : 'text-gray-500'
                                                            }`}>
                                                                Stok: {product.current_stock || 0}
                                                                {product.sku && ` | SKU: ${product.sku}`}
                                                                {product.current_stock <= 0 && ' (Habis)'}
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
                                                <span className={`ml-2 font-semibold ${
                                                    selectedProduct.current_stock <= 0 
                                                        ? 'text-red-600' 
                                                        : selectedProduct.current_stock < 10 
                                                            ? 'text-orange-600' 
                                                            : 'text-green-600'
                                                }`}>
                                                    {selectedProduct.current_stock || 0}
                                                </span>
                                            </div>
                                        </div>
                                        {selectedProduct.current_stock <= 0 && (
                                            <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded text-red-800 text-xs">
                                                Peringatan: Stok produk ini habis!
                                            </div>
                                        )}
                                        {selectedProduct.current_stock > 0 && selectedProduct.current_stock < 10 && (
                                            <div className="mt-2 p-2 bg-orange-100 border border-orange-300 rounded text-orange-800 text-xs">
                                                Peringatan: Stok produk ini hampir habis!
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Customer Input */}
                                <div className="col-span-2">
                                    <Label htmlFor="customer" className="text-sm font-medium">Nama Customer</Label>
                                    <Input
                                        id="customer"
                                        type="text"
                                        name="customer"
                                        value={data.customer}
                                        onChange={(e) => setData("customer", e.target.value)}
                                        placeholder="Masukkan nama customer (opsional)"
                                        className="mt-1"
                                    />
                                    <InputError message={errors.customer} className="mt-2" />
                                </div>

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
                                        max={selectedProduct?.current_stock || undefined}
                                        step="1"
                                        placeholder="Masukkan jumlah"
                                        className="mt-1"
                                    />
                                    {selectedProduct && (
                                        <p className="text-xs text-gray-500 mt-1">
                                            Maksimal: {selectedProduct.current_stock}
                                        </p>
                                    )}
                                    <InputError message={errors.quantity} className="mt-2" />
                                </div>

                                {/* Transaction Date */}
                                <div>
                                    <Label className="text-sm font-medium">
                                        Tanggal Keluar <span className="text-red-500">*</span>
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

                                {/* Action Buttons */}
                                <div className="col-span-2 flex justify-end mt-6 gap-2 pt-4 border-t">
                                    <Link href={route("stock-outs.index")}>
                                        <Button type="button" variant="outline">
                                            Batal
                                        </Button>
                                    </Link>
                                    <Button
                                        type="submit"
                                        disabled={processing || isProcessingAutofill}
                                        className="bg-red-600 hover:bg-red-700 min-w-[160px]"
                                    >
                                        {processing ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Menyimpan...
                                            </>
                                        ) : (
                                            "Catat Barang Keluar"
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