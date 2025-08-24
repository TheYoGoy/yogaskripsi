import { useForm } from "@inertiajs/react";
import { useEffect } from "react";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Textarea } from "@/Components/ui/textarea";
import InputError from "@/Components/InputError";
import { Save, X } from "lucide-react";

export default function Edit({ category, onClose }) {
    const { data, setData, put, processing, errors } = useForm({
        name: "",
        description: "",
    });

    useEffect(() => {
        if (category) {
            setData({
                name: category.name || "",
                description: category.description || "",
            });
        }
    }, [category]);

    const submit = (e) => {
        e.preventDefault();
        put(route("categories.update", category.id), {
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
                    Nama Kategori<span className="text-red-500">*</span>
                </Label>
                <Input
                    id="name"
                    name="name"
                    value={data.name}
                    placeholder="Masukkan nama kategori..."
                    onChange={(e) => setData("name", e.target.value)}
                    className="mt-1"
                />
                <InputError message={errors.name} className="mt-1" />
            </div>

            {/* Description */}
            <div>
                <Label htmlFor="description">Deskripsi (Opsional)</Label>
                <Textarea
                    id="description"
                    name="description"
                    value={data.description}
                    placeholder="Deskripsi kategori..."
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
