import Layout from "@/Layouts/Layout";
import { Head, Link, useForm } from "@inertiajs/react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/Components/ui/table";
import { Button } from "@/Components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select";
import { useState } from "react";
import {
    AlertTriangle,
    Download,
    FileText,
    Package,
    Filter,
    AlertCircle,
    DollarSign,
} from "lucide-react";

export default function StockReport({
    auth,
    products,
    categories,
    filters = {},
    summary = {},
}) {
    const [isExporting, setIsExporting] = useState(false);

    const { data, setData, get, processing } = useForm({
        category_id: filters.category_id || "all",
        min_stock: filters.min_stock || "",
        max_stock: filters.max_stock || "",
        per_page: filters.per_page || 15,
    });

    const handleFilter = (e) => {
        e.preventDefault();

        // Validasi min_stock <= max_stock jika keduanya diisi
        if (
            data.min_stock &&
            data.max_stock &&
            parseInt(data.min_stock) > parseInt(data.max_stock)
        ) {
            alert("Stok minimum tidak boleh lebih besar dari stok maksimum");
            return;
        }

        get(route("reports.stock"), {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleReset = () => {
        setData({
            category_id: "all",
            min_stock: "",
            max_stock: "",
            per_page: 15,
        });

        get(route("reports.stock"), {
            data: {
                category_id: "all",
                min_stock: "",
                max_stock: "",
                per_page: 15,
            },
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleExport = (type) => {
        setIsExporting(true);
        setTimeout(() => setIsExporting(false), 3000);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(amount || 0);
    };

    const formatNumber = (num) => {
        return new Intl.NumberFormat("id-ID").format(num || 0);
    };

    // Use summary data from controller or calculate from products
    const getTotalProducts = () =>
        summary.total_products || products.data.length;
    const getLowStockCount = () =>
        summary.low_stock_count ||
        products.data.filter(
            (product) =>
                product.reorder_status?.urgent ||
                product.current_stock <= (product.rop || 0)
        ).length;
    const getZeroStockCount = () =>
        summary.zero_stock_count ||
        products.data.filter((product) => product.current_stock <= 0).length;
    const getTotalValue = () =>
        summary.total_value ||
        products.data.reduce(
            (total, product) =>
                total + product.current_stock * (product.price || 0),
            0
        );

    const getStockStatusBadge = (product) => {
        // Use reorder_status from controller if available
        if (product.reorder_status) {
            const status = product.reorder_status;
            let colorClasses = "";

            switch (status.status) {
                case "out_of_stock":
                    colorClasses = "bg-gray-100 text-gray-800";
                    break;
                case "below_rop":
                    colorClasses = "bg-red-100 text-red-800";
                    break;
                case "normal":
                    colorClasses = "bg-green-100 text-green-800";
                    break;
                default:
                    colorClasses = "bg-yellow-100 text-yellow-800";
            }

            return {
                status: status.message,
                color: colorClasses,
                icon: status.urgent ? (
                    <AlertTriangle className="h-3 w-3" />
                ) : null,
            };
        }

        // Fallback calculation
        const currentStock = product.current_stock || 0;
        const rop = product.rop || 0;

        if (currentStock <= 0) {
            return {
                status: "Habis",
                color: "bg-gray-100 text-gray-800",
                icon: <AlertTriangle className="h-3 w-3" />,
            };
        } else if (currentStock <= rop) {
            return {
                status: "Stok Rendah",
                color: "bg-red-100 text-red-800",
                icon: <AlertTriangle className="h-3 w-3" />,
            };
        } else {
            return {
                status: "Normal",
                color: "bg-green-100 text-green-800",
                icon: null,
            };
        }
    };

    return (
        <Layout
            user={auth.user}
            header={
                <h2 className="font-bold text-3xl text-gray-800 leading-tight">
                    Laporan Stok
                </h2>
            }
        >
            <Head title="Laporan Stok" />

            <div className="py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Bagian Filter */}
                    <Card className="mb-8 p-4 shadow-lg rounded-lg border border-gray-200">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-2xl font-semibold text-gray-700">
                                Filter Laporan Stok
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form
                                onSubmit={handleFilter}
                                className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end"
                            >
                                <div className="space-y-2">
                                    <Label className="text-gray-600 font-medium">
                                        Kategori Produk
                                    </Label>
                                    <Select
                                        onValueChange={(value) =>
                                            setData("category_id", value)
                                        }
                                        value={data.category_id}
                                    >
                                        <SelectTrigger className="focus:ring-indigo-500 focus:border-indigo-500">
                                            <SelectValue placeholder="Pilih kategori" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                Semua Kategori
                                            </SelectItem>
                                            {categories.map((category) => (
                                                <SelectItem
                                                    key={category.id}
                                                    value={category.id.toString()}
                                                >
                                                    {category.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-gray-600 font-medium">
                                        Stok Minimum
                                    </Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        placeholder="Contoh: 10"
                                        value={data.min_stock}
                                        onChange={(e) =>
                                            setData("min_stock", e.target.value)
                                        }
                                        className="focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-gray-600 font-medium">
                                        Stok Maksimum
                                    </Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        placeholder="Contoh: 100"
                                        value={data.max_stock}
                                        onChange={(e) =>
                                            setData("max_stock", e.target.value)
                                        }
                                        className="focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-gray-600 font-medium">
                                        Items per Page
                                    </Label>
                                    <Select
                                        onValueChange={(value) =>
                                            setData("per_page", value)
                                        }
                                        value={data.per_page.toString()}
                                    >
                                        <SelectTrigger className="focus:ring-indigo-500 focus:border-indigo-500">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="10">
                                                10
                                            </SelectItem>
                                            <SelectItem value="15">
                                                15
                                            </SelectItem>
                                            <SelectItem value="25">
                                                25
                                            </SelectItem>
                                            <SelectItem value="50">
                                                50
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="bg-indigo-600 text-white hover:bg-indigo-700"
                                    >
                                        {processing
                                            ? "Menerapkan..."
                                            : "Terapkan Filter"}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleReset}
                                        disabled={processing}
                                    >
                                        Reset
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Kartu Ringkasan */}
                    {(products.data.length > 0 ||
                        Object.keys(summary).length > 0) && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                            <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-2xl font-bold text-blue-600">
                                                {getTotalProducts()}
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                Total Produk
                                            </div>
                                        </div>
                                        <Package className="h-12 w-12 text-blue-500 opacity-80" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-2xl font-bold text-green-600">
                                                {formatCurrency(
                                                    getTotalValue()
                                                )}
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                Nilai Total Stok
                                            </div>
                                        </div>
                                        <DollarSign className="h-12 w-12 text-green-500 opacity-80" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card
                                className={`${
                                    getLowStockCount() > 0
                                        ? "bg-gradient-to-r from-red-50 to-red-100 border border-red-200"
                                        : "bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-200"
                                }`}
                            >
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div
                                                className={`text-2xl font-bold ${
                                                    getLowStockCount() > 0
                                                        ? "text-red-600"
                                                        : "text-emerald-600"
                                                }`}
                                            >
                                                {getLowStockCount()}
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                Stok Rendah
                                            </div>
                                        </div>
                                        <AlertTriangle
                                            className={`h-12 w-12 ${
                                                getLowStockCount() > 0
                                                    ? "text-red-500"
                                                    : "text-emerald-500"
                                            } opacity-80`}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-2xl font-bold text-gray-600">
                                                {getZeroStockCount()}
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                Stok Habis
                                            </div>
                                        </div>
                                        <AlertCircle className="h-12 w-12 text-gray-500 opacity-80" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Tabel Laporan Stok */}
                    <Card className="shadow-lg rounded-lg border border-gray-200">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-2xl font-semibold text-gray-700 flex items-center gap-2">
                                <Package className="h-6 w-6" />
                                Laporan Stok
                                {products.data.length > 0 && (
                                    <span className="text-sm font-normal text-gray-500">
                                        ({products.data.length} produk)
                                    </span>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto rounded-md border">
                                <Table className="min-w-full divide-y divide-gray-200">
                                    <TableHeader className="bg-gray-50">
                                        <TableRow>
                                            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Kode SKU
                                            </TableHead>
                                            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Nama Produk
                                            </TableHead>
                                            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Kategori
                                            </TableHead>
                                            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Supplier
                                            </TableHead>
                                            <TableHead className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Stok Saat Ini
                                            </TableHead>
                                            <TableHead className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                ROP
                                            </TableHead>
                                            <TableHead className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                EOQ
                                            </TableHead>
                                            <TableHead className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Nilai Stok
                                            </TableHead>
                                            <TableHead className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody className="bg-white divide-y divide-gray-200">
                                        {products.data.length > 0 ? (
                                            products.data.map((product) => {
                                                const stockStatus =
                                                    getStockStatusBadge(
                                                        product
                                                    );
                                                const stockValue =
                                                    (product.current_stock ||
                                                        0) *
                                                    (product.price || 0);

                                                return (
                                                    <TableRow
                                                        key={product.id}
                                                        className="hover:bg-gray-50 transition-colors"
                                                    >
                                                        <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                            {product.sku ||
                                                                product.code ||
                                                                "-"}
                                                        </TableCell>
                                                        <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                            {product.name}
                                                        </TableCell>
                                                        <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                            {product.category
                                                                ?.name || "-"}
                                                        </TableCell>
                                                        <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                            {product.supplier
                                                                ?.name || "-"}
                                                        </TableCell>
                                                        <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium text-blue-600">
                                                            {formatNumber(
                                                                product.current_stock
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-center text-orange-600 font-medium">
                                                            {formatNumber(
                                                                product.rop
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-center text-green-600 font-medium">
                                                            {formatNumber(
                                                                product.eoq
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-right text-purple-600 font-medium">
                                                            {formatCurrency(
                                                                stockValue
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                                            <span
                                                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${stockStatus.color}`}
                                                            >
                                                                {
                                                                    stockStatus.icon
                                                                }
                                                                {
                                                                    stockStatus.status
                                                                }
                                                            </span>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })
                                        ) : (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={9}
                                                    className="px-6 py-8 text-center text-sm text-gray-500"
                                                >
                                                    <div className="flex flex-col items-center gap-2">
                                                        <AlertCircle className="h-8 w-8 text-gray-400" />
                                                        <span>
                                                            Tidak ada data
                                                            produk yang sesuai
                                                            dengan filter.
                                                        </span>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={
                                                                handleReset
                                                            }
                                                            className="mt-2"
                                                        >
                                                            Hapus Filter
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Paginasi */}
                            {products.links && products.links.length > 3 && (
                                <div className="flex justify-center mt-6">
                                    <nav className="flex items-center space-x-2">
                                        {products.links.map((link, idx) => (
                                            <Link
                                                key={idx}
                                                href={link.url || "#"}
                                                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                                                    link.active
                                                        ? "bg-indigo-600 text-white shadow"
                                                        : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"
                                                } ${
                                                    !link.url
                                                        ? "cursor-not-allowed opacity-50"
                                                        : ""
                                                }`}
                                                dangerouslySetInnerHTML={{
                                                    __html: link.label,
                                                }}
                                            />
                                        ))}
                                    </nav>
                                </div>
                            )}
                        </CardContent>

                        {/* Tombol Ekspor */}
                        <div className="p-6 flex justify-end items-center gap-4 border-t border-gray-200">
                            <a
                                href={route("reports.stock.exportPdf", data)}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => handleExport("pdf")}
                            >
                                <Button
                                    disabled={isExporting}
                                    className="bg-red-600 hover:bg-red-700 text-white shadow-sm flex items-center gap-2"
                                >
                                    <Download className="h-4 w-4" />
                                    {isExporting
                                        ? "Mengekspor..."
                                        : "Ekspor PDF"}
                                </Button>
                            </a>
                            <a
                                href={route("reports.stock.exportExcel", data)}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => handleExport("excel")}
                            >
                                <Button
                                    disabled={isExporting}
                                    className="bg-green-600 hover:bg-green-700 text-white shadow-sm flex items-center gap-2"
                                >
                                    <Download className="h-4 w-4" />
                                    {isExporting
                                        ? "Mengekspor..."
                                        : "Ekspor Excel"}
                                </Button>
                            </a>
                        </div>
                    </Card>
                </div>
            </div>
        </Layout>
    );
}
