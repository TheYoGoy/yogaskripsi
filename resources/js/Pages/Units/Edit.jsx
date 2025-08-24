import { useForm } from "@inertiajs/react";
import { useEffect } from "react";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Textarea } from "@/Components/ui/textarea";
import InputError from "@/Components/InputError";
import { Save, X } from "lucide-react";

export default function Edit({ unit, onClose }) {
    // ✅ Fixed: Removed unused 'post' from destructuring
    const { data, setData, put, processing, errors } = useForm({
        name: "",
        symbol: "",
        description: "",
    });

    useEffect(() => {
        if (unit) {
            setData({
                name: unit.name || "",
                symbol: unit.symbol || "",
                description: unit.description || "",
            });
        }
    }, [unit]);

    const submit = (e) => {
        e.preventDefault();
        put(route("units.update", unit.id), {
            onSuccess: () => {
                if (onClose) onClose();
            },
        });
    };

    return (
        <form onSubmit={submit} className="space-y-6">
            {/* Name */}
            <div>
                <Label htmlFor="name">
                    Nama Satuan<span className="text-red-500">*</span>
                </Label>
                <Input
                    id="name"
                    name="name"
                    value={data.name}
                    placeholder="Masukkan nama satuan..."
                    onChange={(e) => setData("name", e.target.value)}
                    className="mt-1"
                />
                <InputError message={errors.name} className="mt-1" />
            </div>

            {/* Symbol */}
            <div>
                <Label htmlFor="symbol">
                    Simbol<span className="text-red-500">*</span>
                </Label>
                <Input
                    id="symbol"
                    name="symbol"
                    value={data.symbol}
                    placeholder="Contoh: kg, m, pcs"
                    onChange={(e) => setData("symbol", e.target.value)}
                    className="mt-1"
                />
                <InputError message={errors.symbol} className="mt-1" />
            </div>

            {/* Description */}
            <div>
                <Label htmlFor="description">Deskripsi (Opsional)</Label>
                <Textarea
                    id="description"
                    name="description"
                    value={data.description}
                    placeholder="Deskripsi satuan..."
                    onChange={(e) => setData("description", e.target.value)}
                    className="mt-1"
                    rows={3}
                />
                <InputError message={errors.description} className="mt-1" />
            </div>

            {/* Actions */}
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
