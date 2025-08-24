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
import { Download, FileText, AlertCircle } from "lucide-react";
import { useState } from "react";

export default function SalesHistoryReport({ auth, sales, filters = {} }) {
    const [isExporting, setIsExporting] = useState(false);

    const { data, setData, get, processing } = useForm({
        start_date: filters.start_date || "",
        end_date: filters.end_date || "",
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

    return (
        <Layout
            user={auth.user}
            header={
                <h2 className="font-bold text-3xl text-gray-800">
                    Sales History Report
                </h2>
            }
        >
            <Head title="Sales History Report" />

            <div className="py-8 max-w-7xl mx-auto px-4">
                {/* Filter Card */}
                <Card className="mb-6 shadow-lg border border-gray-200">
                    <CardHeader>
                        <CardTitle className="text-2xl font-semibold text-gray-700">
                            Filter Sales History
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
                                    className="text-gray-600 font-medium"
                                >
                                    Start Date
                                </Label>
                                <Input
                                    type="date"
                                    id="start_date"
                                    value={data.start_date}
                                    onChange={(e) =>
                                        setData("start_date", e.target.value)
                                    }
                                    className="focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label
                                    htmlFor="end_date"
                                    className="text-gray-600 font-medium"
                                >
                                    End Date
                                </Label>
                                <Input
                                    type="date"
                                    id="end_date"
                                    value={data.end_date}
                                    onChange={(e) =>
                                        setData("end_date", e.target.value)
                                    }
                                    className="focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>
                            <div className="flex items-end gap-2">
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

                {/* Summary Card */}
                {sales.data.length > 0 && (
                    <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-indigo-600">
                                        {sales.data.length}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        Total Transactions
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-green-600">
                                        {formatCurrency(getTotalAmount())}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        Total Sales Amount
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-purple-600">
                                        {formatCurrency(
                                            getTotalAmount() / sales.data.length
                                        )}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        Average Per Transaction
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Sales Table */}
                <Card className="shadow-lg border border-gray-200">
                    <CardHeader>
                        <CardTitle className="text-2xl font-semibold text-gray-700 flex items-center gap-2">
                            <FileText className="h-6 w-6" />
                            Sales History
                            {sales.data.length > 0 && (
                                <span className="text-sm font-normal text-gray-500">
                                    ({sales.data.length} transactions)
                                </span>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto rounded-md border">
                            <Table className="min-w-full">
                                <TableHeader className="bg-gray-50">
                                    <TableRow>
                                        <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Invoice
                                        </TableHead>
                                        <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Product
                                        </TableHead>
                                        <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Date
                                        </TableHead>
                                        <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            User
                                        </TableHead>
                                        <TableHead className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Total Amount
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
                                                    {sale.product?.name ||
                                                        "Unknown Product"}
                                                </TableCell>
                                                <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                    {sale.transaction_date}
                                                </TableCell>
                                                <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                    {sale.user?.name ||
                                                        "Unknown User"}
                                                </TableCell>
                                                <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-green-600">
                                                    {formatCurrency(
                                                        parseFloat(
                                                            sale.total_amount ||
                                                                0
                                                        )
                                                    )}
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
                                                        No sales data found for
                                                        the selected filters.
                                                    </span>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={handleReset}
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
                        {sales.links && sales.links.length > 3 && (
                            <div className="flex justify-center mt-6">
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
                                                    ? "bg-indigo-600 text-white shadow"
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

                    {/* Export Buttons */}
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
                                {isExporting ? "Exporting..." : "Export PDF"}
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
                                {isExporting ? "Exporting..." : "Export Excel"}
                            </Button>
                        </a>
                    </div>
                </Card>
            </div>
        </Layout>
    );
}
