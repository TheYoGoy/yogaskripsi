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
import { Download, FileText, AlertCircle, Building, Users } from "lucide-react";
import { useState } from "react";

export default function SupplierReport({ auth, suppliers, filters = {} }) {
    const [isExporting, setIsExporting] = useState(false);

    const { data, setData, get, processing } = useForm({
        search: filters.search || "",
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
        });
        get(route("reports.suppliers"), {
            data: { search: "", start_date: "", end_date: "" },
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

    const getTotalSuppliers = () => suppliers.data.length;
    const getTotalTransactions = () =>
        suppliers.data.reduce(
            (total, supplier) => total + (supplier.total_transactions || 0),
            0
        );
    const getTotalPurchases = () =>
        suppliers.data.reduce(
            (total, supplier) => total + parseFloat(supplier.total_amount || 0),
            0
        );

    return (
        <Layout
            user={auth.user}
            header={
                <h2 className="font-bold text-3xl text-gray-800 leading-tight">
                    Supplier Report
                </h2>
            }
        >
            <Head title="Supplier Report" />

            <div className="py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Filter Section */}
                    <Card className="mb-8 p-4 shadow-lg rounded-lg border border-gray-200">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-2xl font-semibold text-gray-700">
                                Filter Supplier Report
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form
                                onSubmit={handleFilter}
                                className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end"
                            >
                                <div className="space-y-2">
                                    <Label className="text-gray-600 font-medium">
                                        Search Supplier
                                    </Label>
                                    <Input
                                        type="text"
                                        placeholder="Supplier name..."
                                        value={data.search}
                                        onChange={(e) =>
                                            setData("search", e.target.value)
                                        }
                                        className="focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-gray-600 font-medium">
                                        Start Date
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
                                        End Date
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
                                <div className="flex gap-2 pt-2">
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="bg-indigo-600 text-white hover:bg-indigo-700"
                                    >
                                        {processing
                                            ? "Applying..."
                                            : "Apply Filters"}
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

                    {/* Summary Cards */}
                    {suppliers.data.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-2xl font-bold text-blue-600">
                                                {getTotalSuppliers()}
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                Total Suppliers
                                            </div>
                                        </div>
                                        <Users className="h-12 w-12 text-blue-500 opacity-80" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-2xl font-bold text-purple-600">
                                                {getTotalTransactions()}
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                Total Transactions
                                            </div>
                                        </div>
                                        <Building className="h-12 w-12 text-purple-500 opacity-80" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-2xl font-bold text-green-600">
                                                {formatCurrency(
                                                    getTotalPurchases()
                                                )}
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                Total Purchases
                                            </div>
                                        </div>
                                        <FileText className="h-12 w-12 text-green-500 opacity-80" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Supplier Report Table */}
                    <Card className="shadow-lg rounded-lg border border-gray-200">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-2xl font-semibold text-gray-700 flex items-center gap-2">
                                <Building className="h-6 w-6" />
                                Supplier Report
                                {suppliers.data.length > 0 && (
                                    <span className="text-sm font-normal text-gray-500">
                                        ({suppliers.data.length} suppliers)
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
                                                Name
                                            </TableHead>
                                            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Phone
                                            </TableHead>
                                            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Company
                                            </TableHead>
                                            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Address
                                            </TableHead>
                                            <TableHead className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Total Transactions
                                            </TableHead>
                                            <TableHead className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Total Purchases (Rp)
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
                                                        {supplier.phone || "-"}
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                        {supplier.company ||
                                                            "-"}
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate">
                                                        {supplier.address ||
                                                            "-"}
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-blue-600">
                                                        {supplier.total_transactions ||
                                                            0}
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-green-600">
                                                        {formatCurrency(
                                                            supplier.total_amount
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={6}
                                                    className="px-6 py-8 text-center text-sm text-gray-500"
                                                >
                                                    <div className="flex flex-col items-center gap-2">
                                                        <AlertCircle className="h-8 w-8 text-gray-400" />
                                                        <span>
                                                            No supplier data
                                                            found matching the
                                                            filters.
                                                        </span>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={
                                                                handleReset
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

                        {/* Export Buttons */}
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
                                        ? "Exporting..."
                                        : "Export PDF"}
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
