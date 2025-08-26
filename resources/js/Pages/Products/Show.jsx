import { Head, router } from "@inertiajs/react";
import { Button } from "@/Components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/Components/ui/card";
import { Separator } from "@/Components/ui/separator";
import { Badge } from "@/Components/ui/badge";
import Layout from "@/Layouts/Layout";
import {
    Package,
    ArrowLeft,
    QrCode,
    Edit,
    Trash2,
    Calendar,
    DollarSign,
    Truck,
    Gauge,
    Building,
    Tag,
    BarChart3,
    AlertTriangle,
    CheckCircle,
    Download,
    Eye,
} from "lucide-react";
import { useState, useMemo } from "react";
import axios from "axios";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/Components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/id";
import ProductEdit from "./Edit";

dayjs.locale('id');

export default function Show({ auth, product, categories, units, suppliers }) {
    const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [barcodeSVG, setBarcodeSVG] = useState(null);
    const [isLoadingBarcode, setIsLoadingBarcode] = useState(false);
    const [error, setError] = useState(null);

    // ✅ OPTIMIZED: Memoize stock status calculation
    const stockStatus = useMemo(() => {
        const rop = product.rop || 10;
        const stock = product.current_stock;
        
        if (stock === 0) {
            return { 
                status: "Habis", 
                variant: "destructive", 
                icon: <AlertTriangle className="h-4 w-4" /> 
            };
        } else if (stock < rop) {
            return { 
                status: "Rendah", 
                variant: "secondary", 
                icon: <AlertTriangle className="h-4 w-4" /> 
            };
        } else {
            return { 
                status: "Normal", 
                variant: "default", 
                icon: <CheckCircle className="h-4 w-4" /> 
            };
        }
    }, [product.current_stock, product.rop]);

    const showBarcode = async () => {
        setIsBarcodeModalOpen(true);
        setIsLoadingBarcode(true);
        setError(null);
        setBarcodeSVG(null);

        try {
            const response = await axios.get(route("products.barcode", product.id));
            setBarcodeSVG(response.data.svg || response.data.barcode);
        } catch (err) {
            setError("Gagal memuat barcode.");
            toast({
                title: "Error Barcode!",
                description: "Tidak dapat memuat barcode untuk produk ini.",
                variant: "destructive",
            });
        } finally {
            setIsLoadingBarcode(false);
        }
    };

    const handleDelete = () => {
        router.delete(route("products.destroy", product.id), {
            onSuccess: () => {
                toast({
                    title: "Berhasil Dihapus!",
                    description: `Produk "${product.name}" telah dihapus dari sistem.`,
                    variant: "default",
                });
                router.get(route("products.index"));
            },
            onError: () => {
                toast({
                    title: "Gagal Menghapus!",
                    description: "Terjadi kesalahan saat menghapus produk.",
                    variant: "destructive",
                });
                setIsDeleteModalOpen(false);
            },
        });
    };

    return (
        <Layout user={auth?.user}>
            <Head title={`Detail Produk - ${product.name}`} />
            
            <div className="container max-w-6xl mx-auto px-4 py-8">
                {/* Back Button */}
                <div className="mb-6">
                    <Button
                        variant="outline"
                        onClick={() => router.get(route("products.index"))}
                        className="flex items-center gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Kembali ke Daftar Produk
                    </Button>
                </div>

                <div className="grid gap-6">
                    {/* Header Card */}
                    <Card className="relative overflow-hidden shadow-lg border-none rounded-xl">
                        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white relative">
                            <Package className="absolute right-4 top-4 h-20 w-20 opacity-20" />
                            <div className="relative z-10">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
                                        <p className="text-indigo-100 text-lg">{product.description || "Tidak ada deskripsi"}</p>
                                        <div className="flex items-center gap-4 mt-4">
                                            <Badge variant="outline" className="bg-white/20 border-white/30 text-white">
                                                SKU: {product.sku}
                                            </Badge>
                                            {product.code && (
                                                <Badge variant="outline" className="bg-white/20 border-white/30 text-white">
                                                    Kode: {product.code}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Action Buttons */}
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={showBarcode}
                                            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm"
                                            size="sm"
                                        >
                                            <QrCode className="h-4 w-4 mr-2" />
                                            Barcode
                                        </Button>
                                        
                                        {(auth?.user?.roles?.includes("admin") ||
                                            auth?.user?.roles?.includes("manager")) && (
                                            <Button
                                                onClick={() => setIsEditModalOpen(true)}
                                                className="bg-green-600 hover:bg-green-700"
                                                size="sm"
                                            >
                                                <Edit className="h-4 w-4 mr-2" />
                                                Edit
                                            </Button>
                                        )}
                                        
                                        {auth?.user?.roles?.includes("admin") && (
                                            <Button
                                                onClick={() => setIsDeleteModalOpen(true)}
                                                variant="destructive"
                                                size="sm"
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Hapus
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Stock & Inventory Info */}
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BarChart3 className="h-5 w-5" />
                                    Informasi Stok & Inventory
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Current Stock */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="bg-blue-50 p-4 rounded-lg">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-blue-600">Stok Saat Ini</p>
                                                <p className="text-2xl font-bold text-blue-900">
                                                    {product.current_stock || 0}
                                                </p>
                                            </div>
                                            <Package className="h-8 w-8 text-blue-500" />
                                        </div>
                                        <div className="flex items-center gap-1 mt-2">
                                            {stockStatus.icon}
                                            <Badge variant={stockStatus.variant} className="text-xs">
                                                {stockStatus.status}
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="bg-green-50 p-4 rounded-lg">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-green-600">ROP</p>
                                                <p className="text-2xl font-bold text-green-900">
                                                    {product.rop || '-'}
                                                </p>
                                            </div>
                                            <AlertTriangle className="h-8 w-8 text-green-500" />
                                        </div>
                                        <p className="text-xs text-green-600 mt-2">Reorder Point</p>
                                    </div>

                                    <div className="bg-purple-50 p-4 rounded-lg">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-purple-600">EOQ</p>
                                                <p className="text-2xl font-bold text-purple-900">
                                                    {product.eoq || '-'}
                                                </p>
                                            </div>
                                            <BarChart3 className="h-8 w-8 text-purple-500" />
                                        </div>
                                        <p className="text-xs text-purple-600 mt-2">Economic Order Qty</p>
                                    </div>

                                    <div className="bg-orange-50 p-4 rounded-lg">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-orange-600">Status Reorder</p>
                                                <p className="text-sm font-bold text-orange-900">
                                                    {product.reorder_status || (product.current_stock < (product.rop || 10) ? 'Perlu Reorder' : 'Normal')}
                                                </p>
                                            </div>
                                            <Gauge className="h-8 w-8 text-orange-500" />
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                {/* Inventory Parameters */}
                                <div>
                                    <h4 className="font-semibold mb-3">Parameter Inventory</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="flex justify-between py-2 px-3 bg-gray-50 rounded">
                                            <span className="text-gray-600">Lead Time:</span>
                                            <span className="font-medium">{product.lead_time || 7} hari</span>
                                        </div>
                                        <div className="flex justify-between py-2 px-3 bg-gray-50 rounded">
                                            <span className="text-gray-600">Pemakaian Harian:</span>
                                            <span className="font-medium">{product.daily_usage_rate || 0.5} unit/hari</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Product Details */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Tag className="h-5 w-5" />
                                    Detail Produk
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Price */}
                                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <DollarSign className="h-5 w-5 text-green-600" />
                                        <span className="text-green-700 font-medium">Harga Jual</span>
                                    </div>
                                    <span className="text-xl font-bold text-green-900">
                                        Rp {new Intl.NumberFormat('id-ID').format(product.price || 0)}
                                    </span>
                                </div>

                                <Separator />

                                {/* Category */}
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Kategori:</span>
                                        <Badge variant="outline">
                                            {product.category?.name || 'Tidak ada kategori'}
                                        </Badge>
                                    </div>

                                    {/* Unit */}
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Satuan:</span>
                                        <Badge variant="outline">
                                            {product.unit?.name || 'Tidak ada satuan'}
                                            {product.unit?.symbol && ` (${product.unit.symbol})`}
                                        </Badge>
                                    </div>

                                    {/* Supplier */}
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Supplier:</span>
                                        <div className="flex items-center gap-2">
                                            <Building className="h-4 w-4 text-gray-400" />
                                            <span className="font-medium">
                                                {product.supplier?.name || 'Tidak ada supplier'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                {/* Timestamps */}
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <Calendar className="h-4 w-4" />
                                        <span>Dibuat: {dayjs(product.created_at).format('DD MMMM YYYY, HH:mm')}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <Calendar className="h-4 w-4" />
                                        <span>Diperbarui: {dayjs(product.updated_at).format('DD MMMM YYYY, HH:mm')}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {/* Barcode Modal */}
            <Dialog open={isBarcodeModalOpen} onOpenChange={setIsBarcodeModalOpen}>
                <DialogContent className="max-w-md p-6 rounded-xl shadow-xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-gray-800">
                            Preview Barcode
                        </DialogTitle>
                        <DialogDescription className="text-gray-600">
                            Scan barcode ini untuk identifikasi produk:{" "}
                            <span className="font-semibold text-gray-800">
                                {product.code || product.sku}
                            </span>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-center items-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-200 min-h-[150px]">
                        {isLoadingBarcode ? (
                            <div className="flex flex-col items-center text-gray-500">
                                <Loader2 className="h-8 w-8 animate-spin mb-2" />
                                <p>Memuat barcode...</p>
                            </div>
                        ) : error ? (
                            <p className="text-red-500 text-center">{error}</p>
                        ) : barcodeSVG ? (
                            <div
                                dangerouslySetInnerHTML={{ __html: barcodeSVG }}
                                className="w-full h-auto max-w-[80%] flex justify-center items-center"
                            />
                        ) : (
                            <p className="text-gray-500">
                                Tidak ada barcode untuk ditampilkan.
                            </p>
                        )}
                    </div>

                    <DialogFooter className="mt-4 flex justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setIsBarcodeModalOpen(false)}
                            className="border-gray-300 hover:bg-gray-100 rounded-md"
                        >
                            Tutup
                        </Button>
                        <a
                            href={route("products.download-barcode", product.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <Button
                                variant="default"
                                className="bg-blue-600 hover:bg-blue-700 rounded-md"
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Download QR
                            </Button>
                        </a>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-2xl">Edit Produk</DialogTitle>
                        <DialogDescription>
                            Ubah data produk sesuai kebutuhan.
                        </DialogDescription>
                    </DialogHeader>
                    <ProductEdit
                        product={product}
                        categories={categories}
                        units={units}
                        suppliers={suppliers}
                        onClose={() => setIsEditModalOpen(false)}
                    />
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Modal */}
            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent className="max-w-md p-0 rounded-2xl shadow-2xl bg-white border-0 overflow-hidden">
                    <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 text-center relative overflow-hidden">
                        <div className="absolute inset-0 opacity-10">
                            <div className="absolute -top-4 -right-4 w-24 h-24 bg-white rounded-full"></div>
                            <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white rounded-full"></div>
                        </div>

                        <div className="relative z-10">
                            <div className="flex justify-center mb-4">
                                <div className="p-4 bg-white bg-opacity-20 rounded-full animate-bounce">
                                    <AlertTriangle className="h-8 w-8 text-white" />
                                </div>
                            </div>
                            <DialogTitle className="text-2xl font-bold text-white mb-2">
                                Konfirmasi Hapus
                            </DialogTitle>
                            <DialogDescription className="text-red-100">
                                Tindakan ini tidak dapat dibatalkan
                            </DialogDescription>
                        </div>
                    </div>

                    <div className="p-6">
                        <div className="text-center mb-6">
                            <p className="text-gray-700 text-lg leading-relaxed mb-3">
                                Apakah Anda yakin ingin menghapus produk
                            </p>

                            <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200 mb-4">
                                <div className="flex items-center justify-center gap-3">
                                    <div className="p-2 bg-red-500 text-white rounded-lg">
                                        <Package className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-xl text-gray-900">
                                            {product.name}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            SKU: {product.sku}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                                <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></span>
                                Data akan dihapus secara permanen
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="flex-1 h-12 border-gray-300 text-gray-700 hover:bg-gray-50 font-medium rounded-xl transition-all duration-200"
                            >
                                Batal
                            </Button>
                            <Button
                                type="button"
                                onClick={handleDelete}
                                className="flex-1 h-12 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Ya, Hapus!
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </Layout>
    );
}