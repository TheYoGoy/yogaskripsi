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
    AlertCircle
} from "lucide-react";

export default function StockReport({ auth, products, categories, filters }) {
    const [isExporting, setIsExporting] = useState(false);

    const { data, setData, get, processing } = useForm({
        category_id: filters.category_id || "all",
        min_stock: filters.min_stock || "",
        max_stock: filters.max_stock || "",
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

    const handleResetFilters = () => {
        setData({
            category_id: "all",
            min_stock: "",
            max_stock: "",
        });

        get(route("reports.stock"), {
            data: { category_id: "all", min_stock: "", max_stock: "" },
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleExport = (type) => {
        setIsExporting(true);
        // Reset setelah 3 detik untuk mengaktifkan kembali tombol
        setTimeout(() => setIsExporting(false), 3000);
    };

    // Hitung statistik stok rendah
    const lowStockCount = products.data.filter(product => 
        product.current_stock <= (product.minimum_stock || 0)
    ).length;

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
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
                    
                    {/* Statistik Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-xl">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-blue-100 text-sm font-medium">Total Produk</p>
                                        <p className="text-3xl font-bold">{products.data.length}</p>
                                    </div>
                                    <Package className="h-12 w-12 text-blue-200" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className={`${lowStockCount > 0 ? 'bg-gradient-to-r from-red-500 to-red-600' : 'bg-gradient-to-r from-green-500 to-green-600'} text-white border-0 shadow-xl`}>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className={`${lowStockCount > 0 ? 'text-red-100' : 'text-green-100'} text-sm font-medium`}>
                                            Stok Rendah
                                        </p>
                                        <p className="text-3xl font-bold">{lowStockCount}</p>
                                    </div>
                                    <AlertTriangle className={`h-12 w-12 ${lowStockCount > 0 ? 'text-red-200' : 'text-green-200'}`} />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 shadow-xl">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-purple-100 text-sm font-medium">Kategori Aktif</p>
                                        <p className="text-3xl font-bold">{categories.length}</p>
                                    </div>
                                    <Filter className="h-12 w-12 text-purple-200" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Filter Card */}
                    <Card className="shadow-sm border border-gray-200">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-xl font-semibold text-gray-800">
                                Filter Laporan Stok
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <form
                                onSubmit={handleFilter}
                                className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 items-end gap-6"
                            >
                                {/* Filter berdasarkan Kategori */}
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="category_id"
                                        className="text-gray-700 font-medium text-sm"
                                    >
                                        Kategori Produk
                                    </Label>
                                    <Select
                                        onValueChange={(value) =>
                                            setData("category_id", value)
                                        }
                                        value={data.category_id}
                                    >
                                        <SelectTrigger className="w-full">
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

                                {/* Filter berdasarkan Stok Minimum */}
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="min_stock"
                                        className="text-gray-700 font-medium text-sm"
                                    >
                                        Stok Minimum
                                    </Label>
                                    <Input
                                        id="min_stock"
                                        type="number"
                                        min="0"
                                        placeholder="contoh: 10"
                                        value={data.min_stock}
                                        onChange={(e) =>
                                            setData("min_stock", e.target.value)
                                        }
                                        className="focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                {/* Filter berdasarkan Stok Maksimum */}
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="max_stock"
                                        className="text-gray-700 font-medium text-sm"
                                    >
                                        Stok Maksimum
                                    </Label>
                                    <Input
                                        id="max_stock"
                                        type="number"
                                        min="0"
                                        placeholder="contoh: 100"
                                        value={data.max_stock}
                                        onChange={(e) =>
                                            setData("max_stock", e.target.value)
                                        }
                                        className="focus:ring-blue-500 focus:border-blue-500"
                                    />
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
                                        {processing ? "Memuat..." : "Terapkan Filter"}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Tabel Laporan Stok */}
                    <Card className="shadow-sm border border-gray-200">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-xl font-semibold text-gray-800 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-gray-600" />
                                    <span>Tingkat Stok Saat Ini</span>
                                    {products.data.length > 0 && (
                                        <span className="text-sm font-normal text-gray-500">
                                            ({products.data.length} produk)
                                        </span>
                                    )}
                                </div>
                                {lowStockCount > 0 && (
                                    <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                                        <AlertTriangle className="h-4 w-4" />
                                        {lowStockCount} Stok Rendah
                                    </div>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table className="min-w-full">
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
                                                Satuan
                                            </TableHead>
                                            <TableHead className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Stok Saat Ini
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody className="bg-white divide-y divide-gray-200">
                                        {products.data.length > 0 ? (
                                            products.data.map((product) => (
                                                <TableRow
                                                    key={product.id}
                                                    className="hover:bg-gray-50 transition-colors"
                                                >
                                                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {product.sku}
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                        {product.name}
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                        {product.category?.name || "Tidak Ada"}
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                        {product.unit?.name || "Tidak Ada"}
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <span
                                                                className={`font-semibold ${
                                                                    product.current_stock <= (product.minimum_stock || 0)
                                                                        ? "text-red-600"
                                                                        : "text-gray-700"
                                                                }`}
                                                            >
                                                                {product.current_stock}
                                                            </span>
                                                            {product.current_stock <= (product.minimum_stock || 0) && (
                                                                <AlertTriangle className="h-4 w-4 text-red-500" />
                                                            )}
                                                        </div>
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
                                                            Tidak ditemukan produk yang sesuai dengan filter.
                                                        </span>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={handleResetFilters}
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

                            {/* Pagination Links */}
                            {products.links && products.links.length > 3 && (
                                <div className="flex justify-center mt-8 p-6">
                                    <nav className="flex items-center space-x-2">
                                        {products.links.map((link, index) => (
                                            <Link
                                                key={index}
                                                href={link.url || "#"}
                                                className={`
                                                    inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ease-in-out
                                                    ${
                                                        link.active
                                                            ? "bg-blue-600 text-white shadow-md hover:bg-blue-700"
                                                            : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-100"
                                                    }
                                                    ${
                                                        !link.url
                                                            ? "cursor-not-allowed opacity-60"
                                                            : ""
                                                    }
                                                `}
                                                dangerouslySetInnerHTML={{
                                                    __html: link.label,
                                                }}
                                            />
                                        ))}
                                    </nav>
                                </div>
                            )}
                        </CardContent>

                        {/* Tombol Export */}
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
                                    {isExporting ? "Mengekspor..." : "Ekspor PDF"}
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
                                    {isExporting ? "Mengekspor..." : "Ekspor Excel"}
                                </Button>
                            </a>
                        </div>
                    </Card>
                </div>
            </div>
        </Layout>
    );
}