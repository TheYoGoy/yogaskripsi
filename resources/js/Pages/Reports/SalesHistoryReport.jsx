import Layout from "@/Layouts/Layout";
import { Head, Link } from "@inertiajs/react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/Components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { useForm } from "@inertiajs/react";
import {
    Download,
    FileText,
    AlertCircle,
    ShoppingCart,
    DollarSign,
    TrendingUp,
    Receipt,
    Package,
} from "lucide-react";
import { useState } from "react";

export default function SalesHistoryReport({
    auth,
    sales,
    filters = {},
    summary = {},
}) {
    const [isExporting, setIsExporting] = useState(false);

    const { data, setData, get, processing } = useForm({
        search: filters.search || "",
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

        get(route("reports.sales-history"), {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleReset = () => {
        setData({
            search: "",
            start_date: "",
            end_date: "",
            per_page: 15,
        });
        get(route("reports.sales-history"), {
            data: { search: "", start_date: "", end_date: "", per_page: 15 },
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
            const date = new Date(dateString);
            return date.toLocaleDateString("id-ID", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
            });
        } catch (error) {
            return dateString;
        }
    };

    // Use summary data from controller or calculate from sales
    const getTotalSales = () => summary.total_transactions || sales.data.length;
    const getTotalAmount = () =>
        summary.total_amount ||
        sales.data.reduce(
            (total, sale) => total + parseFloat(sale.total_price || 0),
            0
        );
    const getTotalQuantity = () =>
        summary.total_quantity ||
        sales.data.reduce((total, sale) => total + (sale.quantity || 0), 0);
    const getAverageAmount = () =>
        getTotalSales() > 0 ? getTotalAmount() / getTotalSales() : 0;

    return (
        <Layout
            user={auth.user}
            header={
                <h2 className="font-bold text-3xl text-gray-800 leading-tight">
                    Laporan Riwayat Penjualan
                </h2>
            }
        >
            <Head title="Laporan Riwayat Penjualan" />

            <div className="py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Bagian Filter */}
                    <Card className="mb-8 p-4 shadow-lg rounded-lg border border-gray-200">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-2xl font-semibold text-gray-700">
                                Filter Laporan Riwayat Penjualan
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form
                                onSubmit={handleFilter}
                                className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end"
                            >
                                <div className="space-y-2">
                                    <Label className="text-gray-600 font-medium">
                                        Cari Produk/Customer
                                    </Label>
                                    <Input
                                        type="text"
                                        placeholder="Nama produk/customer..."
                                        value={data.search}
                                        onChange={(e) =>
                                            setData("search", e.target.value)
                                        }
                                        className="focus:ring-indigo-500 focus:border-indigo-500"
                                    />
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
                                    <select
                                        value={data.per_page}
                                        onChange={(e) =>
                                            setData("per_page", e.target.value)
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                    >
                                        <option value="10">10</option>
                                        <option value="15">15</option>
                                        <option value="25">25</option>
                                        <option value="50">50</option>
                                    </select>
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
                    {(sales.data.length > 0 ||
                        Object.keys(summary).length > 0) && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                            <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-2xl font-bold text-blue-600">
                                                {getTotalSales()}
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                Total Penjualan
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
                                                Total Quantity
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
                                                Total Nilai Penjualan
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
                                                Rata-rata per Transaksi
                                            </div>
                                        </div>
                                        <TrendingUp className="h-12 w-12 text-orange-500 opacity-80" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Tabel Laporan Riwayat Penjualan */}
                    <Card className="shadow-lg rounded-lg border border-gray-200">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-2xl font-semibold text-gray-700 flex items-center gap-2">
                                <Receipt className="h-6 w-6" />
                                Laporan Riwayat Penjualan
                                {sales.data.length > 0 && (
                                    <span className="text-sm font-normal text-gray-500">
                                        ({sales.data.length} transaksi)
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
                                                Invoice/Kode
                                            </TableHead>
                                            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Tanggal
                                            </TableHead>
                                            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Produk
                                            </TableHead>
                                            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Customer
                                            </TableHead>
                                            <TableHead className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Quantity
                                            </TableHead>
                                            <TableHead className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Harga Satuan
                                            </TableHead>
                                            <TableHead className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Total Harga
                                            </TableHead>
                                            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Petugas
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody className="bg-white divide-y divide-gray-200">
                                        {sales.data.length > 0 ? (
                                            sales.data.map((sale) => (
                                                <TableRow
                                                    key={sale.id}
                                                    className="hover:bg-gray-50 transition-colors"
                                                >
                                                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {sale.invoice_number ||
                                                            sale.code ||
                                                            "-"}
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                        {formatDate(
                                                            sale.transaction_date ||
                                                                sale.sale_date
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                        {sale.product?.name ||
                                                            "-"}
                                                        {sale.product?.sku && (
                                                            <div className="text-xs text-gray-500">
                                                                SKU:{" "}
                                                                {
                                                                    sale.product
                                                                        .sku
                                                                }
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                        {sale.customer?.name ||
                                                            sale.customer_name ||
                                                            "-"}
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-blue-600">
                                                        {formatNumber(
                                                            sale.quantity || 0
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-purple-600">
                                                        {formatCurrency(
                                                            sale.price_per_unit ||
                                                                (sale.total_price &&
                                                                sale.quantity
                                                                    ? sale.total_price /
                                                                      sale.quantity
                                                                    : 0)
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-green-600">
                                                        {formatCurrency(
                                                            sale.total_price ||
                                                                0
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                        {sale.user?.name ||
                                                            "Sistem"}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={8}
                                                    className="px-6 py-8 text-center text-sm text-gray-500"
                                                >
                                                    <div className="flex flex-col items-center gap-2">
                                                        <AlertCircle className="h-8 w-8 text-gray-400" />
                                                        <span>
                                                            Tidak ada data
                                                            penjualan yang
                                                            sesuai dengan
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
                            {sales.links && sales.links.length > 3 && (
                                <div className="flex justify-center mt-6">
                                    <nav className="flex items-center space-x-2">
                                        {sales.links.map((link, idx) => (
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
                                href={route("reports.sales.exportPdf", data)}
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
                                href={route("reports.sales.exportExcel", data)}
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
