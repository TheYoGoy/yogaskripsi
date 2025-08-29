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
    summary = {},
}) {
    const [isExporting, setIsExporting] = useState(false);

    const { data, setData, get, processing } = useForm({
        category_id: filters.category_id || "all",
        per_page: filters.per_page || 15,
    });

    const handleFilter = (e) => {
        e.preventDefault();
        get(route("reports.minimum-stock"), {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleReset = () => {
        setData({
            category_id: "all",
            per_page: 15,
        });
        get(route("reports.minimum-stock"), {
            data: { category_id: "all", per_page: 15 },
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleExport = (type) => {
        setIsExporting(true);
        setTimeout(() => setIsExporting(false), 3000);
    };

    const getStockStatusBadge = (product) => {
        // Use stock_status from controller if available
        if (product.stock_status) {
            const status = product.stock_status;
            let colorClasses = "";

            switch (status.status) {
                case "critical":
                    colorClasses = "text-red-600 bg-red-100";
                    break;
                case "out_of_stock":
                    colorClasses = "text-gray-600 bg-gray-100";
                    break;
                default:
                    colorClasses = "text-yellow-600 bg-yellow-100";
            }

            return {
                status: status.message || status.status,
                color: colorClasses,
                icon:
                    status.status === "critical"
                        ? "🔴"
                        : status.status === "out_of_stock"
                        ? "⚫"
                        : "🟡",
            };
        }

        // Fallback calculation
        const currentStock = product.current_stock || 0;
        const rop = product.rop || 10;
        const ratio = currentStock / rop;

        if (currentStock <= 0) {
            return {
                status: "Out of Stock",
                color: "text-gray-600 bg-gray-100",
                icon: "⚫",
            };
        } else if (ratio <= 0.5) {
            return {
                status: "Critical",
                color: "text-red-600 bg-red-100",
                icon: "🔴",
            };
        } else {
            return {
                status: "Low Stock",
                color: "text-yellow-600 bg-yellow-100",
                icon: "🟡",
            };
        }
    };

    const formatNumber = (num) => {
        return new Intl.NumberFormat("id-ID").format(num || 0);
    };

    return (
        <Layout
            user={auth.user}
            header={
                <h2 className="font-bold text-3xl text-gray-800 leading-tight">
                    Minimum Stock Report
                </h2>
            }
        >
            <Head title="Minimum Stock Report" />

            <div className="py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Filter Section */}
                    <Card className="mb-8 p-4 shadow-lg rounded-lg border border-gray-200">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-2xl font-semibold text-gray-700">
                                Filter Products
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form
                                onSubmit={handleFilter}
                                className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end"
                            >
                                <div className="space-y-2">
                                    <Label className="text-gray-600 font-medium">
                                        Category
                                    </Label>
                                    <Select
                                        onValueChange={(value) =>
                                            setData("category_id", value)
                                        }
                                        value={data.category_id}
                                    >
                                        <SelectTrigger className="focus:ring-indigo-500 focus:border-indigo-500">
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
                                            ? "Applying..."
                                            : "Apply Filter"}
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

                    {/* Alert Summary Cards */}
                    {(products.data.length > 0 || summary) && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                            <Card className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-2xl font-bold text-red-600">
                                                {summary.critical_products || 0}
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                Critical Products
                                            </div>
                                            <div className="text-xs text-red-600">
                                                Need immediate attention
                                            </div>
                                        </div>
                                        <AlertTriangle className="h-12 w-12 text-red-500 opacity-80" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-2xl font-bold text-gray-600">
                                                {summary.zero_stock_products ||
                                                    0}
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                Out of Stock
                                            </div>
                                            <div className="text-xs text-gray-600">
                                                No inventory available
                                            </div>
                                        </div>
                                        <AlertCircle className="h-12 w-12 text-gray-500 opacity-80" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-2xl font-bold text-blue-600">
                                                {summary.low_stock_products ||
                                                    products.data.length}
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                Low Stock Items
                                            </div>
                                            <div className="text-xs text-blue-600">
                                                Below reorder point
                                            </div>
                                        </div>
                                        <FileText className="h-12 w-12 text-blue-500 opacity-80" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-2xl font-bold text-purple-600">
                                                {summary.total_products_checked ||
                                                    0}
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                Products Checked
                                            </div>
                                            <div className="text-xs text-purple-600">
                                                Total inventory items
                                            </div>
                                        </div>
                                        <FileText className="h-12 w-12 text-purple-500 opacity-80" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Products Table */}
                    <Card className="shadow-lg rounded-lg border border-gray-200">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-2xl font-semibold text-gray-700 flex items-center gap-2">
                                <AlertTriangle className="h-6 w-6" />
                                Products Below Reorder Point
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
                                <Table className="min-w-full divide-y divide-gray-200">
                                    <TableHeader className="bg-gray-50">
                                        <TableRow>
                                            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </TableHead>
                                            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Product Name
                                            </TableHead>
                                            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                SKU
                                            </TableHead>
                                            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Category
                                            </TableHead>
                                            <TableHead className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Current Stock
                                            </TableHead>
                                            <TableHead className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                ROP
                                            </TableHead>
                                            <TableHead className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                EOQ
                                            </TableHead>
                                            <TableHead className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Days Until Stockout
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
                                                                {
                                                                    stockStatus.status
                                                                }
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                            {product.name}
                                                        </TableCell>
                                                        <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                            {product.sku ||
                                                                product.code ||
                                                                "-"}
                                                        </TableCell>
                                                        <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                            {product.category
                                                                ?.name || "-"}
                                                        </TableCell>
                                                        <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-right">
                                                            <span
                                                                className={
                                                                    product.current_stock <=
                                                                    0
                                                                        ? "text-gray-600 font-bold"
                                                                        : stockStatus.status ===
                                                                          "Critical"
                                                                        ? "text-red-600 font-bold"
                                                                        : "text-gray-700"
                                                                }
                                                            >
                                                                {formatNumber(
                                                                    product.current_stock
                                                                )}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-right text-blue-600 font-medium">
                                                            {formatNumber(
                                                                product.rop
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600 font-medium">
                                                            {formatNumber(
                                                                product.eoq
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-right text-orange-600 font-medium">
                                                            {product.days_until_stockout
                                                                ? `${product.days_until_stockout} days`
                                                                : "-"}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })
                                        ) : (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={8}
                                                    className="px-6 py-8 text-center text-sm text-gray-500"
                                                >
                                                    <div className="flex flex-col items-center gap-2">
                                                        <AlertCircle className="h-8 w-8 text-green-400" />
                                                        <span className="text-lg font-medium text-green-600">
                                                            Great news!
                                                        </span>
                                                        <span>
                                                            No products below
                                                            reorder point found.
                                                        </span>
                                                        <span className="text-xs text-gray-400">
                                                            All inventory levels
                                                            are healthy.
                                                        </span>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={
                                                                handleReset
                                                            }
                                                            className="mt-2"
                                                        >
                                                            Clear Filter
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination */}
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
                                    {isExporting
                                        ? "Exporting..."
                                        : "Export PDF"}
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
                                    {isExporting
                                        ? "Exporting..."
                                        : "Export Excel"}
                                </Button>
                            </a>
                        </div>
                    </Card>
                </div>
            </div>
        </Layout>
    );
}
