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
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
    SelectValue,
} from "@/Components/ui/select";
import { Label } from "@/Components/ui/label";
import { Button } from "@/Components/ui/button";
import { AlertTriangle, Download, FileText, AlertCircle } from "lucide-react";
import { useState } from "react";

export default function MinimumStockReport({
    auth,
    products,
    categories,
    filters,
}) {
    const [isExporting, setIsExporting] = useState(false);

    const { data, setData, get, processing } = useForm({
        category_id: filters.category_id || "all",
    });

    const handleFilter = (e) => {
        e.preventDefault();
        get(route("reports.minimum-stock"), {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleReset = () => {
        setData("category_id", "all");
        get(route("reports.minimum-stock"), {
            data: { category_id: "all" },
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleExport = (type) => {
        setIsExporting(true);
        setTimeout(() => setIsExporting(false), 3000);
    };

    const getCriticalCount = () => {
        return products.data.filter(
            (product) => product.current_stock <= product.minimum_stock * 0.5
        ).length;
    };

    const getLowStockCount = () => {
        return products.data.filter(
            (product) =>
                product.current_stock > product.minimum_stock * 0.5 &&
                product.current_stock <= product.minimum_stock
        ).length;
    };

    const getStockStatus = (currentStock, minimumStock) => {
        const ratio = currentStock / minimumStock;
        if (ratio <= 0.5) {
            return {
                status: "Critical",
                color: "text-red-600 bg-red-100",
                icon: "🔴",
            };
        } else if (ratio <= 1) {
            return {
                status: "Low",
                color: "text-yellow-600 bg-yellow-100",
                icon: "🟡",
            };
        }
        return {
            status: "Normal",
            color: "text-green-600 bg-green-100",
            icon: "🟢",
        };
    };

    return (
        <Layout
            user={auth.user}
            header={
                <h2 className="font-bold text-2xl text-gray-800 flex items-center gap-2">
                    <AlertTriangle className="h-8 w-8 text-red-500" />
                    Minimum Stock Report
                </h2>
            }
        >
            <Head title="Minimum Stock Report" />

            <div className="py-6 max-w-7xl mx-auto space-y-6 px-4">
                {/* Alert Summary */}
                {products.data.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-2xl font-bold text-red-600">
                                            {getCriticalCount()}
                                        </div>
                                        <div className="text-sm text-red-700">
                                            Critical Stock
                                        </div>
                                        <div className="text-xs text-red-600">
                                            ≤ 50% of minimum
                                        </div>
                                    </div>
                                    <AlertTriangle className="h-10 w-10 text-red-500" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-2xl font-bold text-yellow-600">
                                            {getLowStockCount()}
                                        </div>
                                        <div className="text-sm text-yellow-700">
                                            Low Stock
                                        </div>
                                        <div className="text-xs text-yellow-600">
                                            51-100% of minimum
                                        </div>
                                    </div>
                                    <AlertCircle className="h-10 w-10 text-yellow-500" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-2xl font-bold text-blue-600">
                                            {products.data.length}
                                        </div>
                                        <div className="text-sm text-blue-700">
                                            Total Items
                                        </div>
                                        <div className="text-xs text-blue-600">
                                            Below minimum stock
                                        </div>
                                    </div>
                                    <FileText className="h-10 w-10 text-blue-500" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Filter Section */}
                <Card className="shadow-lg border border-gray-200">
                    <CardHeader>
                        <CardTitle className="text-xl font-semibold text-gray-700">
                            Filter Products
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form
                            onSubmit={handleFilter}
                            className="flex flex-col md:flex-row gap-4 items-end"
                        >
                            <div className="space-y-1 w-full md:w-1/3">
                                <Label className="text-gray-600 font-medium">
                                    Category
                                </Label>
                                <Select
                                    onValueChange={(value) =>
                                        setData("category_id", value)
                                    }
                                    value={data.category_id}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            All Categories
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
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleReset}
                                    disabled={processing}
                                >
                                    Reset
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                >
                                    {processing ? "Applying..." : "Apply"}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Products Table */}
                <Card className="shadow-lg border border-gray-200">
                    <CardHeader>
                        <CardTitle className="text-xl font-semibold text-gray-700 flex items-center gap-2">
                            <AlertTriangle className="h-6 w-6 text-red-500" />
                            Products Below Minimum Stock
                            {products.data.length > 0 && (
                                <span className="text-sm font-normal text-gray-500">
                                    ({products.data.length} items need
                                    attention)
                                </span>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto rounded-md border">
                            <Table>
                                <TableHeader className="bg-gray-50">
                                    <TableRow>
                                        <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </TableHead>
                                        <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Product Name
                                        </TableHead>
                                        <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Category
                                        </TableHead>
                                        <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Unit
                                        </TableHead>
                                        <TableHead className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Minimum Stock
                                        </TableHead>
                                        <TableHead className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Current Stock
                                        </TableHead>
                                        <TableHead className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Shortage
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody className="bg-white divide-y divide-gray-200">
                                    {products.data.length > 0 ? (
                                        products.data.map((product) => {
                                            const stockStatus = getStockStatus(
                                                product.current_stock,
                                                product.minimum_stock
                                            );
                                            const shortage = Math.max(
                                                0,
                                                product.minimum_stock -
                                                    product.current_stock
                                            );

                                            return (
                                                <TableRow
                                                    key={product.id}
                                                    className="hover:bg-gray-50 transition-colors"
                                                >
                                                    <TableCell className="px-6 py-4 whitespace-nowrap">
                                                        <span
                                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stockStatus.color}`}
                                                        >
                                                            <span className="mr-1">
                                                                {
                                                                    stockStatus.icon
                                                                }
                                                            </span>
                                                            {stockStatus.status}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {product.name}
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                        {product.category
                                                            ?.name || "-"}
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                        {product.unit?.name ||
                                                            "-"}
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700">
                                                        {product.minimum_stock}
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-right">
                                                        <span
                                                            className={
                                                                stockStatus.status ===
                                                                "Critical"
                                                                    ? "text-red-600 font-bold"
                                                                    : "text-gray-700"
                                                            }
                                                        >
                                                            {
                                                                product.current_stock
                                                            }
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-right">
                                                        {shortage > 0 && (
                                                            <span className="text-red-600 font-medium">
                                                                -{shortage}
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    ) : (
                                        <TableRow>
                                            <TableCell
                                                colSpan={7}
                                                className="px-6 py-8 text-center text-sm text-gray-500"
                                            >
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="text-6xl">
                                                        🎉
                                                    </div>
                                                    <span className="text-lg font-medium text-green-600">
                                                        Great news!
                                                    </span>
                                                    <span>
                                                        No products below
                                                        minimum stock found.
                                                    </span>
                                                    <span className="text-xs text-gray-400">
                                                        All inventory levels are
                                                        healthy.
                                                    </span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        {products.links && products.links.length > 3 && (
                            <div className="flex justify-center mt-4">
                                <nav className="flex gap-1">
                                    {products.links.map((link, index) => (
                                        <Link
                                            key={index}
                                            href={link.url || "#"}
                                            className={`px-3 py-1 rounded transition-colors ${
                                                link.active
                                                    ? "bg-indigo-600 text-white"
                                                    : "bg-white border text-gray-700 hover:bg-gray-100"
                                            } ${
                                                !link.url &&
                                                "opacity-50 cursor-not-allowed"
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

                    {/* Export Buttons */}
                    <div className="p-6 flex justify-end items-center gap-4 border-t border-gray-200">
                        <a
                            href={route(
                                "reports.minimum-stock.exportPdf",
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
                                {isExporting ? "Exporting..." : "Export PDF"}
                            </Button>
                        </a>
                        <a
                            href={route(
                                "reports.minimum-stock.exportExcel",
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
                                {isExporting ? "Exporting..." : "Export Excel"}
                            </Button>
                        </a>
                    </div>
                </Card>
            </div>
        </Layout>
    );
}
