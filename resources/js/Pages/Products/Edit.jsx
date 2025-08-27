import { useForm } from "@inertiajs/react";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Textarea } from "@/Components/ui/textarea";
import InputError from "@/Components/InputError";
import { Save, X, Package } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select";

export default function ProductEdit({
    onClose,
    categories = [],
    units = [],
    suppliers = [],
    product, // <-- product data dari backend
}) {
    const { data, setData, put, processing, errors } = useForm({
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
        minimum_stock: product.minimum_stock || "10",
        daily_usage_rate: product.daily_usage_rate || "0.5",
        holding_cost_percentage: product.holding_cost_percentage || "0.2",
        ordering_cost: product.ordering_cost || "25000",
    });

    const submit = (e) => {
        e.preventDefault();

        const submitData = {
            ...data,
            supplier_id: data.supplier_id === "none" ? "" : data.supplier_id,
        };

        put(route("products.update", product.id), {
            onSuccess: (page) => {
                console.log("Product updated successfully", page);
                if (onClose) {
                    onClose();
                }
            },
            onError: (errors) => {
                console.error("Product update errors:", errors);
            },
            onFinish: () => {
                console.log("Request finished");
            },
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3 pb-4 border-b">
                <div className="p-2 bg-indigo-100 rounded-lg">
                    <Package className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                        Edit Produk
                    </h3>
                    <p className="text-sm text-gray-500">
                        Ubah informasi produk sesuai kebutuhan
                    </p>
                </div>
            </div>

            <form onSubmit={submit} className="space-y-6">
                {/* Informasi Dasar */}
                <div className="space-y-4">
                    <h4 className="text-md font-medium text-gray-900 border-b pb-2">
                        Informasi Dasar
                    </h4>

                    {/* Nama Produk */}
                    <div>
                        <Label htmlFor="name">
                            Nama Produk <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="name"
                            value={data.name}
                            onChange={(e) => setData("name", e.target.value)}
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
                            className="mt-1"
                        />
                        <InputError message={errors.sku} className="mt-1" />
                    </div>

                    {/* Kode Produk */}
                    <div>
                        <Label htmlFor="code">Kode Produk</Label>
                        <Input
                            id="code"
                            value={data.code}
                            disabled
                            className="mt-1 bg-gray-50 cursor-not-allowed"
                        />
                        <InputError message={errors.code} className="mt-1" />
                    </div>

                    {/* Deskripsi */}
                    <div>
                        <Label htmlFor="description">Deskripsi</Label>
                        <Textarea
                            id="description"
                            value={data.description}
                            onChange={(e) =>
                                setData("description", e.target.value)
                            }
                            rows={3}
                            className="mt-1"
                        />
                        <InputError
                            message={errors.description}
                            className="mt-1"
                        />
                    </div>
                </div>

                {/* Klasifikasi */}
                <div className="space-y-4">
                    <h4 className="text-md font-medium text-gray-900 border-b pb-2">
                        Klasifikasi
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Kategori */}
                        <div>
                            <Label htmlFor="category_id">
                                Kategori <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={data.category_id}
                                onValueChange={(value) =>
                                    setData("category_id", value)
                                }
                            >
                                <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="Pilih kategori..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((category) => (
                                        <SelectItem
                                            key={category.id}
                                            value={String(category.id)}
                                        >
                                            {category.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError
                                message={errors.category_id}
                                className="mt-1"
                            />
                        </div>

                        {/* Satuan */}
                        <div>
                            <Label htmlFor="unit_id">
                                Satuan <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={data.unit_id}
                                onValueChange={(value) =>
                                    setData("unit_id", value)
                                }
                            >
                                <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="Pilih satuan..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {units.map((unit) => (
                                        <SelectItem
                                            key={unit.id}
                                            value={String(unit.id)}
                                        >
                                            {unit.name}{" "}
                                            {unit.symbol && `(${unit.symbol})`}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError
                                message={errors.unit_id}
                                className="mt-1"
                            />
                        </div>

                        {/* Supplier */}
                        <div>
                            <Label htmlFor="supplier_id">Supplier</Label>
                            <Select
                                value={data.supplier_id}
                                onValueChange={(value) =>
                                    setData("supplier_id", value)
                                }
                            >
                                <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="Pilih supplier..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">
                                        Tidak ada supplier
                                    </SelectItem>
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
                                className="mt-1"
                            />
                        </div>
                    </div>
                </div>

                {/* Harga & Stok */}
                <div className="space-y-4">
                    <h4 className="text-md font-medium text-gray-900 border-b pb-2">
                        Harga & Stok
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <Label htmlFor="price">Harga Beli (Rp)</Label>
                            <Input
                                id="price"
                                type="number"
                                value={data.price}
                                onChange={(e) => setData("price", e.target.value)}
                                className="mt-1"
                            />
                            <InputError message={errors.price} className="mt-1" />
                        </div>
                        <div>
                            <Label htmlFor="current_stock">Stok</Label>
                            <Input
                                id="current_stock"
                                type="number"
                                value={data.current_stock}
                                onChange={(e) =>
                                    setData("current_stock", e.target.value)
                                }
                                className="mt-1"
                            />
                            <InputError
                                message={errors.current_stock}
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <Label htmlFor="minimum_stock">Safety Stock</Label>
                            <Input
                                id="minimum_stock"
                                type="number"
                                value={data.minimum_stock}
                                onChange={(e) =>
                                    setData("minimum_stock", e.target.value)
                                }
                                className="mt-1"
                            />
                            <InputError
                                message={errors.minimum_stock}
                                className="mt-1"
                            />
                        </div>
                    </div>
                </div>

                {/* EOQ & ROP Parameters */}
                <div className="space-y-4">
                    <div className="border-b pb-2">
                        <h4 className="text-md font-medium text-gray-900">
                            Parameter EOQ & ROP
                        </h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="lead_time">Lead Time (Hari)</Label>
                            <Input
                                id="lead_time"
                                type="number"
                                value={data.lead_time}
                                onChange={(e) =>
                                    setData("lead_time", e.target.value)
                                }
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <Label htmlFor="daily_usage_rate">
                                Penggunaan Harian
                            </Label>
                            <Input
                                id="daily_usage_rate"
                                type="number"
                                step="0.1"
                                value={data.daily_usage_rate}
                                onChange={(e) =>
                                    setData("daily_usage_rate", e.target.value)
                                }
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <Label htmlFor="holding_cost_percentage">
                                Biaya Penyimpanan (%)
                            </Label>
                            <Input
                                id="holding_cost_percentage"
                                type="number"
                                step="0.01"
                                value={data.holding_cost_percentage}
                                onChange={(e) =>
                                    setData(
                                        "holding_cost_percentage",
                                        e.target.value
                                    )
                                }
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <Label htmlFor="ordering_cost">
                                Biaya Pemesanan (Rp)
                            </Label>
                            <Input
                                id="ordering_cost"
                                type="number"
                                value={data.ordering_cost}
                                onChange={(e) =>
                                    setData("ordering_cost", e.target.value)
                                }
                                className="mt-1"
                            />
                        </div>
                    </div>
                </div>

                {/* Tombol Aksi */}
                <div className="flex justify-end gap-3 pt-6 border-t">
                    {onClose && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={processing}
                        >
                            <X className="w-4 h-4 mr-2" />
                            Batal
                        </Button>
                    )}
                    <Button
                        type="submit"
                        disabled={processing}
                        className="bg-indigo-600 hover:bg-indigo-700 px-6"
                    >
                        {processing ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Menyimpan...
                            </div>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Update Produk
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
