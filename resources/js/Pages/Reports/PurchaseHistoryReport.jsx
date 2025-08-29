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
import {
    Download,
    FileText,
    AlertCircle,
    ShoppingCart,
    DollarSign,
    TrendingUp,
    Package,
} from "lucide-react";
import { useState } from "react";

export default function PurchaseHistoryReport({
    auth,
    purchases,
    suppliers = [],
    filters = {},
    summary = {},
}) {
    const [isExporting, setIsExporting] = useState(false);

    const { data, setData, get, processing } = useForm({
        supplier_id: filters.supplier_id || "all",
        start_date: filters.start_date || "",
        end_date: filters.end_date || "",
        per_page: filters.per_page || 15,
    });

    const handleFilter = (e) => {
        e.preventDefault();

        // Validasi rentang tanggal
        if (
            data.start_date &&
            data.end_date &&
            new Date(data.start_date) > new Date(data.end_date)
        ) {
            alert("Tanggal mulai tidak boleh lebih lambat dari tanggal akhir");
            return;
        }

        get(route("reports.purchase-history"), {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleReset = () => {
        setData({
            supplier_id: "all",
            start_date: "",
            end_date: "",
            per_page: 15,
        });
        get(route("reports.purchase-history"), {
            data: {
                supplier_id: "all",
                start_date: "",
                end_date: "",
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

    const formatDate = (dateString) => {
        try {
            return new Date(dateString).toLocaleDateString("id-ID", {
                year: "numeric",
                month: "short",
                day: "numeric",
            });
        } catch (error) {
            return dateString;
        }
    };

    // Use summary data from controller or calculate from purchases
    const getTotalPurchases = () =>
        summary.total_transactions || purchases.data.length;
    const getTotalAmount = () =>
        summary.total_amount ||
        purchases.data.reduce(
            (total, purchase) =>
                total +
                parseFloat(purchase.total_price || purchase.total_amount || 0),
            0
        );
    const getTotalQuantity = () =>
        summary.total_quantity ||
        purchases.data.reduce(
            (total, purchase) => total + parseInt(purchase.quantity || 0),
            0
        );
    const getAverageAmount = () =>
        getTotalPurchases() > 0 ? getTotalAmount() / getTotalPurchases() : 0;

    return (
        <Layout
            user={auth.user}
            header={
                <h2 className="font-bold text-3xl text-gray-800 leading-tight">
                    Laporan Riwayat Pembelian
                </h2>
            }
        >
            <Head title="Laporan Riwayat Pembelian" />

            <div className="py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Bagian Filter */}
                    <Card className="mb-8 p-4 shadow-lg rounded-lg border border-gray-200">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-2xl font-semibold text-gray-700">
                                Filter Laporan Riwayat Pembelian
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form
                                onSubmit={handleFilter}
                                className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end"
                            >
                                <div className="space-y-2">
                                    <Label className="text-gray-600 font-medium">
                                        Supplier
                                    </Label>
                                    <Select
                                        onValueChange={(value) =>
                                            setData("supplier_id", value)
                                        }
                                        value={data.supplier_id}
                                    >
                                        <SelectTrigger className="focus:ring-indigo-500 focus:border-indigo-500">
                                            <SelectValue placeholder="Pilih supplier" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                Semua Supplier
                                            </SelectItem>
                                            {suppliers.map((supplier) => (
                                                <SelectItem
                                                    key={supplier.id}
                                                    value={supplier.id.toString()}
                                                >
                                                    {supplier.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-gray-600 font-medium">
                                        Tanggal Mulai
                                    </Label>
                                    <Input
                                        type="date"
                                        value={data.start_date}
                                        onChange={(e) =>
                                            setData(
                                                "start_date",
                                                e.target.value
                                            )
                                        }
                                        className="focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-gray-600 font-medium">
                                        Tanggal Akhir
                                    </Label>
                                    <Input
                                        type="date"
                                        value={data.end_date}
                                        onChange={(e) =>
                                            setData("end_date", e.target.value)
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
                    {(purchases.data.length > 0 ||
                        Object.keys(summary).length > 0) && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                            <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-2xl font-bold text-blue-600">
                                                {getTotalPurchases()}
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                Total Pembelian
                                            </div>
                                        </div>
                                        <ShoppingCart className="h-12 w-12 text-blue-500 opacity-80" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-2xl font-bold text-purple-600">
                                                {formatNumber(
                                                    getTotalQuantity()
                                                )}
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                Total Kuantitas
                                            </div>
                                        </div>
                                        <Package className="h-12 w-12 text-purple-500 opacity-80" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-2xl font-bold text-green-600">
                                                {formatCurrency(
                                                    getTotalAmount()
                                                )}
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                Total Nilai Pembelian
                                            </div>
                                        </div>
                                        <DollarSign className="h-12 w-12 text-green-500 opacity-80" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-2xl font-bold text-orange-600">
                                                {formatCurrency(
                                                    getAverageAmount()
                                                )}
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                Rata-rata per Pembelian
                                            </div>
                                        </div>
                                        <TrendingUp className="h-12 w-12 text-orange-500 opacity-80" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Tabel Laporan Riwayat Pembelian */}
                    <Card className="shadow-lg rounded-lg border border-gray-200">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-2xl font-semibold text-gray-700 flex items-center gap-2">
                                <FileText className="h-6 w-6" />
                                Riwayat Pembelian
                                {purchases.data.length > 0 && (
                                    <span className="text-sm font-normal text-gray-500">
                                        ({purchases.data.length} pembelian)
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
                                                No. Invoice
                                            </TableHead>
                                            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Produk
                                            </TableHead>
                                            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Supplier
                                            </TableHead>
                                            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Tanggal
                                            </TableHead>
                                            <TableHead className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Kuantitas
                                            </TableHead>
                                            <TableHead className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Total Nilai
                                            </TableHead>
                                            <TableHead className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody className="bg-white divide-y divide-gray-200">
                                        {purchases.data.length > 0 ? (
                                            purchases.data.map((purchase) => (
                                                <TableRow
                                                    key={purchase.id}
                                                    className="hover:bg-gray-50 transition-colors"
                                                >
                                                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {purchase.invoice_number ||
                                                            purchase.code ||
                                                            "-"}
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                        {purchase.product
                                                            ?.name ||
                                                            "Produk Tidak Dikenal"}
                                                        {purchase.product
                                                            ?.sku && (
                                                            <div className="text-xs text-gray-500">
                                                                SKU:{" "}
                                                                {
                                                                    purchase
                                                                        .product
                                                                        .sku
                                                                }
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                        {purchase.supplier
                                                            ?.name ||
                                                            "Supplier Tidak Dikenal"}
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                        {formatDate(
                                                            purchase.transaction_date
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-right text-blue-600 font-medium">
                                                        {formatNumber(
                                                            purchase.quantity
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-green-600">
                                                        {formatCurrency(
                                                            purchase.total_price ||
                                                                purchase.total_amount
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                                        <span
                                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                                purchase.status ===
                                                                "completed"
                                                                    ? "bg-green-100 text-green-800"
                                                                    : purchase.status ===
                                                                      "pending"
                                                                    ? "bg-yellow-100 text-yellow-800"
                                                                    : "bg-gray-100 text-gray-800"
                                                            }`}
                                                        >
                                                            {purchase.status ===
                                                            "completed"
                                                                ? "Selesai"
                                                                : purchase.status ===
                                                                  "pending"
                                                                ? "Pending"
                                                                : "Draft"}
                                                        </span>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={7}
                                                    className="px-6 py-8 text-center text-sm text-gray-500"
                                                >
                                                    <div className="flex flex-col items-center gap-2">
                                                        <AlertCircle className="h-8 w-8 text-gray-400" />
                                                        <span>
                                                            Tidak ada data
                                                            riwayat pembelian
                                                            yang sesuai dengan
                                                            filter.
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
                            {purchases.links && purchases.links.length > 3 && (
                                <div className="flex justify-center mt-6">
                                    <nav className="flex items-center space-x-2">
                                        {purchases.links.map((link, idx) => (
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
                                href={route(
                                    "reports.purchase-history.exportPdf",
                                    data
                                )}
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
                                href={route(
                                    "reports.purchase-history.exportExcel",
                                    data
                                )}
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
