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
import { CalendarIcon, Download, FileText, AlertCircle } from "lucide-react";
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

        // Validate date range
        if (
            data.start_date &&
            data.end_date &&
            new Date(data.start_date) > new Date(data.end_date)
        ) {
            alert("Start date cannot be later than end date");
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
            return format(new Date(dateString), "PPP");
        } catch (error) {
            return dateString;
        }
    };

    return (
        <Layout
            user={auth.user}
            header={
                <h2 className="font-bold text-3xl text-gray-800 leading-tight">
                    Stock Mutation Report
                </h2>
            }
        >
            <Head title="Mutation Report" />

            <div className="py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Card for mutation report filters */}
                    <Card className="mb-8 p-4 shadow-lg rounded-lg border border-gray-200">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-2xl font-semibold text-gray-700">
                                Filter Stock Mutation
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form
                                onSubmit={handleFilter}
                                className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 items-end gap-6"
                            >
                                {/* Filter by Product */}
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="product_id"
                                        className="text-gray-600 font-medium"
                                    >
                                        Product
                                    </Label>
                                    <Select
                                        onValueChange={(value) =>
                                            setData("product_id", value)
                                        }
                                        value={data.product_id}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select a product" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                All Products
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

                                {/* Filter by Start Date */}
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="start_date"
                                        className="text-gray-600 font-medium"
                                    >
                                        Start Date
                                    </Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-full justify-start text-left font-normal",
                                                    !data.start_date &&
                                                        "text-muted-foreground",
                                                    "focus:ring-indigo-500 focus:border-indigo-500"
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {data.start_date ? (
                                                    format(
                                                        new Date(
                                                            data.start_date
                                                        ),
                                                        "PPP"
                                                    )
                                                ) : (
                                                    <span>Pick a date</span>
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

                                {/* Filter by End Date */}
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="end_date"
                                        className="text-gray-600 font-medium"
                                    >
                                        End Date
                                    </Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-full justify-start text-left font-normal",
                                                    !data.end_date &&
                                                        "text-muted-foreground",
                                                    "focus:ring-indigo-500 focus:border-indigo-500"
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {data.end_date ? (
                                                    format(
                                                        new Date(data.end_date),
                                                        "PPP"
                                                    )
                                                ) : (
                                                    <span>Pick a date</span>
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

                                {/* Buttons for filter and reset */}
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

                    {/* Card to display the mutation report table */}
                    <Card className="shadow-lg rounded-lg border border-gray-200">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-2xl font-semibold text-gray-700 flex items-center gap-2">
                                <FileText className="h-6 w-6" />
                                Stock Mutation Details
                                {transactions.length > 0 && (
                                    <span className="text-sm font-normal text-gray-500">
                                        ({transactions.length} transactions)
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
                                                Date
                                            </TableHead>
                                            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Type
                                            </TableHead>
                                            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Product
                                            </TableHead>
                                            <TableHead className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Quantity
                                            </TableHead>
                                            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Related Party
                                            </TableHead>
                                            <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Recorded By
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
                                                                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                                    transaction.type ===
                                                                    "in"
                                                                        ? "bg-green-100 text-green-800"
                                                                        : "bg-red-100 text-red-800"
                                                                }`}
                                                            >
                                                                {transaction.type ===
                                                                "in"
                                                                    ? "Stock In"
                                                                    : "Stock Out"}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                            {transaction.product
                                                                ?.name ||
                                                                "Unknown Product"}
                                                        </TableCell>
                                                        <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-right">
                                                            <span
                                                                className={`font-medium ${
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
                                                                "-"}
                                                        </TableCell>
                                                        <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                            {transaction.user
                                                                ?.name ||
                                                                "Unknown User"}
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
                                                            No stock mutations
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
                        </CardContent>

                        {/* Export Buttons */}
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
                                        ? "Exporting..."
                                        : "Export PDF"}
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
