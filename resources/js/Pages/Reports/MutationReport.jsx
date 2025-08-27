import Layout from "@/Layouts/Layout";
import { Head, useForm } from "@inertiajs/react";
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
import { CalendarIcon, Download, FileText, AlertCircle, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { useState } from "react";

export default function MutationReport({
    auth,
    transactions,
    products,
    filters,
}) {
    const [isExporting, setIsExporting] = useState(false);

    const { data, setData, get, processing } = useForm({
        product_id: filters.product_id || "all",
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

        get(route("reports.mutation"), {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleResetFilters = () => {
        setData({
            product_id: "all",
            start_date: "",
            end_date: "",
        });

        get(route("reports.mutation"), {
            data: { product_id: "all", start_date: "", end_date: "" },
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleExport = (type) => {
        setIsExporting(true);
        setTimeout(() => setIsExporting(false), 3000);
    };

    const formatTransactionDate = (dateString) => {
        try {
            return format(new Date(dateString), "dd/MM/yyyy");
        } catch (error) {
            return dateString;
        }
    };

    // Hitung statistik transaksi
    const stockInCount = transactions.filter(t => t.type === "in").length;
    const stockOutCount = transactions.filter(t => t.type === "out").length;
    const totalQuantityIn = transactions
        .filter(t => t.type === "in")
        .reduce((sum, t) => sum + parseInt(t.quantity || 0), 0);
    const totalQuantityOut = transactions
        .filter(t => t.type === "out")
        .reduce((sum, t) => sum + parseInt(t.quantity || 0), 0);

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
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
                    
                    {/* Statistik Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-lg">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-blue-100 text-sm">Total Transaksi</p>
                                        <p className="text-3xl font-bold text-white">{transactions.length}</p>
                                    </div>
                                    <BarChart3 className="h-12 w-12 text-blue-200" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0 shadow-lg">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-green-100 text-sm">Stok Masuk</p>
                                        <p className="text-3xl font-bold text-white">{stockInCount}</p>
                                        <p className="text-xs text-green-200">Qty: {totalQuantityIn}</p>
                                    </div>
                                    <TrendingUp className="h-12 w-12 text-green-200" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white border-0 shadow-lg">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-red-100 text-sm">Stok Keluar</p>
                                        <p className="text-3xl font-bold text-white">{stockOutCount}</p>
                                        <p className="text-xs text-red-200">Qty: {totalQuantityOut}</p>
                                    </div>
                                    <TrendingDown className="h-12 w-12 text-red-200" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className={`${(totalQuantityIn - totalQuantityOut) >= 0 ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' : 'bg-gradient-to-r from-orange-500 to-orange-600'} text-white border-0 shadow-lg`}>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className={`${(totalQuantityIn - totalQuantityOut) >= 0 ? 'text-emerald-100' : 'text-orange-100'} text-sm`}>Selisih</p>
                                        <p className="text-3xl font-bold text-white">
                                            {totalQuantityIn - totalQuantityOut >= 0 ? '+' : ''}{totalQuantityIn - totalQuantityOut}
                                        </p>
                                    </div>
                                    <div className={`h-12 w-12 rounded-full flex items-center justify-center ${(totalQuantityIn - totalQuantityOut) >= 0 ? 'bg-emerald-400/30' : 'bg-orange-400/30'}`}>
                                        {(totalQuantityIn - totalQuantityOut) >= 0 ? 
                                            <TrendingUp className={`h-7 w-7 ${(totalQuantityIn - totalQuantityOut) >= 0 ? 'text-emerald-200' : 'text-orange-200'}`} /> : 
                                            <TrendingDown className={`h-7 w-7 ${(totalQuantityIn - totalQuantityOut) >= 0 ? 'text-emerald-200' : 'text-orange-200'}`} />
                                        }
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Filter Card */}
                    <Card className="shadow-sm border border-gray-200">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-xl font-semibold text-gray-800">
                                Filter Laporan Mutasi
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form
                                onSubmit={handleFilter}
                                className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 items-end gap-6"
                            >
                                {/* Filter berdasarkan Produk */}
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="product_id"
                                        className="text-gray-700 font-medium text-sm"
                                    >
                                        Produk
                                    </Label>
                                    <Select
                                        onValueChange={(value) =>
                                            setData("product_id", value)
                                        }
                                        value={data.product_id}
                                    >
                                        <SelectTrigger className="w-full">
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

                                {/* Filter berdasarkan Tanggal Mulai */}
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="start_date"
                                        className="text-gray-700 font-medium text-sm"
                                    >
                                        Tanggal Mulai
                                    </Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-full justify-start text-left font-normal",
                                                    !data.start_date &&
                                                        "text-muted-foreground",
                                                    "focus:ring-blue-500 focus:border-blue-500"
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

                                {/* Filter berdasarkan Tanggal Akhir */}
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="end_date"
                                        className="text-gray-700 font-medium text-sm"
                                    >
                                        Tanggal Akhir
                                    </Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-full justify-start text-left font-normal",
                                                    !data.end_date &&
                                                        "text-muted-foreground",
                                                    "focus:ring-blue-500 focus:border-blue-500"
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

                                {/* Tombol Filter dan Reset */}
                                <div className="col-span-full md:col-span-1 flex justify-end gap-3 pt-6 md:pt-0">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleResetFilters}
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
                                        {processing
                                            ? "Memuat..."
                                            : "Terapkan Filter"}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Tabel Laporan Mutasi */}
                    <Card className="shadow-sm border border-gray-200">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                                <FileText className="h-5 w-5 text-gray-600" />
                                Detail Mutasi Stok
                                {transactions.length > 0 && (
                                    <span className="text-sm font-normal text-gray-500">
                                        ({transactions.length} transaksi)
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
                                                Tanggal
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
                                        {transactions.length > 0 ? (
                                            transactions.map(
                                                (transaction, index) => (
                                                    <TableRow
                                                        key={`${transaction.id}-${transaction.type}-${index}`}
                                                        className="hover:bg-gray-50 transition-colors"
                                                    >
                                                        <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                            {formatTransactionDate(
                                                                transaction.transaction_date
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="px-6 py-4 whitespace-nowrap">
                                                            <span
                                                                className={`px-3 py-1 rounded-full text-xs font-medium ${
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
                                                        </TableCell>
                                                        <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                                            <span
                                                                className={`font-semibold ${
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
                                                                {
                                                                    transaction.quantity
                                                                }
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                            {transaction.supplier ||
                                                                transaction.customer ||
                                                                "Tidak Ada"}
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
                                                    colSpan={6}
                                                    className="px-6 py-8 text-center text-sm text-gray-500"
                                                >
                                                    <div className="flex flex-col items-center gap-2">
                                                        <AlertCircle className="h-8 w-8 text-gray-400" />
                                                        <span>
                                                            Tidak ditemukan mutasi stok yang sesuai dengan filter.
                                                        </span>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={
                                                                handleResetFilters
                                                            }
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
                        </CardContent>

                        {/* Tombol Export */}
                        <div className="p-6 flex justify-end items-center gap-4 border-t border-gray-200">
                            <a
                                href={route("reports.mutation.exportPdf", data)}
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
                                    "reports.mutation.exportExcel",
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