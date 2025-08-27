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
import { Download, FileText, AlertCircle, ShoppingCart, DollarSign, TrendingUp, Receipt } from "lucide-react";
import { useState } from "react";

export default function SalesHistoryReport({ auth, sales, filters = {} }) {
    const [isExporting, setIsExporting] = useState(false);

    const { data, setData, get, processing } = useForm({
        start_date: filters.start_date || "",
        end_date: filters.end_date || "",
    });

    const handleFilter = (e) => {
        e.preventDefault();

        // Validasi rentang tanggal
        if (
            data.start_date &&
            data.end_date &&
            new Date(data.start_date) > new Date(data.end_date)
        ) {
            alert("Tanggal mulai tidak boleh lebih besar dari tanggal akhir");
            return;
        }

        get(route("reports.sales-history"), {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleReset = () => {
        setData({ start_date: "", end_date: "" });
        get(route("reports.sales-history"), {
            data: { start_date: "", end_date: "" },
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
        }).format(amount);
    };

    const getTotalAmount = () => {
        return sales.data.reduce(
            (total, sale) => total + parseFloat(sale.total_amount || 0),
            0
        );
    };

    const formatDate = (dateString) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('id-ID', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch (error) {
            return dateString;
        }
    };

    return (
        <Layout
            user={auth.user}
            header={
                <h2 className="font-bold text-3xl text-gray-800">
                    Laporan Riwayat Penjualan
                </h2>
            }
        >
            <Head title="Laporan Riwayat Penjualan" />

            <div className="py-8 max-w-7xl mx-auto px-4 space-y-6">
                
                {/* Statistik Cards */}
                {sales.data.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-lg">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-blue-100 text-sm">Total Transaksi</p>
                                        <p className="text-3xl font-bold text-white">{sales.data.length}</p>
                                    </div>
                                    <ShoppingCart className="h-12 w-12 text-blue-200" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 shadow-lg">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-green-100 text-sm">Total Penjualan</p>
                                        <p className="text-3xl font-bold text-white">{formatCurrency(getTotalAmount())}</p>
                                    </div>
                                    <DollarSign className="h-12 w-12 text-green-200" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 shadow-lg">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-purple-100 text-sm">Rata-rata per Transaksi</p>
                                        <p className="text-3xl font-bold text-white">
                                            {formatCurrency(getTotalAmount() / sales.data.length)}
                                        </p>
                                    </div>
                                    <TrendingUp className="h-12 w-12 text-purple-200" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Filter Card */}
                <Card className="shadow-sm border border-gray-200">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-xl font-semibold text-gray-800">
                            Filter Riwayat Penjualan
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form
                            onSubmit={handleFilter}
                            className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end"
                        >
                            <div className="space-y-2">
                                <Label
                                    htmlFor="start_date"
                                    className="text-gray-700 font-medium text-sm"
                                >
                                    Tanggal Mulai
                                </Label>
                                <Input
                                    type="date"
                                    id="start_date"
                                    value={data.start_date}
                                    onChange={(e) =>
                                        setData("start_date", e.target.value)
                                    }
                                    className="focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label
                                    htmlFor="end_date"
                                    className="text-gray-700 font-medium text-sm"
                                >
                                    Tanggal Akhir
                                </Label>
                                <Input
                                    type="date"
                                    id="end_date"
                                    value={data.end_date}
                                    onChange={(e) =>
                                        setData("end_date", e.target.value)
                                    }
                                    className="focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div className="flex items-end gap-2 md:col-span-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleReset}
                                    disabled={processing}
                                    className="w-full md:w-auto"
                                >
                                    Reset Filter
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                    {processing ? "Memuat..." : "Terapkan Filter"}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Tabel Penjualan */}
                <Card className="shadow-sm border border-gray-200">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                            <Receipt className="h-5 w-5 text-gray-600" />
                            Riwayat Penjualan
                            {sales.data.length > 0 && (
                                <span className="text-sm font-normal text-gray-500">
                                    ({sales.data.length} transaksi)
                                </span>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table className="min-w-full">
                                <TableHeader className="bg-gray-50">
                                    <TableRow>
                                        <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            No. Invoice
                                        </TableHead>
                                        <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Produk
                                        </TableHead>
                                        <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Tanggal
                                        </TableHead>
                                        <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Pengguna
                                        </TableHead>
                                        <TableHead className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Total Jumlah
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
                                                    {sale.invoice_number}
                                                </TableCell>
                                                <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                    {sale.product?.name || "Produk Tidak Diketahui"}
                                                </TableCell>
                                                <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                    {formatDate(sale.transaction_date)}
                                                </TableCell>
                                                <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                    {sale.user?.name || "Pengguna Tidak Diketahui"}
                                                </TableCell>
                                                <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-center font-semibold text-green-600">
                                                    {formatCurrency(parseFloat(sale.total_amount || 0))}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell
                                                colSpan={5}
                                                className="px-6 py-8 text-center text-sm text-gray-500"
                                            >
                                                <div className="flex flex-col items-center gap-2">
                                                    <AlertCircle className="h-8 w-8 text-gray-400" />
                                                    <span>
                                                        Tidak ditemukan data penjualan yang sesuai dengan filter.
                                                    </span>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={handleReset}
                                                        className="mt-2"
                                                    >
                                                        Reset Filter
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        {sales.links && sales.links.length > 3 && (
                            <div className="flex justify-center mt-6 p-6">
                                <nav className="flex items-center space-x-2">
                                    {sales.links.map((link, index) => (
                                        <Link
                                            key={index}
                                            href={link.url || "#"}
                                            dangerouslySetInnerHTML={{
                                                __html: link.label,
                                            }}
                                            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                                                link.active
                                                    ? "bg-blue-600 text-white shadow-md hover:bg-blue-700"
                                                    : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"
                                            } ${
                                                !link.url
                                                    ? "pointer-events-none opacity-50"
                                                    : ""
                                            }`}
                                        />
                                    ))}
                                </nav>
                            </div>
                        )}
                    </CardContent>

                    {/* Tombol Export */}
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
                                {isExporting ? "Mengekspor..." : "Ekspor PDF"}
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
                                {isExporting ? "Mengekspor..." : "Ekspor Excel"}
                            </Button>
                        </a>
                    </div>
                </Card>
            </div>
        </Layout>
    );
}