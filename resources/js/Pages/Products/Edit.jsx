import { useForm } from "@inertiajs/react";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Textarea } from "@/Components/ui/textarea";
import InputError from "@/Components/InputError";
import { Save, X, Package, Calculator } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select";
import { useState, useEffect } from "react";

export default function ProductEdit({
    onClose,
    categories = [],
    units = [],
    suppliers = [],
    product, // <-- product data dari backend
}) {
    // State untuk preview perhitungan EOQ & ROP
    const [calculationPreview, setCalculationPreview] = useState({
        rop: 0,
        eoq: 0,
    });

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

    // Function untuk menghitung EOQ & ROP secara real-time
    const calculatePreview = () => {
        const dailyUsage = parseFloat(data.daily_usage_rate) || 0.5;
        const leadTime = parseInt(data.lead_time) || 7;
        const safetyStock = parseInt(data.minimum_stock) || 10;
        const annualDemand = dailyUsage * 365;
        const orderingCost = parseFloat(data.ordering_cost) || 25000;
        const holdingCostPercentage =
            parseFloat(data.holding_cost_percentage) || 0.2;
        const price = parseFloat(data.price) || 0;

        // Hitung ROP: (Lead Time × Daily Usage) + Safety Stock
        const rop = Math.round(leadTime * dailyUsage + safetyStock);

        // Hitung EOQ: √((2 × Annual Demand × Ordering Cost) / (Price × Holding Cost %))
        let eoq = 1;
        if (
            price > 0 &&
            holdingCostPercentage > 0 &&
            annualDemand > 0 &&
            orderingCost > 0
        ) {
            const holdingCostPerUnit = price * holdingCostPercentage;
            const numerator = 2 * annualDemand * orderingCost;
            eoq = Math.round(Math.sqrt(numerator / holdingCostPerUnit));
        }

        setCalculationPreview({
            rop: Math.max(rop, 1),
            eoq: Math.max(eoq, 1),
        });
    };

    // Update preview saat data berubah
    useEffect(() => {
        calculatePreview();
    }, [
        data.daily_usage_rate,
        data.lead_time,
        data.minimum_stock,
        data.price,
        data.holding_cost_percentage,
        data.ordering_cost,
    ]);

    const submit = (e) => {
        e.preventDefault();

        const submitData = {
            ...data,
            supplier_id: data.supplier_id === "none" ? null : data.supplier_id,
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
                <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                        Edit Produk
                    </h3>
                    <p className="text-sm text-gray-500">
                        Ubah informasi produk sesuai kebutuhan
                    </p>
                </div>

                {/* Preview Calculation Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                        <Calculator className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">
                            Preview Perhitungan
                        </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-blue-600">ROP:</span>
                            <span className="font-bold text-blue-900 ml-1">
                                {calculationPreview.rop}
                            </span>
                        </div>
                        <div>
                            <span className="text-blue-600">EOQ:</span>
                            <span className="font-bold text-blue-900 ml-1">
                                {calculationPreview.eoq}
                            </span>
                        </div>
                    </div>
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
                        <p className="text-xs text-gray-500 mt-1">
                            Kode produk tidak dapat diubah
                        </p>
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
                            <Label htmlFor="price">
                                Harga Standar (Rp){" "}
                                <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="price"
                                type="number"
                                min="0"
                                step="0.01"
                                value={data.price}
                                onChange={(e) =>
                                    setData("price", e.target.value)
                                }
                                className="mt-1"
                            />
                            <InputError
                                message={errors.price}
                                className="mt-1"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Harga untuk perhitungan EOQ
                            </p>
                        </div>
                        <div>
                            <Label htmlFor="current_stock">Stok Saat Ini</Label>
                            <Input
                                id="current_stock"
                                type="number"
                                min="0"
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
                                min="0"
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
                            <p className="text-xs text-gray-500 mt-1">
                                Stok minimum untuk keamanan
                            </p>
                        </div>
                    </div>
                </div>

                {/* EOQ & ROP Parameters */}
                <div className="space-y-4">
                    <div className="border-b pb-2">
                        <h4 className="text-md font-medium text-gray-900">
                            Parameter EOQ & ROP
                        </h4>
                        <p className="text-sm text-gray-500">
                            Parameter untuk perhitungan Economic Order Quantity
                            dan Reorder Point
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="lead_time">Lead Time (Hari)</Label>
                            <Input
                                id="lead_time"
                                type="number"
                                min="1"
                                max="365"
                                value={data.lead_time}
                                onChange={(e) =>
                                    setData("lead_time", e.target.value)
                                }
                                className="mt-1"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Waktu tunggu pengiriman dari supplier
                            </p>
                        </div>
                        <div>
                            <Label htmlFor="daily_usage_rate">
                                Penggunaan Harian (unit/hari)
                            </Label>
                            <Input
                                id="daily_usage_rate"
                                type="number"
                                min="0"
                                step="0.1"
                                value={data.daily_usage_rate}
                                onChange={(e) =>
                                    setData("daily_usage_rate", e.target.value)
                                }
                                className="mt-1"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Rata-rata penggunaan per hari
                            </p>
                        </div>
                        <div>
                            <Label htmlFor="holding_cost_percentage">
                                Biaya Penyimpanan (%)
                            </Label>
                            <Input
                                id="holding_cost_percentage"
                                type="number"
                                min="0"
                                max="1"
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
                            <p className="text-xs text-gray-500 mt-1">
                                Contoh: 0.2 = 20% dari harga beli per tahun
                            </p>
                        </div>
                        <div>
                            <Label htmlFor="ordering_cost">
                                Biaya Pemesanan (Rp)
                            </Label>
                            <Input
                                id="ordering_cost"
                                type="number"
                                min="0"
                                step="1"
                                value={data.ordering_cost}
                                onChange={(e) =>
                                    setData("ordering_cost", e.target.value)
                                }
                                className="mt-1"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Biaya tetap per order (admin + ongkir)
                            </p>
                        </div>
                    </div>

                    {/* Formula Info Box */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="text-sm text-green-800">
                            <h5 className="font-medium mb-2">
                                📊 Formula Perhitungan:
                            </h5>
                            <ul className="space-y-1 text-xs">
                                <li>
                                    <strong>ROP</strong> = (Lead Time ×
                                    Penggunaan Harian) + Safety Stock
                                </li>
                                <li>
                                    <strong>EOQ</strong> = √((2 × Annual Demand
                                    × Biaya Pemesanan) / (Harga Beli × Biaya
                                    Penyimpanan))
                                </li>
                                <li>
                                    Annual Demand = Penggunaan Harian × 365 hari
                                </li>
                                <li>
                                    Preview di atas akan terupdate otomatis saat
                                    Anda mengubah parameter
                                </li>
                            </ul>
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
