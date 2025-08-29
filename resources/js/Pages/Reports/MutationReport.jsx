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
import { Label } from "@/Components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select";
import { Calendar } from "@/Components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/Components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
    CalendarIcon,
    Download,
    FileText,
    AlertCircle,
    TrendingUp,
    TrendingDown,
    BarChart3,
} from "lucide-react";
import { useState } from "react";

export default function MutationReport({
    auth,
    transactions,
    products,
    filters = {},
    summary = {},
}) {
    const [isExporting, setIsExporting] = useState(false);

    const { data, setData, get, processing } = useForm({
        product_id: filters.product_id || "all",
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
            alert("Tanggal mulai tidak boleh lebih besar dari tanggal akhir");
            return;
        }

        get(route("reports.mutation"), {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleReset = () => {
        setData({
            product_id: "all",
            start_date: "",
            end_date: "",
            per_page: 15,
        });

        get(route("reports.mutation"), {
            data: {
                product_id: "all",
                start_date: "",
                end_date: "",
                per_page: 15,
            },
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handlePdfExport = () => {
        setIsExporting(true);

        // Build URL dengan query parameters
        const params = new URLSearchParams();
        if (data.product_id && data.product_id !== "all") {
            params.append("product_id", data.product_id);
        }
        if (data.start_date) {
            params.append("start_date", data.start_date);
        }
        if (data.end_date) {
            params.append("end_date", data.end_date);
        }

        const url = `/reports/mutation/export-pdf?${params.toString()}`;

        // Buka di tab baru untuk download
        window.open(url, "_blank");

        setTimeout(() => setIsExporting(false), 2000);
    };

    const handleExcelExport = () => {
        setIsExporting(true);

        // Build URL dengan query parameters
        const params = new URLSearchParams();
        if (data.product_id && data.product_id !== "all") {
            params.append("product_id", data.product_id);
        }
        if (data.start_date) {
            params.append("start_date", data.start_date);
        }
        if (data.end_date) {
            params.append("end_date", data.end_date);
        }

        const url = `/reports/mutation/export-excel?${params.toString()}`;

        // Buka di tab baru untuk download
        window.open(url, "_blank");

        setTimeout(() => setIsExporting(false), 2000);
    };

    const formatTransactionDate = (dateString) => {
        try {
            return format(new Date(dateString), "dd/MM/yyyy");
        } catch (error) {
            return dateString;
        }
    };

    const formatNumber = (num) => {
        return new Intl.NumberFormat("id-ID").format(num || 0);
    };

    // Use data from controller summary or calculate from transactions
    const getTotalTransactions = () =>
        summary.total_transactions || transactions.data.length;
    const getTotalIn = () => summary.total_in || 0;
    const getTotalOut = () => summary.total_out || 0;
    const getNetMovement = () =>
        summary.net_movement || getTotalIn() - getTotalOut();

    const getStockInCount = () => {
        if (summary.total_in !== undefined) return summary.total_in;
        return transactions.data.filter((t) => t.type === "in").length;
    };

    const getStockOutCount = () => {
        if (summary.total_out !== undefined) return summary.total_out;
        return transactions.data.filter((t) => t.type === "out").length;
    };

    return (
        <Layout
            user={auth.user}
            header={
                <h2 className="font-bold text-3xl text-gray-800 leading-tight">
                    Laporan Mutasi Stok
                </h2>
            }
        >
            <Head title="Laporan Mutasi Stok" />

            <div className="py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Bagian Filter */}
                    <Card className="mb-8 p-4 shadow-lg rounded-lg border border-gray-200">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-2xl font-semibold text-gray-700">
                                Filter Laporan Mutasi Stok
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form
                                onSubmit={handleFilter}
                                className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end"
                            >
                                <div className="space-y-2">
                                    <Label className="text-gray-600 font-medium">
                                        Produk
                                    </Label>
                                    <Select
                                        onValueChange={(value) =>
                                            setData("product_id", value)
                                        }
                                        value={data.product_id}
                                    >
                                        <SelectTrigger className="focus:ring-indigo-500 focus:border-indigo-500">
                                            <SelectValue placeholder="Pilih produk" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                Semua Produk
                                            </SelectItem>
                                            {products.map((product) => (
                                                <SelectItem
                                                    key={product.id}
                                                    value={product.id.toString()}
                                                >
                                                    {product.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-gray-600 font-medium">
                                        Tanggal Mulai
                                    </Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-full justify-start text-left font-normal focus:ring-indigo-500 focus:border-indigo-500",
                                                    !data.start_date &&
                                                        "text-muted-foreground"
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {data.start_date ? (
                                                    format(
                                                        new Date(
                                                            data.start_date
                                                        ),
                                                        "dd/MM/yyyy"
                                                    )
                                                ) : (
                                                    <span>Pilih tanggal</span>
                                                )}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar
                                                mode="single"
                                                selected={
                                                    data.start_date
                                                        ? new Date(
                                                              data.start_date
                                                          )
                                                        : undefined
                                                }
                                                onSelect={(date) =>
                                                    setData(
                                                        "start_date",
                                                        date
                                                            ? format(
                                                                  date,
                                                                  "yyyy-MM-dd"
                                                              )
                                                            : ""
                                                    )
                                                }
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-gray-600 font-medium">
                                        Tanggal Akhir
                                    </Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-full justify-start text-left font-normal focus:ring-indigo-500 focus:border-indigo-500",
                                                    !data.end_date &&
                                                        "text-muted-foreground"
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {data.end_date ? (
                                                    format(
                                                        new Date(data.end_date),
                                                        "dd/MM/yyyy"
                                                    )
                                                ) : (
                                                    <span>Pilih tanggal</span>
                                                )}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar
                                                mode="single"
                                                selected={
                                                    data.end_date
                                                        ? new Date(
                                                              data.end_date
                                                          )
                                                        : undefined
                                                }
                                                onSelect={(date) =>
                                                    setData(
                                                        "end_date",
                                                        date
                                                            ? format(
                                                                  date,
                                                                  "yyyy-MM-dd"
                                                              )
                                                            : ""
                                                    )
                                                }
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
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
                    {(transactions.data.length > 0 ||
                        Object.keys(summary).length > 0) && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                            <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-2xl font-bold text-blue-600">
                                                {getTotalTransactions()}
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                Total Transaksi
                                            </div>
                                        </div>
                                        <BarChart3 className="h-12 w-12 text-blue-500 opacity-80" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-2xl font-bold text-green-600">
                                                {getStockInCount()}
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                Stok Masuk
                                            </div>
                                            <div className="text-xs text-green-600 font-medium">
                                                Qty:{" "}
                                                {formatNumber(getTotalIn())}
                                            </div>
                                        </div>
                                        <TrendingUp className="h-12 w-12 text-green-500 opacity-80" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-2xl font-bold text-red-600">
                                                {getStockOutCount()}
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                Stok Keluar
                                            </div>
                                            <div className="text-xs text-red-600 font-medium">
                                                Qty:{" "}
                                                {formatNumber(getTotalOut())}
                                            </div>
                                        </div>
                                        <TrendingDown className="h-12 w-12 text-red-500 opacity-80" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card
                                className={`${
                                    getNetMovement() >= 0
                                        ? "bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-200"
                                        : "bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200"
                                }`}
                            >
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div
                                                className={`text-2xl font-bold ${
                                                    getNetMovement() >= 0
                                                        ? "text-emerald-600"
                                                        : "text-orange-600"
                                                }`}
                                            >
                                                {getNetMovement() >= 0
                                                    ? "+"
                                                    : ""}
                                                {formatNumber(getNetMovement())}
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                Selisih Stok
                                            </div>
                                        </div>
                                        {getNetMovement() >= 0 ? (
                                            <TrendingUp className="h-12 w-12 text-emerald-500 opacity-80" />
                                        ) : (
                                            <TrendingDown className="h-12 w-12 text-orange-500 opacity-80" />
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Tabel Laporan Mutasi */}
                    <Card className="shadow-lg rounded-lg border border-gray-200">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-2xl font-semibold text-gray-700 flex items-center gap-2">
                                <FileText className="h-6 w-6" />
                                Laporan Mutasi Stok
                                {transactions.data.length > 0 && (
                                    <span className="text-sm font-normal text-gray-500">
                                        ({transactions.data.length} transaksi)
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
                                                Tanggal
                                            </TableHead>
                                            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Kode
                                            </TableHead>
                                            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Tipe
                                            </TableHead>
                                            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Produk
                                            </TableHead>
                                            <TableHead className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Kuantitas
                                            </TableHead>
                                            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Pihak Terkait
                                            </TableHead>
                                            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Dicatat Oleh
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody className="bg-white divide-y divide-gray-200">
                                        {transactions.data.length > 0 ? (
                                            transactions.data.map(
                                                (transaction, index) => (
                                                    <TableRow
                                                        key={`${
                                                            transaction.id ||
                                                            transaction.original_id
                                                        }-${
                                                            transaction.type
                                                        }-${index}`}
                                                        className="hover:bg-gray-50 transition-colors"
                                                    >
                                                        <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                            {formatTransactionDate(
                                                                transaction.transaction_date
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">
                                                            {transaction.code ||
                                                                "-"}
                                                        </TableCell>
                                                        <TableCell className="px-6 py-4 whitespace-nowrap">
                                                            <span
                                                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                                    transaction.type ===
                                                                    "in"
                                                                        ? "bg-green-100 text-green-800"
                                                                        : "bg-red-100 text-red-800"
                                                                }`}
                                                            >
                                                                {transaction.type ===
                                                                "in"
                                                                    ? "Stok Masuk"
                                                                    : "Stok Keluar"}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                            {transaction.product
                                                                ?.name ||
                                                                "Produk Tidak Diketahui"}
                                                            {transaction.product
                                                                ?.sku && (
                                                                <div className="text-xs text-gray-500">
                                                                    SKU:{" "}
                                                                    {
                                                                        transaction
                                                                            .product
                                                                            .sku
                                                                    }
                                                                </div>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium">
                                                            <span
                                                                className={`${
                                                                    transaction.type ===
                                                                    "in"
                                                                        ? "text-green-600"
                                                                        : "text-red-600"
                                                                }`}
                                                            >
                                                                {transaction.type ===
                                                                "in"
                                                                    ? "+"
                                                                    : "-"}
                                                                {formatNumber(
                                                                    transaction.quantity
                                                                )}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                            {transaction.supplier ||
                                                                transaction.customer ||
                                                                "-"}
                                                            {transaction.source && (
                                                                <div className="text-xs text-gray-500">
                                                                    {
                                                                        transaction.source
                                                                    }
                                                                </div>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                            {transaction.user
                                                                ?.name ||
                                                                "User Tidak Diketahui"}
                                                        </TableCell>
                                                    </TableRow>
                                                )
                                            )
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
                                                            mutasi stok yang
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
                            {transactions.links &&
                                transactions.links.length > 3 && (
                                    <div className="flex justify-center mt-6">
                                        <nav className="flex items-center space-x-2">
                                            {transactions.links.map(
                                                (link, idx) => (
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
                                                )
                                            )}
                                        </nav>
                                    </div>
                                )}
                        </CardContent>

                        {/* Tombol Ekspor */}
                        <div className="p-6 flex justify-end items-center gap-4 border-t border-gray-200">
                            <Button
                                onClick={handlePdfExport}
                                disabled={isExporting}
                                className="bg-red-600 hover:bg-red-700 text-white shadow-sm flex items-center gap-2"
                            >
                                <Download className="h-4 w-4" />
                                {isExporting ? "Mengekspor..." : "Ekspor PDF"}
                            </Button>
                            <Button
                                onClick={handleExcelExport}
                                disabled={isExporting}
                                className="bg-green-600 hover:bg-green-700 text-white shadow-sm flex items-center gap-2"
                            >
                                <Download className="h-4 w-4" />
                                {isExporting ? "Mengekspor..." : "Ekspor Excel"}
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        </Layout>
    );
}
