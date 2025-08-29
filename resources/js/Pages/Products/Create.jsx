import { useForm, router } from "@inertiajs/react";
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
import { useEffect, useState } from "react";

export default function ProductCreate({
    onClose,
    categories = [],
    units = [],
    suppliers = [],
    generatedCode = "",
}) {
    // State untuk preview perhitungan EOQ & ROP
    const [calculationPreview, setCalculationPreview] = useState({
        rop: 0,
        eoq: 0,
    });

    const { data, setData, post, processing, errors, reset } = useForm({
        name: "",
        sku: "",
        code: generatedCode || "",
        description: "",
        category_id: "",
        unit_id: "",
        supplier_id: "none",
        price: "",
        lead_time: "7",
        current_stock: "0",
        minimum_stock: "10",
        daily_usage_rate: "0.5",
        holding_cost_percentage: "0.2",
        ordering_cost: "25000",
    });

    // Update code when generatedCode changes
    useEffect(() => {
        if (generatedCode) {
            setData("code", generatedCode);
        }
    }, [generatedCode]);

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

        // Convert empty supplier_id to null
        const submitData = {
            ...data,
            supplier_id: data.supplier_id === "none" ? null : data.supplier_id,
        };

        console.log("Submitting product data:", submitData);

        // Submit dengan proper error handling
        post(route("products.store"), {
            onSuccess: (page) => {
                console.log("Product created successfully", page);
                reset(); // Reset form
                if (onClose) {
                    onClose(); // Close modal - controller handles redirect
                }
            },
            onError: (errors) => {
                console.error("Product creation errors:", errors);
            },
            onFinish: () => {
                console.log("Request finished");
            },
        });
    };

    return (
        <div className="space-y-6">
            {/* Header dengan Preview */}
            <div className="flex items-center gap-3 pb-4 border-b">
                <div className="p-2 bg-indigo-100 rounded-lg">
                    <Package className="h-5 w-5 text-indigo-600" />
                </div>
                <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                        Tambah Produk Baru
                    </h3>
                    <p className="text-sm text-gray-500">
                        Isi informasi produk dengan lengkap
                    </p>
                </div>

                {/* Real-time Calculation Preview */}
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
                {/* Basic Information */}
                <div className="space-y-4">
                    <h4 className="text-md font-medium text-gray-900 border-b pb-2">
                        Informasi Dasar
                    </h4>

                    {/* Product Name */}
                    <div>
                        <Label htmlFor="name">
                            Nama Produk <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="name"
                            value={data.name}
                            onChange={(e) => setData("name", e.target.value)}
                            placeholder="Contoh: Kertas HVS A4"
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
                            placeholder="Contoh: Kertas_HVS"
                            className="mt-1"
                        />
                        <InputError message={errors.sku} className="mt-1" />
                        <p className="text-xs text-gray-500 mt-1">
                            SKU harus unik untuk setiap produk
                        </p>
                    </div>

                    {/* Product Code */}
                    <div>
                        <Label htmlFor="code">Kode Produk (Otomatis)</Label>
                        <Input
                            id="code"
                            value={data.code}
                            disabled
                            className="mt-1 bg-gray-50 cursor-not-allowed"
                        />
                        <InputError message={errors.code} className="mt-1" />
                        <p className="text-xs text-gray-500 mt-1">
                            Kode produk dihasilkan otomatis
                        </p>
                    </div>

                    {/* Description */}
                    <div>
                        <Label htmlFor="description">Deskripsi</Label>
                        <Textarea
                            id="description"
                            value={data.description}
                            onChange={(e) =>
                                setData("description", e.target.value)
                            }
                            placeholder="Deskripsi detail produk (opsional)..."
                            rows={3}
                            className="mt-1"
                        />
                        <InputError
                            message={errors.description}
                            className="mt-1"
                        />
                    </div>
                </div>

                {/* Category and Classification */}
                <div className="space-y-4">
                    <h4 className="text-md font-medium text-gray-900 border-b pb-2">
                        Klasifikasi
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Category */}
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
                            <InputError
                                message={errors.category_id}
                                className="mt-1"
                            />
                        </div>

                        {/* Unit */}
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
                                    {units && units.length > 0 ? (
                                        units.map((unit) => (
                                            <SelectItem
                                                key={unit.id}
                                                value={String(unit.id)}
                                            >
                                                {unit.name}{" "}
                                                {unit.symbol &&
                                                    `(${unit.symbol})`}
                                            </SelectItem>
                                        ))
                                    ) : (
                                        <div className="px-2 py-1 text-sm text-gray-500">
                                            Tidak ada satuan tersedia
                                        </div>
                                    )}
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
                                    <SelectValue placeholder="Pilih supplier (opsional)..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">
                                        Tidak ada supplier
                                    </SelectItem>
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
                            <InputError
                                message={errors.supplier_id}
                                className="mt-1"
                            />
                        </div>
                    </div>
                </div>

                {/* Pricing and Stock */}
                <div className="space-y-4">
                    <h4 className="text-md font-medium text-gray-900 border-b pb-2">
                        Harga & Stok
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Price */}
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
                                placeholder="55000"
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

                        {/* Current Stock */}
                        <div>
                            <Label htmlFor="current_stock">Stok Awal</Label>
                            <Input
                                id="current_stock"
                                type="number"
                                min="0"
                                value={data.current_stock}
                                onChange={(e) =>
                                    setData("current_stock", e.target.value)
                                }
                                placeholder="0"
                                className="mt-1"
                            />
                            <InputError
                                message={errors.current_stock}
                                className="mt-1"
                            />
                        </div>

                        {/* Safety Stock */}
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
                                placeholder="10"
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
                        {/* Lead Time */}
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
                                placeholder="7"
                                className="mt-1"
                            />
                            <InputError
                                message={errors.lead_time}
                                className="mt-1"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Waktu tunggu pengiriman dari supplier
                            </p>
                        </div>

                        {/* Daily Usage Rate */}
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
                                placeholder="0.5"
                                className="mt-1"
                            />
                            <InputError
                                message={errors.daily_usage_rate}
                                className="mt-1"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Rata-rata penggunaan per hari
                            </p>
                        </div>

                        {/* Holding Cost Percentage */}
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
                                placeholder="0.2"
                                className="mt-1"
                            />
                            <InputError
                                message={errors.holding_cost_percentage}
                                className="mt-1"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Contoh: 0.2 = 20% dari harga beli per tahun
                            </p>
                        </div>

                        {/* Ordering Cost */}
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
                                placeholder="25000"
                                className="mt-1"
                            />
                            <InputError
                                message={errors.ordering_cost}
                                className="mt-1"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Biaya tetap per order (admin + ongkir)
                            </p>
                        </div>
                    </div>

                    {/* EOQ/ROP Info Box */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="text-sm text-blue-800">
                            <h5 className="font-medium mb-2">
                                Formula Perhitungan:
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
                                Simpan Produk
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
