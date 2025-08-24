import React, { useState } from "react";
import { Head, useForm } from "@inertiajs/react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/Components/ui/tabs";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardFooter,
} from "@/Components/ui/card";
import { Input } from "@/Components/ui/input";
import { Button } from "@/Components/ui/button";
import { Label } from "@/Components/ui/label";
import { Switch } from "@/Components/ui/switch";
import { useToast } from "@/Components/ui/use-toast";
import Layout from "@/Layouts/Layout";
import { usePage } from "@inertiajs/react";
import dayjs from "dayjs";

export default function SettingsIndex({ setting }) {
    const { settings } = usePage().props;

    const { data, setData, post, processing, errors } = useForm({
        company_name: setting.company_name || "",
        company_logo: null,
        stock_prefix_in: setting.stock_prefix_in || "IN-",
        stock_prefix_out: setting.stock_prefix_out || "OUT-",
        stock_min_threshold: setting.stock_min_threshold || 0,
        default_lead_time: setting.default_lead_time || 0,
        default_ordering_cost: setting.default_ordering_cost || 0,
        default_holding_cost: setting.default_holding_cost || 0,
        default_safety_stock: setting.default_safety_stock || 5,
        default_safety_stock_percentage:
            setting.default_safety_stock_percentage || 10.0,
        rop_formula: setting.rop_formula || "lead_time_demand",
        date_format: setting.date_format || "DD-MM-YYYY",
        time_format: setting.time_format || "HH:mm",
        timezone: setting.timezone || "Asia/Jakarta",
        dark_mode: setting.dark_mode || false,
    });

    const [preview, setPreview] = useState(
        setting.company_logo ? `/storage/${setting.company_logo}` : null
    );

    const { toast } = useToast();

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("settings.update"), {
            onSuccess: () =>
                toast({
                    title: "Berhasil",
                    description: "Pengaturan berhasil diperbarui",
                }),
            preserveScroll: true,
        });
    };

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData("company_logo", file);
            setPreview(URL.createObjectURL(file));
        }
    };

    return (
        <Layout title="Pengaturan">
            <Head title="Pengaturan" />
            <Tabs defaultValue="general">
                <TabsList>
                    <TabsTrigger value="general">Umum</TabsTrigger>
                    <TabsTrigger value="stock">Stok</TabsTrigger>
                    <TabsTrigger value="ropeoq">ROP & EOQ</TabsTrigger>
                    <TabsTrigger value="format">Format</TabsTrigger>
                </TabsList>

                {/* UMUM */}
                <TabsContent value="general">
                    <Card>
                        <CardHeader>
                            <CardTitle>Pengaturan Umum</CardTitle>
                        </CardHeader>
                        <form onSubmit={handleSubmit}>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label>Nama Perusahaan</Label>
                                    <Input
                                        value={data.company_name}
                                        onChange={(e) =>
                                            setData(
                                                "company_name",
                                                e.target.value
                                            )
                                        }
                                        placeholder="Nama Perusahaan"
                                    />
                                    {errors.company_name && (
                                        <div className="text-red-500 text-sm">
                                            {errors.company_name}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <Label>Logo Perusahaan</Label>
                                    {preview && (
                                        <img
                                            src={preview}
                                            alt="Preview Logo"
                                            className="w-32 h-32 object-contain mb-2 border rounded"
                                        />
                                    )}
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleLogoChange}
                                    />
                                    {errors.company_logo && (
                                        <div className="text-red-500 text-sm">
                                            {errors.company_logo}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                            <CardFooter className="justify-end">
                                <Button type="submit" disabled={processing}>
                                    Simpan Pengaturan
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>
                </TabsContent>

                {/* STOK */}
                <TabsContent value="stock">
                    <Card>
                        <CardHeader>
                            <CardTitle>Pengaturan Stok</CardTitle>
                        </CardHeader>
                        <form onSubmit={handleSubmit}>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label>Prefix Stok Masuk</Label>
                                    <Input
                                        value={data.stock_prefix_in}
                                        onChange={(e) =>
                                            setData(
                                                "stock_prefix_in",
                                                e.target.value
                                            )
                                        }
                                        placeholder="IN-"
                                    />
                                    {errors.stock_prefix_in && (
                                        <div className="text-red-500 text-sm">
                                            {errors.stock_prefix_in}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <Label>Prefix Stok Keluar</Label>
                                    <Input
                                        value={data.stock_prefix_out}
                                        onChange={(e) =>
                                            setData(
                                                "stock_prefix_out",
                                                e.target.value
                                            )
                                        }
                                        placeholder="OUT-"
                                    />
                                    {errors.stock_prefix_out && (
                                        <div className="text-red-500 text-sm">
                                            {errors.stock_prefix_out}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <Label>Threshold Stok Minimum</Label>
                                    <Input
                                        type="number"
                                        value={data.stock_min_threshold}
                                        onChange={(e) =>
                                            setData(
                                                "stock_min_threshold",
                                                e.target.value
                                            )
                                        }
                                        placeholder="0"
                                    />
                                    {errors.stock_min_threshold && (
                                        <div className="text-red-500 text-sm">
                                            {errors.stock_min_threshold}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <Label>default_lead_time (hari)</Label>
                                    <Input
                                        label="Default Lead Time (hari)"
                                        type="number"
                                        value={data.default_lead_time}
                                        onChange={(e) =>
                                            setData(
                                                "default_lead_time",
                                                e.target.value
                                            )
                                        }
                                    />
                                    {errors.default_lead_time && (
                                        <div className="text-red-500 text-sm">
                                            {errors.default_lead_time}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <Label>default_ordering_cost</Label>
                                    <Input
                                        label="Default Ordering Cost"
                                        type="number"
                                        value={data.default_ordering_cost}
                                        onChange={(e) =>
                                            setData(
                                                "default_ordering_cost",
                                                e.target.value
                                            )
                                        }
                                    />
                                    {errors.default_ordering_cost && (
                                        <div className="text-red-500 text-sm">
                                            {errors.default_ordering_cost}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <Label>default_holding_cost</Label>
                                    <Input
                                        label="Default Holding Cost (%)"
                                        type="number"
                                        step="0.01"
                                        value={data.default_holding_cost}
                                        onChange={(e) =>
                                            setData(
                                                "default_holding_cost",
                                                e.target.value
                                            )
                                        }
                                    />
                                    {errors.default_holding_cost && (
                                        <div className="text-red-500 text-sm">
                                            {errors.default_holding_cost}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                            <CardFooter className="justify-end">
                                <Button type="submit" disabled={processing}>
                                    Simpan Pengaturan Stok
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>
                </TabsContent>

                {/* ROP & EOQ */}
                <TabsContent value="ropeoq">
                    <Card>
                        <CardHeader>
                            <CardTitle>Pengaturan ROP & EOQ</CardTitle>
                        </CardHeader>
                        <form onSubmit={handleSubmit}>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label>Safety Stock Default</Label>
                                    <Input
                                        label="Default Safety Stock"
                                        type="number"
                                        value={data.default_safety_stock}
                                        onChange={(e) =>
                                            setData(
                                                "default_safety_stock",
                                                e.target.value
                                            )
                                        }
                                    />
                                    {errors.default_safety_stock && (
                                        <div className="text-red-500 text-sm">
                                            {errors.default_safety_stock}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <Label>Safety Stock (%)</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={
                                            data.default_safety_stock_percentage
                                        }
                                        onChange={(e) =>
                                            setData(
                                                "default_safety_stock_percentage",
                                                e.target.value
                                            )
                                        }
                                        placeholder="10.00"
                                    />
                                    {errors.default_safety_stock_percentage && (
                                        <div className="text-red-500 text-sm">
                                            {
                                                errors.default_safety_stock_percentage
                                            }
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <Label>ROP Formula</Label>
                                    <Input
                                        value={data.rop_formula}
                                        onChange={(e) =>
                                            setData(
                                                "rop_formula",
                                                e.target.value
                                            )
                                        }
                                        placeholder="lead_time_demand"
                                    />
                                    {errors.rop_formula && (
                                        <div className="text-red-500 text-sm">
                                            {errors.rop_formula}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                            <CardFooter className="justify-end">
                                <Button type="submit" disabled={processing}>
                                    Simpan Pengaturan ROP & EOQ
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>
                </TabsContent>

                {/* FORMAT */}
                <TabsContent value="format">
                    <Card>
                        <CardHeader>
                            <CardTitle>Pengaturan Format</CardTitle>
                        </CardHeader>
                        <form onSubmit={handleSubmit}>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label>Format Tanggal</Label>
                                    <Input
                                        value={data.date_format}
                                        onChange={(e) =>
                                            setData(
                                                "date_format",
                                                e.target.value
                                            )
                                        }
                                        placeholder="DD-MM-YYYY"
                                    />
                                    {errors.date_format && (
                                        <div className="text-red-500 text-sm">
                                            {errors.date_format}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <Label>Zona Waktu</Label>
                                    <Input
                                        value={data.timezone}
                                        onChange={(e) =>
                                            setData("timezone", e.target.value)
                                        }
                                        placeholder="Asia/Jakarta"
                                    />
                                    {errors.timezone && (
                                        <div className="text-red-500 text-sm">
                                            {errors.timezone}
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="dark_mode"
                                        checked={data.dark_mode}
                                        onCheckedChange={(checked) =>
                                            setData("dark_mode", checked)
                                        }
                                    />
                                    <Label htmlFor="dark_mode">
                                        Aktifkan Dark Mode
                                    </Label>
                                </div>
                            </CardContent>
                            <CardFooter className="justify-end">
                                <Button type="submit" disabled={processing}>
                                    Simpan Format
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>
                </TabsContent>
            </Tabs>
        </Layout>
    );
}
