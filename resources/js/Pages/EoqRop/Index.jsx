import { useEffect, useState, useCallback, useMemo } from "react";
import { Head, Link, useForm, router } from "@inertiajs/react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/Components/ui/table";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import InputError from "@/Components/InputError";
import { toast } from "@/hooks/use-toast";
import DatePicker from "@/Components/DatePicker";
import dayjs from "dayjs";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationPrevious,
    PaginationNext,
    PaginationEllipsis,
} from "@/Components/ui/pagination";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/Components/ui/card";
import { Separator } from "@/Components/ui/separator";
import {
    Settings,
    RotateCcw,
    Search,
    SquarePen,
    Save,
    XCircle,
    Calculator,
    Zap,
    FileText,
    Download,
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { debounce } from "lodash";
import Layout from "@/Layouts/Layout";
import { usePage } from "@inertiajs/react";

export default function EoqRopIndex({
    auth,
    products,
    eoqRopData,
    flash,
    filters,
}) {
    const { settings } = usePage().props;
    const [editingProductId, setEditingProductId] = useState(null);

    // State untuk Filter
    const [searchQuery, setSearchQuery] = useState(filters.search || "");
    const [selectedDate, setSelectedDate] = useState(
        filters.created_at ? new Date(filters.created_at) : null
    );
    const [perPage, setPerPage] = useState(filters.per_page || "10");

    // useForm untuk mengelola data form parameter ROP/EOQ
    const { data, setData, put, processing, errors, reset } = useForm({
        lead_time: "",
        daily_usage_rate: "",
        holding_cost_percentage: "",
        ordering_cost: "",
    });

    // Flash notifications
    useEffect(() => {
        if (flash && flash.success) {
            toast({
                title: "Sukses!",
                description: flash.success,
                variant: "success",
            });
        }
        if (flash && flash.error) {
            toast({
                title: "Error!",
                description: flash.error,
                variant: "destructive",
            });
        }
    }, [flash]);

    // Edit parameter handler
    const handleEditClick = useCallback(
        (product) => {
            setEditingProductId(product.id);
            setData({
                lead_time: product.lead_time || "",
                daily_usage_rate: product.daily_usage_rate || "",
                holding_cost_percentage: product.holding_cost_percentage || "",
                ordering_cost: product.ordering_cost || "",
            });
        },
        [setData]
    );

    // Cancel edit handler
    const handleCancelEdit = useCallback(() => {
        setEditingProductId(null);
        reset();
    }, [reset]);

    // Update parameters handler
    const handleUpdateParameters = useCallback(
        (e) => {
            e.preventDefault();

            // Use eoq-rop route instead of products.update
            put(route("eoq-rop.update-parameters", editingProductId), {
                onSuccess: () => {
                    setEditingProductId(null);
                    reset();
                    toast({
                        title: "Berhasil diperbarui!",
                        description:
                            "Parameter EOQ & ROP telah berhasil diperbarui.",
                        variant: "success",
                    });
                },
                onError: (errors) => {
                    toast({
                        title: "Gagal Memperbarui Parameter",
                        description:
                            errors.general ||
                            Object.values(errors)[0] ||
                            "Terjadi kesalahan saat memperbarui parameter.",
                        variant: "destructive",
                    });
                },
            });
        },
        [editingProductId, put, reset]
    );

    // Filter functions
    const applyFilters = useCallback(() => {
        router.get(
            route("eoq-rop.index"),
            {
                search: searchQuery || undefined,
                created_at: selectedDate
                    ? dayjs(selectedDate).format("YYYY-MM-DD")
                    : undefined,
                per_page: perPage,
                page: 1,
            },
            { preserveState: true, replace: true }
        );
    }, [searchQuery, selectedDate, perPage]);

    // Debounced search
    const debouncedApplyFilters = useMemo(
        () => debounce(applyFilters, 500),
        [applyFilters]
    );

    // Effect for search query changes
    useEffect(() => {
        if (searchQuery !== filters.search) {
            debouncedApplyFilters();
        }
        return () => {
            debouncedApplyFilters.cancel();
        };
    }, [searchQuery, debouncedApplyFilters, filters.search]);

    // Effect for date and perPage changes
    useEffect(() => {
        applyFilters();
    }, [selectedDate, perPage]);

    // Reset filters
    const resetFilters = useCallback(() => {
        setSearchQuery("");
        setSelectedDate(null);
        setPerPage("10");
        router.get(
            route("eoq-rop.index"),
            {},
            { preserveState: true, replace: true }
        );
    }, []);

    // Bulk recalculate handler
    const handleBulkRecalculate = useCallback(() => {
        router.post(
            route("eoq-rop.bulk-recalculate"),
            {},
            {
                onSuccess: () => {
                    toast({
                        title: "Berhasil!",
                        description: "Semua EOQ & ROP telah dihitung ulang.",
                        variant: "success",
                    });
                },
                onError: () => {
                    toast({
                        title: "Error!",
                        description: "Gagal menghitung ulang EOQ & ROP.",
                        variant: "destructive",
                    });
                },
            }
        );
    }, []);

    // Export handlers
    const handleExportExcel = useCallback(() => {
        const params = new URLSearchParams();
        
        if (searchQuery) {
            params.append('search', searchQuery);
        }
        
        if (selectedDate) {
            params.append('created_at', dayjs(selectedDate).format("YYYY-MM-DD"));
        }
        
        const queryString = params.toString();
        const url = queryString 
            ? `${route("eoq-rop.export-excel")}?${queryString}`
            : route("eoq-rop.export-excel");
        
        window.location.href = url;
        
        toast({
            title: "Export Excel",
            description: "File Excel sedang didownload...",
            variant: "success",
        });
    }, [searchQuery, selectedDate]);

    const handleExportPdf = useCallback(() => {
        const params = new URLSearchParams();
        
        if (searchQuery) {
            params.append('search', searchQuery);
        }
        
        if (selectedDate) {
            params.append('created_at', dayjs(selectedDate).format("YYYY-MM-DD"));
        }
        
        const queryString = params.toString();
        const url = queryString 
            ? `${route("eoq-rop.export-pdf")}?${queryString}`
            : route("eoq-rop.export-pdf");
        
        window.location.href = url;
        
        toast({
            title: "Export PDF",
            description: "File PDF sedang didownload...",
            variant: "success",
        });
    }, [searchQuery, selectedDate]);

    // Helper function for parsing HTML entities
    const getLabelString = (label) => {
        const doc = new DOMParser().parseFromString(label, "text/html");
        return doc.documentElement.textContent;
    };

    // Get stock status color
    const getStockStatusColor = (currentStock, rop) => {
        if (currentStock <= rop) return "text-red-600 font-bold";
        if (currentStock <= rop * 1.5) return "text-yellow-600 font-bold";
        return "text-green-600";
    };

    return (
        <Layout user={auth.user}>
            <Head title="Optimasi Inventaris Produk" />
            <div className="container max-w-7xl mx-auto px-4 py-8">
                <Card className="shadow-lg border-none animate-in fade-in-0 slide-in-from-top-2 after:duration-500 rounded-xl">
                    <CardHeader className="pb-4 border-b">
                        <Card className="relative w-full p-6 bg-[#0f766e] overflow-hidden rounded-xl">
                            <Settings className="absolute right-4 bottom-[-100px] text-white opacity-10 w-80 h-80 z-0" />

                            <div className="flex gap-4 items-center z-10">
                                <Settings className="text-white w-14 h-14" />
                                <div>
                                    <CardTitle className="text-3xl md:text-4xl font-bold tracking-tight text-white">
                                        Optimasi Inventaris Produk
                                    </CardTitle>
                                    <CardDescription className="text-md text-white mt-1">
                                        Kelola parameter EOQ dan ROP untuk
                                        optimasi stok produk Anda.
                                    </CardDescription>
                                </div>
                            </div>

                            {/* Bulk Recalculate Button */}
                            {(auth.user.roles.includes("admin") ||
                                auth.user.roles.includes("manager")) && (
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 z-20">
                                    <Button
                                        onClick={handleBulkRecalculate}
                                        className="flex items-center gap-2 bg-white text-[#0f766e] hover:bg-gray-100 shadow-md transition-all duration-200 text-base py-2 px-6 rounded-lg"
                                    >
                                        <Calculator className="h-5 w-5" />{" "}
                                        Hitung Ulang Semua
                                    </Button>
                                </div>
                            )}
                        </Card>
                    </CardHeader>

                    <CardContent className="space-y-6 pt-6">
                        {/* Filter & Search Section */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 border rounded-lg shadow-sm">
                            {/* Search Input */}
                            <div className="flex flex-col gap-2">
                                <Label
                                    htmlFor="search-input"
                                    className="text-sm font-medium"
                                >
                                    Cari Produk
                                </Label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="search-input"
                                        type="text"
                                        placeholder="Nama Produk, SKU, atau Kode..."
                                        value={searchQuery}
                                        onChange={(e) =>
                                            setSearchQuery(e.target.value)
                                        }
                                        className="pl-9 pr-3 py-2 rounded-md"
                                    />
                                </div>
                            </div>

                            {/* Date Filter */}
                            <div className="flex flex-col gap-2">
                                <Label
                                    htmlFor="date-filter"
                                    className="text-sm font-medium"
                                >
                                    Tanggal Dibuat Produk
                                </Label>
                                <DatePicker
                                    id="date-filter"
                                    value={selectedDate}
                                    onChange={setSelectedDate}
                                    className="border-gray-300 focus-visible:ring-[#0f766e] focus-visible:border-[#0f766e] w-full rounded-md"
                                />
                            </div>

                            {/* Per Page Selector */}
                            <div className="flex flex-col gap-2">
                                <Label
                                    htmlFor="per-page-select"
                                    className="text-sm font-medium"
                                >
                                    Tampilkan
                                </Label>
                                <Select
                                    value={perPage}
                                    onValueChange={setPerPage}
                                >
                                    <SelectTrigger
                                        id="per-page-select"
                                        className="w-full rounded-md"
                                    >
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="10">10</SelectItem>
                                        <SelectItem value="25">25</SelectItem>
                                        <SelectItem value="50">50</SelectItem>
                                        <SelectItem value="100">100</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Action Buttons */}
                            <div className="col-span-full flex justify-between items-center mt-2 pt-4 border-t">
                                {/* Export Buttons */}
                                <div className="flex gap-2">
                                    <Button
                                        onClick={handleExportExcel}
                                        variant="outline"
                                        className="gap-2 border-green-300 text-green-700 hover:bg-green-50 transition-colors duration-200 shadow-sm rounded-md"
                                    >
                                        <FileText className="h-4 w-4" />
                                        Export Excel
                                    </Button>
                                    <Button
                                        onClick={handleExportPdf}
                                        variant="outline"
                                        className="gap-2 border-red-300 text-red-700 hover:bg-red-50 transition-colors duration-200 shadow-sm rounded-md"
                                    >
                                        <Download className="h-4 w-4" />
                                        Export PDF
                                    </Button>
                                </div>

                                {/* Reset Filter Button */}
                                <Button
                                    onClick={resetFilters}
                                    variant="outline"
                                    className="gap-1 border-gray-300 hover:bg-gray-100 transition-colors duration-200 shadow-sm rounded-md"
                                >
                                    <RotateCcw className="h-4 w-4" /> Reset
                                    Filter
                                </Button>
                            </div>
                        </div>

                        <Separator className="my-6" />

                        {/* Info Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <Card className="bg-blue-50 border-blue-200">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-blue-100 rounded-full">
                                            <Calculator className="h-4 w-4 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-blue-600">
                                                ROP
                                            </p>
                                            <p className="text-xs text-blue-500">
                                                Reorder Point
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-green-50 border-green-200">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-green-100 rounded-full">
                                            <Zap className="h-4 w-4 text-green-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-green-600">
                                                EOQ
                                            </p>
                                            <p className="text-xs text-green-500">
                                                Economic Order Quantity
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-orange-50 border-orange-200">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-orange-100 rounded-full">
                                            <div className="h-4 w-4 bg-orange-600 rounded-full"></div>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-orange-600">
                                                Lead Time
                                            </p>
                                            <p className="text-xs text-orange-500">
                                                Waktu Tunggu (Hari)
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-purple-50 border-purple-200">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-purple-100 rounded-full">
                                            <div className="h-4 w-4 bg-purple-600 rounded-full"></div>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-purple-600">
                                                Daily Usage
                                            </p>
                                            <p className="text-xs text-purple-500">
                                                Penggunaan Harian
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Table Section */}
                        <div className="rounded-lg border overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                                <Table className="min-w-full divide-y">
                                    <TableHeader className="bg-[#0f766e]">
                                        <TableRow>
                                            <TableHead className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider min-w-[200px]">
                                                Nama Produk
                                            </TableHead>
                                            <TableHead className="px-6 py-3 text-right text-xs font-semibold text-white uppercase tracking-wider min-w-[120px]">
                                                Stok Saat Ini
                                            </TableHead>
                                            <TableHead className="px-6 py-3 text-right text-xs font-semibold text-white uppercase tracking-wider min-w-[100px]">
                                                ROP
                                            </TableHead>
                                            <TableHead className="px-6 py-3 text-right text-xs font-semibold text-white uppercase tracking-wider min-w-[100px]">
                                                EOQ
                                            </TableHead>
                                            <TableHead className="px-6 py-3 text-right text-xs font-semibold text-white uppercase tracking-wider min-w-[120px]">
                                                Lead Time (Hari)
                                            </TableHead>
                                            <TableHead className="px-6 py-3 text-right text-xs font-semibold text-white uppercase tracking-wider min-w-[140px]">
                                                Penggunaan Harian
                                            </TableHead>
                                            <TableHead className="px-6 py-3 text-right text-xs font-semibold text-white uppercase tracking-wider min-w-[140px]">
                                                Biaya Penyimpanan (%)
                                            </TableHead>
                                            <TableHead className="px-6 py-3 text-right text-xs font-semibold text-white uppercase tracking-wider min-w-[130px]">
                                                Biaya Pemesanan
                                            </TableHead>
                                            <TableHead className="px-6 py-3 text-center text-xs font-semibold text-white uppercase tracking-wider min-w-[150px]">
                                                Aksi
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody className="divide-y">
                                        {products.data.length > 0 ? (
                                            products.data.map((product) => (
                                                <TableRow
                                                    key={product.id}
                                                    className="hover:bg-gray-50 transition-colors duration-150"
                                                >
                                                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        <div>
                                                            <div className="font-medium">
                                                                {product.name}
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                {product.sku}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell
                                                        className={`px-6 py-4 whitespace-nowrap text-sm text-right ${getStockStatusColor(
                                                            product.current_stock,
                                                            product.rop
                                                        )}`}
                                                    >
                                                        {product.current_stock}
                                                        {product.current_stock <=
                                                            product.rop && (
                                                            <div className="text-xs text-red-500">
                                                                ⚠️ Di bawah ROP
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-blue-600">
                                                        {product.rop || 0}
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-green-600">
                                                        {product.eoq || 0}
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-right">
                                                        {editingProductId ===
                                                        product.id ? (
                                                            <div className="w-24">
                                                                <Input
                                                                    type="number"
                                                                    value={
                                                                        data.lead_time
                                                                    }
                                                                    onChange={(
                                                                        e
                                                                    ) =>
                                                                        setData(
                                                                            "lead_time",
                                                                            e
                                                                                .target
                                                                                .value
                                                                        )
                                                                    }
                                                                    className="text-right text-sm"
                                                                    min="0"
                                                                />
                                                                <InputError
                                                                    message={
                                                                        errors.lead_time
                                                                    }
                                                                    className="mt-1 text-xs"
                                                                />
                                                            </div>
                                                        ) : (
                                                            product.lead_time ||
                                                            0
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-right">
                                                        {editingProductId ===
                                                        product.id ? (
                                                            <div className="w-24">
                                                                <Input
                                                                    type="number"
                                                                    value={
                                                                        data.daily_usage_rate
                                                                    }
                                                                    onChange={(
                                                                        e
                                                                    ) =>
                                                                        setData(
                                                                            "daily_usage_rate",
                                                                            e
                                                                                .target
                                                                                .value
                                                                        )
                                                                    }
                                                                    className="text-right text-sm"
                                                                    step="0.01"
                                                                    min="0"
                                                                />
                                                                <InputError
                                                                    message={
                                                                        errors.daily_usage_rate
                                                                    }
                                                                    className="mt-1 text-xs"
                                                                />
                                                            </div>
                                                        ) : (
                                                            product.daily_usage_rate ||
                                                            0
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-right">
                                                        {editingProductId ===
                                                        product.id ? (
                                                            <div className="w-24">
                                                                <Input
                                                                    type="number"
                                                                    value={
                                                                        data.holding_cost_percentage
                                                                    }
                                                                    onChange={(
                                                                        e
                                                                    ) =>
                                                                        setData(
                                                                            "holding_cost_percentage",
                                                                            e
                                                                                .target
                                                                                .value
                                                                        )
                                                                    }
                                                                    className="text-right text-sm"
                                                                    step="0.01"
                                                                    min="0"
                                                                    max="1"
                                                                />
                                                                <InputError
                                                                    message={
                                                                        errors.holding_cost_percentage
                                                                    }
                                                                    className="mt-1 text-xs"
                                                                />
                                                            </div>
                                                        ) : (
                                                            (
                                                                (parseFloat(
                                                                    product.holding_cost_percentage
                                                                ) || 0) * 100
                                                            ).toFixed(2) + "%"
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-right">
                                                        {editingProductId ===
                                                        product.id ? (
                                                            <div className="w-28">
                                                                <Input
                                                                    type="number"
                                                                    value={
                                                                        data.ordering_cost
                                                                    }
                                                                    onChange={(
                                                                        e
                                                                    ) =>
                                                                        setData(
                                                                            "ordering_cost",
                                                                            e
                                                                                .target
                                                                                .value
                                                                        )
                                                                    }
                                                                    className="text-right text-sm"
                                                                    step="0.01"
                                                                    min="0"
                                                                />
                                                                <InputError
                                                                    message={
                                                                        errors.ordering_cost
                                                                    }
                                                                    className="mt-1 text-xs"
                                                                />
                                                            </div>
                                                        ) : (
                                                            "Rp " +
                                                            (
                                                                parseFloat(
                                                                    product.ordering_cost
                                                                ) || 0
                                                            ).toLocaleString(
                                                                "id-ID"
                                                            )
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                                        {auth.user.roles.includes(
                                                            "admin"
                                                        ) ||
                                                        auth.user.roles.includes(
                                                            "manager"
                                                        ) ? (
                                                            editingProductId ===
                                                            product.id ? (
                                                                <div className="flex justify-center space-x-2">
                                                                    <Button
                                                                        size="icon"
                                                                        onClick={
                                                                            handleUpdateParameters
                                                                        }
                                                                        disabled={
                                                                            processing
                                                                        }
                                                                        className="bg-green-600 hover:bg-green-700 text-white rounded-md"
                                                                        title="Simpan Parameter"
                                                                    >
                                                                        <Save className="h-4 w-4" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="outline"
                                                                        size="icon"
                                                                        onClick={
                                                                            handleCancelEdit
                                                                        }
                                                                        className="border-gray-300 hover:bg-gray-100 rounded-md"
                                                                        title="Batal Edit"
                                                                    >
                                                                        <XCircle className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            ) : (
                                                                <Button
                                                                    className="bg-[#0f766e] hover:bg-[#0d5d57] text-white rounded-md"
                                                                    size="sm"
                                                                    onClick={() =>
                                                                        handleEditClick(
                                                                            product
                                                                        )
                                                                    }
                                                                    title="Edit Parameter"
                                                                >
                                                                    <SquarePen className="h-4 w-4 mr-1" />{" "}
                                                                    Edit
                                                                </Button>
                                                            )
                                                        ) : (
                                                            <span className="text-gray-400 text-xs">
                                                                Tidak ada akses
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={9}
                                                    className="text-center py-10 text-lg text-gray-500"
                                                >
                                                    Tidak ada produk ditemukan.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>

                        <p className="text-sm text-end">
                            Menampilkan {products.from} - {products.to} dari{" "}
                            {products.total} data
                        </p>

                        {/* Pagination Section */}
                        {products.links && products.links.length > 3 && (
                            <div className="flex justify-center mt-6">
                                <Pagination>
                                    <PaginationContent>
                                        {products.links.map((link, index) => {
                                            const label = getLabelString(
                                                link.label
                                            );
                                            const isPreviousLabel =
                                                label.includes("Previous") ||
                                                label.includes(
                                                    "pagination.previous"
                                                );
                                            const isNextLabel =
                                                label.includes("Next") ||
                                                label.includes(
                                                    "pagination.next"
                                                );
                                            const isEllipsis =
                                                label.includes("...");

                                            if (isPreviousLabel) {
                                                return (
                                                    <PaginationItem key={index}>
                                                        <PaginationPrevious
                                                            href={
                                                                link.url || "#"
                                                            }
                                                            className={
                                                                !link.url
                                                                    ? "opacity-50 cursor-not-allowed text-gray-400"
                                                                    : "text-[#0f766e] hover:bg-teal-50"
                                                            }
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                if (link.url) {
                                                                    router.get(
                                                                        link.url,
                                                                        {},
                                                                        {
                                                                            preserveState: true,
                                                                            replace: true,
                                                                        }
                                                                    );
                                                                }
                                                            }}
                                                        />
                                                    </PaginationItem>
                                                );
                                            }

                                            if (isNextLabel) {
                                                return (
                                                    <PaginationItem key={index}>
                                                        <PaginationNext
                                                            href={
                                                                link.url || "#"
                                                            }
                                                            className={
                                                                !link.url
                                                                    ? "opacity-50 cursor-not-allowed text-gray-400"
                                                                    : "text-[#0f766e] hover:bg-teal-50"
                                                            }
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                if (link.url) {
                                                                    router.get(
                                                                        link.url,
                                                                        {},
                                                                        {
                                                                            preserveState: true,
                                                                            replace: true,
                                                                        }
                                                                    );
                                                                }
                                                            }}
                                                        />
                                                    </PaginationItem>
                                                );
                                            }

                                            if (!isEllipsis) {
                                                return (
                                                    <PaginationItem key={index}>
                                                        <PaginationLink
                                                            href={
                                                                link.url || "#"
                                                            }
                                                            isActive={
                                                                link.active
                                                            }
                                                            className={
                                                                !link.url
                                                                    ? "opacity-50 cursor-not-allowed text-gray-400"
                                                                    : link.active
                                                                    ? "bg-[#0f766e] text-white hover:bg-[#0d5d57]"
                                                                    : "text-[#0f766e] hover:bg-teal-50"
                                                            }
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                if (link.url) {
                                                                    router.get(
                                                                        link.url,
                                                                        {},
                                                                        {
                                                                            preserveState: true,
                                                                            replace: true,
                                                                        }
                                                                    );
                                                                }
                                                            }}
                                                        >
                                                            {link.label}
                                                        </PaginationLink>
                                                    </PaginationItem>
                                                );
                                            }

                                            return (
                                                <PaginationItem key={index}>
                                                    <PaginationEllipsis className="text-gray-500" />
                                                </PaginationItem>
                                            );
                                        })}
                                    </PaginationContent>
                                </Pagination>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
}