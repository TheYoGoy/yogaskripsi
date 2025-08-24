import { useForm } from "@inertiajs/react";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Textarea } from "@/Components/ui/textarea";
import InputError from "@/Components/InputError";
import { Save, X } from "lucide-react";
import { useEffect } from "react";

export default function SupplierEdit({ supplier, onClose }) {
    const { data, setData, put, processing, errors } = useForm({
        code: supplier.code ?? "",
        name: supplier.name || "",
        contact_person: supplier.contact_person || "",
        phone: supplier.phone || "",
        email: supplier.email || "",
        address: supplier.address || "",
    });

    useEffect(() => {
        setData({
            name: supplier.name || "",
            contact_person: supplier.contact_person || "",
            phone: supplier.phone || "",
            email: supplier.email || "",
            address: supplier.address || "",
        });
    }, [supplier]);

    const submit = (e) => {
        e.preventDefault();
        put(route("suppliers.update", supplier.id), {
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
                    Nama Supplier<span className="text-red-500">*</span>
                </Label>
                <Input
                    id="name"
                    name="name"
                    value={data.name}
                    placeholder="Masukkan nama supplier..."
                    onChange={(e) => setData("name", e.target.value)}
                />
                <InputError message={errors.name} className="mt-1" />
            </div>

            {/* Contact Person */}
            <div>
                <Label htmlFor="contact_person">Contact Person</Label>
                <Input
                    id="contact_person"
                    name="contact_person"
                    value={data.contact_person}
                    placeholder="Masukkan nama contact person..."
                    onChange={(e) => setData("contact_person", e.target.value)}
                />
                <InputError message={errors.contact_person} className="mt-1" />
            </div>

            {/* Code Supplier */}
            <div>
                <Label htmlFor="code">Supplier Code</Label>
                <Input
                    id="code"
                    type="text"
                    name="code"
                    value={data.code}
                    className="mt-1 block w-full bg-gray-100 cursor-not-allowed"
                    disabled
                    readOnly
                />
                <InputError message={errors.code} className="mt-2" />
            </div>

            {/* Phone */}
            <div>
                <Label htmlFor="phone">Nomor Telepon</Label>
                <Input
                    id="phone"
                    name="phone"
                    value={data.phone}
                    placeholder="Masukkan nomor telepon..."
                    onChange={(e) => setData("phone", e.target.value)}
                />
                <InputError message={errors.phone} className="mt-1" />
            </div>

            {/* Email */}
            <div>
                <Label htmlFor="email">Email</Label>
                <Input
                    id="email"
                    name="email"
                    type="email"
                    value={data.email}
                    placeholder="Masukkan email supplier..."
                    onChange={(e) => setData("email", e.target.value)}
                />
                <InputError message={errors.email} className="mt-1" />
            </div>

            {/* Address */}
            <div>
                <Label htmlFor="address">Alamat</Label>
                <Textarea
                    id="address"
                    name="address"
                    value={data.address}
                    placeholder="Masukkan alamat supplier..."
                    onChange={(e) => setData("address", e.target.value)}
                />
                <InputError message={errors.address} className="mt-1" />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
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
                            Memperbarui...
                        </div>
                    ) : (
                        <>
                            <Save className="w-4 h-4 mr-1" /> Perbarui
                        </>
                    )}
                </Button>
            </div>
        </form>
    );
}
