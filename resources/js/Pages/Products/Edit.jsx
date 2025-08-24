import { useForm } from "@inertiajs/react";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Textarea } from "@/Components/ui/textarea";
import InputError from "@/Components/InputError";
import { Save, X } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select";
import { useEffect } from "react";

export default function Edit({
    onClose,
    product,
    categories,
    suppliers,
    units,
}) {
    const { data, setData, put, processing, errors, reset } = useForm({
        category_id: product.category_id ? product.category_id.toString() : "",
        unit_id: product.unit_id ? product.unit_id.toString() : "",
        supplier_id: product.supplier_id ? product.supplier_id.toString() : "",
        name: product.name,
        sku: product.sku,
        code: product.code,
        description: product.description || "",
        price: product.price,
        lead_time: product.lead_time,
        daily_usage_rate: product.daily_usage_rate,
        holding_cost_percentage: product.holding_cost_percentage,
        ordering_cost: product.ordering_cost,
    });

    useEffect(() => {
        setData({
            category_id: product.category_id
                ? product.category_id.toString()
                : "",
            unit_id: product.unit_id ? product.unit_id.toString() : "",
            supplier_id: product.supplier_id
                ? product.supplier_id.toString()
                : "",
            name: product.name,
            sku: product.sku,
            code: product.code,
            description: product.description || "",
            price: product.price,
            lead_time: product.lead_time,
            daily_usage_rate: product.daily_usage_rate,
            holding_cost_percentage: product.holding_cost_percentage,
            ordering_cost: product.ordering_cost,
        });
    }, [product]);

    const submit = (e) => {
        e.preventDefault();
        put(route("products.update", product.id), {
            onSuccess: () => {
                if (onClose) onClose();
            },
        });
    };

    return (
        <form onSubmit={submit} className="space-y-4">
            {/* Input Nama Produk */}
            <div>
                <Label htmlFor="name">
                    Nama Produk <span className="text-red-500">*</span>
                </Label>
                <Input
                    id="name"
                    name="name"
                    value={data.name}
                    placeholder="Masukkan nama produk..."
                    onChange={(e) => setData("name", e.target.value)}
                />
                <InputError message={errors.name} className="mt-1" />
            </div>

            {/* Input SKU */}
            <div>
                <Label htmlFor="sku">
                    SKU <span className="text-red-500">*</span>
                </Label>
                <Input
                    id="sku"
                    name="sku"
                    value={data.sku}
                    placeholder="Masukkan SKU..."
                    onChange={(e) => setData("sku", e.target.value)}
                />
                <InputError message={errors.sku} className="mt-1" />
            </div>

            {/* Input Kode Produk */}
            <div>
                <Label htmlFor="code">Kode Produk</Label>
                <Input
                    id="code"
                    name="code"
                    value={data.code}
                    disabled
                    readOnly
                    className="bg-gray-100 cursor-not-allowed"
                />
                <InputError message={errors.code} className="mt-1" />
            </div>

            {/* Dropdown Kategori */}
            <div>
                <Label htmlFor="category_id">
                    Kategori <span className="text-red-500">*</span>
                </Label>
                <Select
                    onValueChange={(value) => setData("category_id", value)}
                    value={data.category_id}
                    modal
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pilih kategori..." />
                    </SelectTrigger>
                    <SelectContent>
                        {(categories ?? []).map((category) => (
                            <SelectItem
                                key={category.id}
                                value={category.id.toString()}
                            >
                                {category.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <InputError message={errors.category_id} className="mt-1" />
            </div>

            {/* Dropdown Satuan */}
            <div>
                <Label htmlFor="unit_id">
                    Satuan <span className="text-red-500">*</span>
                </Label>
                <Select
                    onValueChange={(value) => setData("unit_id", value)}
                    value={data.unit_id}
                    modal
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pilih satuan..." />
                    </SelectTrigger>
                    <SelectContent forceMount>
                        {(units ?? []).map((unit) => (
                            <SelectItem
                                key={unit.id}
                                value={unit.id.toString()}
                            >
                                {unit.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <InputError message={errors.unit_id} className="mt-1" />
            </div>

            {/* Dropdown Supplier - FIXED */}
            <div>
                <Label htmlFor="supplier_id">Supplier</Label>
                <Select
                    onValueChange={(value) => setData("supplier_id", value)}
                    value={data.supplier_id}
                    modal
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pilih supplier..." />
                    </SelectTrigger>
                    <SelectContent forceMount>
                        {(suppliers ?? []).map((supplier) => (
                            <SelectItem
                                key={supplier.id}
                                value={supplier.id.toString()}
                            >
                                {supplier.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <InputError message={errors.supplier_id} className="mt-1" />
            </div>

            {/* Input Harga */}
            <div>
                <Label>
                    Harga Jual (Rp) <span className="text-red-500">*</span>
                </Label>
                <Input
                    id="price"
                    name="price"
                    type="number"
                    value={data.price}
                    placeholder="Masukkan harga produk..."
                    onChange={(e) => setData("price", e.target.value)}
                    min="0"
                />
                <InputError message={errors.price} className="mt-1" />
            </div>

            {/* Lead Time */}
            <div>
                <Label>
                    Lead Time (Hari) <span className="text-red-500">*</span>
                </Label>
                <Input
                    type="number"
                    min="0"
                    value={data.lead_time}
                    onChange={(e) => setData("lead_time", e.target.value)}
                    placeholder="Contoh: 2"
                />
                <InputError message={errors.lead_time} />
            </div>

            {/* Deskripsi */}
            <div>
                <Label>Deskripsi</Label>
                <Textarea
                    value={data.description}
                    onChange={(e) => setData("description", e.target.value)}
                    placeholder="Opsional..."
                />
                <InputError message={errors.description} />
            </div>

            {/* Tombol Aksi */}
            <div className="flex justify-end gap-2 pt-2">
                {onClose && (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={processing}
                    >
                        <X className="w-4 h-4 mr-1" /> Batal
                    </Button>
                )}
                <Button type="submit" disabled={processing}>
                    {processing ? (
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Menyimpan...
                        </div>
                    ) : (
                        <>
                            <Save className="w-4 h-4 mr-1" /> Simpan Perubahan
                        </>
                    )}
                </Button>
            </div>
        </form>
    );
}
