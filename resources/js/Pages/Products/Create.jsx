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

export default function Create({
    onClose,
    categories,
    units,
    suppliers,
    generatedCode,
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        category_id: "",
        unit_id: "",
        supplier_id: "",
        name: "",
        sku: "",
        code: generatedCode ?? "",
        description: "",
        price: "",
        lead_time: "",
    });

    const submit = (e) => {
        e.preventDefault();
        post(route("products.store"), {
            onSuccess: () => {
                reset();
                if (onClose) onClose();
            },
        });
    };

    return (
        <form onSubmit={submit} className="space-y-4">
            {/* Nama Produk */}
            <div>
                <Label>
                    Nama Produk <span className="text-red-500">*</span>
                </Label>
                <Input
                    value={data.name}
                    onChange={(e) => setData("name", e.target.value)}
                    placeholder="Masukkan nama produk..."
                />
                <InputError message={errors.name} />
            </div>

            {/* SKU */}
            <div>
                <Label>
                    SKU <span className="text-red-500">*</span>
                </Label>
                <Input
                    value={data.sku}
                    onChange={(e) => setData("sku", e.target.value)}
                    placeholder="Masukkan SKU produk..."
                />
                <InputError message={errors.sku} />
            </div>

            {/* Kode Produk */}
            <div>
                <Label>Kode Produk (Otomatis)</Label>
                <Input
                    value={data.code}
                    readOnly
                    className="bg-muted cursor-not-allowed"
                />
                <InputError message={errors.code} />
            </div>

            {/* Kategori */}
            <div>
                <Label>
                    Kategori <span className="text-red-500">*</span>
                </Label>
                <Select
                    value={data.category_id || undefined}
                    onValueChange={(value) => setData("category_id", value)}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Pilih kategori..." />
                    </SelectTrigger>
                    <SelectContent>
                        {categories &&
                        Array.isArray(categories) &&
                        categories.length > 0 ? (
                            categories.map((category) => (
                                <SelectItem
                                    key={category.id}
                                    value={category.id.toString()}
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
                <InputError message={errors.category_id} />
            </div>

            {/* Satuan */}
            <div>
                <Label>
                    Satuan <span className="text-red-500">*</span>
                </Label>
                <Select
                    value={data.unit_id || undefined}
                    onValueChange={(value) => setData("unit_id", value)}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Pilih satuan..." />
                    </SelectTrigger>
                    <SelectContent>
                        {units && Array.isArray(units) && units.length > 0 ? (
                            units.map((unit) => (
                                <SelectItem
                                    key={unit.id}
                                    value={unit.id.toString()}
                                >
                                    {unit.name}
                                </SelectItem>
                            ))
                        ) : (
                            <div className="px-2 py-1 text-sm text-gray-500">
                                Tidak ada satuan tersedia
                            </div>
                        )}
                    </SelectContent>
                </Select>
                <InputError message={errors.unit_id} />
            </div>

            {/* Supplier */}
            <div>
                <Label>Supplier</Label>
                <Select
                    value={data.supplier_id || undefined}
                    onValueChange={(value) => setData("supplier_id", value)}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Pilih supplier..." />
                    </SelectTrigger>
                    <SelectContent>
                        {suppliers &&
                        Array.isArray(suppliers) &&
                        suppliers.length > 0 ? (
                            suppliers.map((supplier) => (
                                <SelectItem
                                    key={supplier.id}
                                    value={supplier.id.toString()}
                                >
                                    {supplier.name}
                                    {supplier.code && ` (${supplier.code})`}
                                </SelectItem>
                            ))
                        ) : (
                            <div className="px-2 py-1 text-sm text-gray-500">
                                Tidak ada supplier tersedia
                            </div>
                        )}
                    </SelectContent>
                </Select>
                <InputError message={errors.supplier_id} />
            </div>

            {/* Harga */}
            <div>
                <Label>
                    Harga Jual (Rp) <span className="text-red-500">*</span>
                </Label>
                <Input
                    type="number"
                    min="0"
                    value={data.price}
                    onChange={(e) => setData("price", e.target.value)}
                    placeholder="Masukkan harga jual..."
                />
                <InputError message={errors.price} />
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
                            <Save className="w-4 h-4 mr-1" /> Simpan
                        </>
                    )}
                </Button>
            </div>
        </form>
    );
}
