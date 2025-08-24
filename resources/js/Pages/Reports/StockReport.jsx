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
import { AlertCircle, Download, FileText } from "lucide-react";

export default function StockReport({ auth, products, categories, filters }) {
    const [isExporting, setIsExporting] = useState(false);

    const { data, setData, get, processing } = useForm({
        category_id: filters.category_id || "all",
        min_stock: filters.min_stock || "",
        max_stock: filters.max_stock || "",
    });

    const handleFilter = (e) => {
        e.preventDefault();

        // Validate min_stock <= max_stock if both are provided
        if (
            data.min_stock &&
            data.max_stock &&
            parseInt(data.min_stock) > parseInt(data.max_stock)
        ) {
            alert("Minimum stock cannot be greater than maximum stock");
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
        // Reset after 3 seconds to re-enable buttons
        setTimeout(() => setIsExporting(false), 3000);
    };

    return (
        <Layout
            user={auth.user}
            header={
                <h2 className="font-bold text-3xl text-gray-800 leading-tight">
                    Stock Report
                </h2>
            }
        >
            <Head title="Stock Report" />

            <div className="py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Filter Card */}
                    <Card className="mb-8 p-4 shadow-lg rounded-lg border border-gray-200">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-2xl font-semibold text-gray-700">
                                Filter Stock Report
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form
                                onSubmit={handleFilter}
                                className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 items-end gap-6"
                            >
                                {/* Filter by Category */}
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="category_id"
                                        className="text-gray-600 font-medium"
                                    >
                                        Category
                                    </Label>
                                    <Select
                                        onValueChange={(value) =>
                                            setData("category_id", value)
                                        }
                                        value={data.category_id}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select a category" />
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

                                {/* Filter by Minimum Stock */}
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="min_stock"
                                        className="text-gray-600 font-medium"
                                    >
                                        Min Stock
                                    </Label>
                                    <Input
                                        id="min_stock"
                                        type="number"
                                        min="0"
                                        placeholder="e.g., 10"
                                        value={data.min_stock}
                                        onChange={(e) =>
                                            setData("min_stock", e.target.value)
                                        }
                                        className="focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>

                                {/* Filter by Maximum Stock */}
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="max_stock"
                                        className="text-gray-600 font-medium"
                                    >
                                        Max Stock
                                    </Label>
                                    <Input
                                        id="max_stock"
                                        type="number"
                                        min="0"
                                        placeholder="e.g., 100"
                                        value={data.max_stock}
                                        onChange={(e) =>
                                            setData("max_stock", e.target.value)
                                        }
                                        className="focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>

                                {/* Filter and Reset Buttons */}
                                <div className="col-span-full md:col-span-1 flex justify-end gap-3 pt-6 md:pt-0">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleResetFilters}
                                        disabled={processing}
                                        className="w-full md:w-auto"
                                    >
                                        Reset Filters
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white"
                                    >
                                        {processing
                                            ? "Applying..."
                                            : "Apply Filters"}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Stock Report Table Card */}
                    <Card className="shadow-lg rounded-lg border border-gray-200">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-2xl font-semibold text-gray-700 flex items-center gap-2">
                                <FileText className="h-6 w-6" />
                                Current Stock Levels
                                {products.data.length > 0 && (
                                    <span className="text-sm font-normal text-gray-500">
                                        ({products.data.length} items)
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
                                                SKU
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
                                                Current Stock
                                            </TableHead>
                                            <TableHead className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                ROP
                                            </TableHead>
                                            <TableHead className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                EOQ
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
                                                        {product.category
                                                            ?.name || "-"}
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                        {product.unit?.name ||
                                                            "-"}
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-right">
                                                        <span
                                                            className={`font-medium ${
                                                                product.current_stock <=
                                                                (product.minimum_stock ||
                                                                    0)
                                                                    ? "text-red-600"
                                                                    : "text-gray-700"
                                                            }`}
                                                        >
                                                            {
                                                                product.current_stock
                                                            }
                                                        </span>
                                                        {product.current_stock <=
                                                            (product.minimum_stock ||
                                                                0) && (
                                                            <AlertCircle className="inline ml-1 h-4 w-4 text-red-500" />
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700">
                                                        {product.rop || "-"}
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700">
                                                        {product.eoq || "-"}
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
                                                            No products found
                                                            matching the
                                                            filters.
                                                        </span>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={
                                                                handleResetFilters
                                                            }
                                                            className="mt-2"
                                                        >
                                                            Clear Filters
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
                                <div className="flex justify-center mt-8">
                                    <nav className="flex items-center space-x-2">
                                        {products.links.map((link, index) => (
                                            <Link
                                                key={index}
                                                href={link.url || "#"}
                                                className={`
                                                    inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ease-in-out
                                                    ${
                                                        link.active
                                                            ? "bg-indigo-600 text-white shadow-md hover:bg-indigo-700"
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

                        {/* Export Buttons */}
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
                                        ? "Exporting..."
                                        : "Export PDF"}
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
