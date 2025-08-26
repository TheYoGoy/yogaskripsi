import { useForm, router } from "@inertiajs/react";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Textarea } from "@/Components/ui/textarea";
import InputError from "@/Components/InputError";
import { Save, X, Package, Edit } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select";
import { useEffect } from "react";

export default function ProductEdit({
    onClose,
    product,
    categories = [],
    units = [],
    suppliers = [],
}) {
    const { data, setData, put, processing, errors, reset } = useForm({
        name: product?.name || "",
        sku: product?.sku || "",
        code: product?.code || "",
        description: product?.description || "",
        category_id: product?.category_id ? String(product.category_id) : "",
        unit_id: product?.unit_id ? String(product.unit_id) : "",
        supplier_id: product?.supplier_id ? String(product.supplier_id) : "none",
        price: product?.price || "",
        lead_time: product?.lead_time || "7",
        current_stock: product?.current_stock || "0",
        daily_usage_rate: product?.daily_usage_rate || "0.5",
    });

    // Update form data when product changes
    useEffect(() => {
        if (product) {
            setData({
                name: product.name || "",
                sku: product.sku || "",
                code: product.code || "",
                description: product.description || "",
                category_id: product.category_id ? String(product.category_id) : "",
                unit_id: product.unit_id ? String(product.unit_id) : "",
                supplier_id: product.supplier_id ? String(product.supplier_id) : "none",
                price: product.price || "",
                lead_time: product.lead_time || "7",
                current_stock: product.current_stock || "0",
                daily_usage_rate: product.daily_usage_rate || "0.5",
            });
        }
    }, [product]);

    const submit = (e) => {
        e.preventDefault();
        
        // Convert "none" back to empty string for supplier_id
        const submitData = {
            ...data,
            supplier_id: data.supplier_id === "none" ? "" : data.supplier_id
        };
        
        console.log("Updating product data:", submitData);
        
        // PERBAIKAN: Gunakan format yang benar untuk put()
        put(route("products.update", product.id), {
            onSuccess: (page) => {
                console.log("Product updated successfully", page);
                reset(); // Reset form
                if (onClose) {
                    onClose(); // Close modal - controller handles redirect
                }
            },
            onError: (errors) => {
                console.error("Product update errors:", errors);
            },
            onFinish: () => {
                console.log("Update request finished");
            }
        });
    };

    if (!product) {
        return (
            <div className="text-center py-8">
                <p className="text-gray-500">Produk tidak ditemukan</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3 pb-4 border-b">
                <div className="p-2 bg-green-100 rounded-lg">
                    <Edit className="h-5 w-5 text-green-600" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">Edit Produk</h3>
                    <p className="text-sm text-gray-500">Perbarui informasi produk {product.name}</p>
                </div>
            </div>

            <form onSubmit={submit} className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                    <h4 className="text-md font-medium text-gray-900 border-b pb-2">Informasi Dasar</h4>
                    
                    {/* Product Name */}
                    <div>
                        <Label htmlFor="name">
                            Nama Produk <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="name"
                            value={data.name}
                            onChange={(e) => setData("name", e.target.value)}
                            placeholder="Contoh: Tinta Printer Canon"
                            className="mt-1"
                        />
                        <InputError message={errors.name} className="mt-1" />
                    </div>

                    {/* SKU */}
                    <div>
                        <Label htmlFor="sku">
                            SKU <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="sku"
                            value={data.sku}
                            onChange={(e) => setData("sku", e.target.value)}
                            placeholder="Contoh: TNT-CAN-001"
                            className="mt-1"
                        />
                        <InputError message={errors.sku} className="mt-1" />
                        <p className="text-xs text-gray-500 mt-1">SKU harus unik untuk setiap produk</p>
                    </div>

                    {/* Product Code */}
                    <div>
                        <Label htmlFor="code">Kode Produk</Label>
                        <Input
                            id="code"
                            value={data.code}
                            onChange={(e) => setData("code", e.target.value)}
                            className="mt-1"
                            disabled
                        />
                        <InputError message={errors.code} className="mt-1" />
                        <p className="text-xs text-gray-500 mt-1">Kode produk untuk identifikasi internal</p>
                    </div>

                    {/* Description */}
                    <div>
                        <Label htmlFor="description">Deskripsi</Label>
                        <Textarea
                            id="description"
                            value={data.description}
                            onChange={(e) => setData("description", e.target.value)}
                            placeholder="Deskripsi detail produk (opsional)..."
                            rows={3}
                            className="mt-1"
                        />
                        <InputError message={errors.description} className="mt-1" />
                    </div>
                </div>

                {/* Category and Classification */}
                <div className="space-y-4">
                    <h4 className="text-md font-medium text-gray-900 border-b pb-2">Klasifikasi</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Category */}
                        <div>
                            <Label htmlFor="category_id">
                                Kategori <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={data.category_id}
                                onValueChange={(value) => setData("category_id", value)}
                            >
                                <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="Pilih kategori..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories && categories.length > 0 ? (
                                        categories.map((category) => (
                                            <SelectItem
                                                key={category.id}
                                                value={String(category.id)}
                                            >
                                                {category.name}
                                            </SelectItem>
                                        ))
                                    ) : (
                                        <div className="px-2 py-1 text-sm text-gray-500">
                                            Tidak ada kategori tersedia
                                        </div>
                                    )}
                                </SelectContent>
                            </Select>
                            <InputError message={errors.category_id} className="mt-1" />
                        </div>

                        {/* Unit */}
                        <div>
                            <Label htmlFor="unit_id">
                                Satuan <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={data.unit_id}
                                onValueChange={(value) => setData("unit_id", value)}
                            >
                                <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="Pilih satuan..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {units && units.length > 0 ? (
                                        units.map((unit) => (
                                            <SelectItem
                                                key={unit.id}
                                                value={String(unit.id)}
                                            >
                                                {unit.name} {unit.symbol && `(${unit.symbol})`}
                                            </SelectItem>
                                        ))
                                    ) : (
                                        <div className="px-2 py-1 text-sm text-gray-500">
                                            Tidak ada satuan tersedia
                                        </div>
                                    )}
                                </SelectContent>
                            </Select>
                            <InputError message={errors.unit_id} className="mt-1" />
                        </div>

                        {/* Supplier */}
                        <div>
                            <Label htmlFor="supplier_id">Supplier</Label>
                            <Select
                                value={data.supplier_id}
                                onValueChange={(value) => setData("supplier_id", value)}
                            >
                                <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="Pilih supplier (opsional)..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Tidak ada supplier</SelectItem>
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
                                        <div className="px-2 py-1 text-sm text-gray-500">
                                            Tidak ada supplier tersedia
                                        </div>
                                    )}
                                </SelectContent>
                            </Select>
                            <InputError message={errors.supplier_id} className="mt-1" />
                        </div>
                    </div>
                </div>

                {/* Pricing and Stock */}
                <div className="space-y-4">
                    <h4 className="text-md font-medium text-gray-900 border-b pb-2">Harga & Stok</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Price */}
                        <div>
                            <Label htmlFor="price">
                                Harga Jual (Rp) <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="price"
                                type="number"
                                min="0"
                                step="0.01"
                                value={data.price}
                                onChange={(e) => setData("price", e.target.value)}
                                placeholder="50000"
                                className="mt-1"
                            />
                            <InputError message={errors.price} className="mt-1" />
                        </div>

                        {/* Current Stock */}
                        <div>
                            <Label htmlFor="current_stock">Stok Saat Ini</Label>
                            <Input
                                id="current_stock"
                                type="number"
                                min="0"
                                value={data.current_stock}
                                onChange={(e) => setData("current_stock", e.target.value)}
                                placeholder="0"
                                className="mt-1"
                            />
                            <InputError message={errors.current_stock} className="mt-1" />
                            <p className="text-xs text-gray-500 mt-1">Stok fisik yang tersedia saat ini</p>
                        </div>
                    </div>
                </div>

                {/* Inventory Parameters */}
                <div className="space-y-4">
                    <h4 className="text-md font-medium text-gray-900 border-b pb-2">Parameter Inventory</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Lead Time */}
                        <div>
                            <Label htmlFor="lead_time">
                                Lead Time (Hari)
                            </Label>
                            <Input
                                id="lead_time"
                                type="number"
                                min="1"
                                value={data.lead_time}
                                onChange={(e) => setData("lead_time", e.target.value)}
                                placeholder="7"
                                className="mt-1"
                            />
                            <InputError message={errors.lead_time} className="mt-1" />
                            <p className="text-xs text-gray-500 mt-1">Waktu tunggu pengiriman dari supplier</p>
                        </div>

                        {/* Daily Usage Rate */}
                        <div>
                            <Label htmlFor="daily_usage_rate">Rata-rata Pemakaian Harian</Label>
                            <Input
                                id="daily_usage_rate"
                                type="number"
                                min="0"
                                step="0.1"
                                value={data.daily_usage_rate}
                                onChange={(e) => setData("daily_usage_rate", e.target.value)}
                                placeholder="0.5"
                                className="mt-1"
                            />
                            <InputError message={errors.daily_usage_rate} className="mt-1" />
                            <p className="text-xs text-gray-500 mt-1">Unit per hari (untuk perhitungan ROP & EOQ)</p>
                        </div>
                    </div>
                </div>

                {/* Product Info Display */}
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Informasi Produk</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-gray-500">Dibuat:</span>{" "}
                            <span className="text-gray-900">
                                {product.created_at ? new Date(product.created_at).toLocaleDateString('id-ID') : '-'}
                            </span>
                        </div>
                        <div>
                            <span className="text-gray-500">Terakhir diubah:</span>{" "}
                            <span className="text-gray-900">
                                {product.updated_at ? new Date(product.updated_at).toLocaleDateString('id-ID') : '-'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-6 border-t">
                    {onClose && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={processing}
                            className="px-6"
                        >
                            <X className="w-4 h-4 mr-2" />
                            Batal
                        </Button>
                    )}
                    <Button 
                        type="submit" 
                        disabled={processing}
                        className="bg-green-600 hover:bg-green-700 px-6"
                    >
                        {processing ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Menyimpan...
                            </div>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Simpan Perubahan
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}