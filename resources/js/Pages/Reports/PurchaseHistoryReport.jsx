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
import { Download, FileText, AlertCircle } from "lucide-react";
import { useState } from "react";

export default function PurchaseHistoryReport({
    auth,
    purchases,
    suppliers = [],
    filters = {},
}) {
    const [isExporting, setIsExporting] = useState(false);

    const { data, setData, get, processing } = useForm({
        supplier_id: (filters && filters.supplier_id) || "all",
        start_date: (filters && filters.start_date) || "",
        end_date: (filters && filters.end_date) || "",
    });

    const handleFilter = (e) => {
        e.preventDefault();

        // Validate date range
        if (
            data.start_date &&
            data.end_date &&
            new Date(data.start_date) > new Date(data.end_date)
        ) {
            alert("Start date cannot be later than end date");
            return;
        }

        get(route("reports.purchase-history"), {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleResetFilters = () => {
        setData({
            supplier_id: "all",
            start_date: "",
            end_date: "",
        });
        get(route("reports.purchase-history"), {
            data: { supplier_id: "all", start_date: "", end_date: "" },
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

    const getTotalAmount = () => {
        return purchases.data.reduce(
            (total, purchase) => total + parseFloat(purchase.total_amount || 0),
            0
        );
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

    return (
        <Layout
            user={auth.user}
            header={
                <h2 className="font-bold text-3xl text-gray-800 leading-tight">
                    Purchase History Report
                </h2>
            }
        >
            <Head title="Purchase History Report" />

            <div className="py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Filter Section */}
                    <Card className="mb-8 p-4 shadow-lg rounded-lg border border-gray-200">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-2xl font-semibold text-gray-700">
                                Filter Purchase History
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form
                                onSubmit={handleFilter}
                                className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4 items-end"
                            >
                                {/* Supplier Filter */}
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="supplier_id"
                                        className="text-gray-600 font-medium"
                                    >
                                        Supplier
                                    </Label>
                                    <Select
                                        onValueChange={(value) =>
                                            setData("supplier_id", value)
                                        }
                                        value={data.supplier_id}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select supplier" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                All Suppliers
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

                                {/* Start Date */}
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="start_date"
                                        className="text-gray-600 font-medium"
                                    >
                                        Start Date
                                    </Label>
                                    <Input
                                        id="start_date"
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

                                {/* End Date */}
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="end_date"
                                        className="text-gray-600 font-medium"
                                    >
                                        End Date
                                    </Label>
                                    <Input
                                        id="end_date"
                                        type="date"
                                        value={data.end_date}
                                        onChange={(e) =>
                                            setData("end_date", e.target.value)
                                        }
                                        className="focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>

                                {/* Buttons */}
                                <div className="col-span-full md:col-span-2 flex gap-3 pt-2">
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

                    {/* Summary Card */}
                    {purchases.data.length > 0 && (
                        <Card className="mb-6 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200">
                            <CardContent className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-purple-600">
                                            {purchases.data.length}
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            Total Purchases
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-green-600">
                                            {formatCurrency(getTotalAmount())}
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            Total Purchase Amount
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-blue-600">
                                            {formatCurrency(
                                                getTotalAmount() /
                                                    purchases.data.length
                                            )}
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            Average Per Purchase
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Table Section */}
                    <Card className="shadow-lg rounded-lg border border-gray-200">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-2xl font-semibold text-gray-700 flex items-center gap-2">
                                <FileText className="h-6 w-6" />
                                Purchase History
                                {purchases.data.length > 0 && (
                                    <span className="text-sm font-normal text-gray-500">
                                        ({purchases.data.length} purchases)
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
                                                Invoice No
                                            </TableHead>
                                            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Supplier
                                            </TableHead>
                                            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Date
                                            </TableHead>
                                            <TableHead className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Total Amount
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
                                                        {
                                                            purchase.invoice_number
                                                        }
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                        {purchase.supplier
                                                            ?.name ||
                                                            "Unknown Supplier"}
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                        {formatDate(
                                                            purchase.transaction_date
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-green-600">
                                                        {formatCurrency(
                                                            purchase.total_amount
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={4}
                                                    className="px-6 py-8 text-center text-sm text-gray-500"
                                                >
                                                    <div className="flex flex-col items-center gap-2">
                                                        <AlertCircle className="h-8 w-8 text-gray-400" />
                                                        <span>
                                                            No purchase data
                                                            found matching the
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

                            {/* Pagination */}
                            {purchases.links && purchases.links.length > 3 && (
                                <div className="flex justify-center mt-8">
                                    <nav className="flex items-center space-x-2">
                                        {purchases.links.map((link, index) => (
                                            <Link
                                                key={index}
                                                href={link.url || "#"}
                                                className={`
                                                    px-4 py-2 text-sm font-medium rounded-md transition-colors
                                                    ${
                                                        link.active
                                                            ? "bg-indigo-600 text-white shadow"
                                                            : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-100"
                                                    }
                                                    ${
                                                        !link.url
                                                            ? "cursor-not-allowed opacity-50"
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
                                        ? "Exporting..."
                                        : "Export PDF"}
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
