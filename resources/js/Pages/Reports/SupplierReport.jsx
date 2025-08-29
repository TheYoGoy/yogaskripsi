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
    Download,
    FileText,
    AlertCircle,
    Building,
    Users,
    DollarSign,
    TrendingUp,
} from "lucide-react";
import { useState } from "react";

export default function SupplierReport({
    auth,
    suppliers,
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

        get(route("reports.suppliers"), {
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
        get(route("reports.suppliers"), {
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

    // Use summary data from controller or calculate from suppliers
    const getTotalSuppliers = () =>
        summary.total_suppliers || suppliers.data.length;
    const getActiveSuppliers = () =>
        summary.active_suppliers ||
        suppliers.data.filter(
            (supplier) => (supplier.total_transactions || 0) > 0
        ).length;
    const getTotalTransactions = () =>
        suppliers.data.reduce(
            (total, supplier) => total + (supplier.total_transactions || 0),
            0
        );
    const getTotalPurchases = () =>
        summary.total_amount ||
        suppliers.data.reduce(
            (total, supplier) => total + parseFloat(supplier.total_amount || 0),
            0
        );

    return (
        <Layout
            user={auth.user}
            header={
                <h2 className="font-bold text-3xl text-gray-800 leading-tight">
                    Laporan Supplier
                </h2>
            }
        >
            <Head title="Laporan Supplier" />

            <div className="py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Bagian Filter */}
                    <Card className="mb-8 p-4 shadow-lg rounded-lg border border-gray-200">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-2xl font-semibold text-gray-700">
                                Filter Laporan Supplier
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form
                                onSubmit={handleFilter}
                                className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end"
                            >
                                <div className="space-y-2">
                                    <Label className="text-gray-600 font-medium">
                                        Cari Supplier
                                    </Label>
                                    <Input
                                        type="text"
                                        placeholder="Nama supplier..."
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
                    {(suppliers.data.length > 0 ||
                        Object.keys(summary).length > 0) && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                            <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-2xl font-bold text-blue-600">
                                                {getTotalSuppliers()}
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                Total Supplier
                                            </div>
                                        </div>
                                        <Users className="h-12 w-12 text-blue-500 opacity-80" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-2xl font-bold text-green-600">
                                                {getActiveSuppliers()}
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                Supplier Aktif
                                            </div>
                                            <div className="text-xs text-green-600">
                                                Dengan transaksi
                                            </div>
                                        </div>
                                        <TrendingUp className="h-12 w-12 text-green-500 opacity-80" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-2xl font-bold text-purple-600">
                                                {formatNumber(
                                                    getTotalTransactions()
                                                )}
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                Total Transaksi
                                            </div>
                                        </div>
                                        <Building className="h-12 w-12 text-purple-500 opacity-80" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-2xl font-bold text-orange-600">
                                                {formatCurrency(
                                                    getTotalPurchases()
                                                )}
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                Total Pembelian
                                            </div>
                                        </div>
                                        <DollarSign className="h-12 w-12 text-orange-500 opacity-80" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Tabel Laporan Supplier */}
                    <Card className="shadow-lg rounded-lg border border-gray-200">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-2xl font-semibold text-gray-700 flex items-center gap-2">
                                <Building className="h-6 w-6" />
                                Laporan Supplier
                                {suppliers.data.length > 0 && (
                                    <span className="text-sm font-normal text-gray-500">
                                        ({suppliers.data.length} supplier)
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
                                                Nama
                                            </TableHead>
                                            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Kontak
                                            </TableHead>
                                            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Alamat
                                            </TableHead>
                                            <TableHead className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Jumlah Produk
                                            </TableHead>
                                            <TableHead className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Total Transaksi
                                            </TableHead>
                                            <TableHead className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Total Pembelian
                                            </TableHead>
                                            <TableHead className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody className="bg-white divide-y divide-gray-200">
                                        {suppliers.data.length > 0 ? (
                                            suppliers.data.map((supplier) => (
                                                <TableRow
                                                    key={supplier.id}
                                                    className="hover:bg-gray-50 transition-colors"
                                                >
                                                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {supplier.name}
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                        <div className="space-y-1">
                                                            {supplier.phone && (
                                                                <div className="flex items-center text-sm">
                                                                    📞{" "}
                                                                    {
                                                                        supplier.phone
                                                                    }
                                                                </div>
                                                            )}
                                                            {supplier.email && (
                                                                <div className="flex items-center text-xs text-gray-600">
                                                                    ✉️{" "}
                                                                    {
                                                                        supplier.email
                                                                    }
                                                                </div>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4 text-sm text-gray-700 max-w-xs">
                                                        <div className="truncate">
                                                            {supplier.address ||
                                                                "-"}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-blue-600">
                                                        {formatNumber(
                                                            supplier.products_count ||
                                                                0
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-purple-600">
                                                        {formatNumber(
                                                            supplier.total_transactions ||
                                                                0
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-green-600">
                                                        {formatCurrency(
                                                            supplier.total_amount
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                                        <span
                                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                                (supplier.total_transactions ||
                                                                    0) > 0
                                                                    ? "bg-green-100 text-green-800"
                                                                    : "bg-gray-100 text-gray-800"
                                                            }`}
                                                        >
                                                            {(supplier.total_transactions ||
                                                                0) > 0
                                                                ? "Aktif"
                                                                : "Tidak Aktif"}
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
                                                            supplier yang sesuai
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
                            {suppliers.links && suppliers.links.length > 3 && (
                                <div className="flex justify-center mt-6">
                                    <nav className="flex items-center space-x-2">
                                        {suppliers.links.map((link, idx) => (
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
                                    "reports.suppliers.exportPdf",
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
                                    "reports.suppliers.exportExcel",
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
