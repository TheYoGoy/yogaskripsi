import { useEffect, useState, useCallback } from "react";
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
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/Components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import dayjs from "dayjs";
import { Input } from "@/Components/ui/input";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/Components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select";
import { Separator } from "@/Components/ui/separator";
import Layout from "@/Layouts/Layout";
import DatePicker from "@/Components/DatePicker";
import {
    Trash2,
    PlusCircle,
    RotateCcw,
    ArrowUpNarrowWide,
    ArrowDownWideNarrow,
    ArrowUpDown,
    Search as SearchIcon,
    ArrowUpCircle,
    RefreshCw,
} from "lucide-react";

import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationPrevious,
    PaginationNext,
    PaginationEllipsis,
} from "@/Components/ui/pagination";
import { usePage } from "@inertiajs/react";
import { Checkbox } from "@/components/ui/checkbox";

export default function StockOutIndex({
    auth,
    stockOuts,
    flash,
    filters,
    products,
    debug,
}) {
    const { settings } = usePage().props;
    const [selectedIds, setSelectedIds] = useState([]);
    const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { delete: inertiaDelete } = useForm();

    // State untuk filter
    const [selectedDate, setSelectedDate] = useState(
        filters.transaction_date ? new Date(filters.transaction_date) : null
    );
    const [searchQuery, setSearchQuery] = useState(filters.search || "");
    const [customerQuery, setCustomerQuery] = useState(filters.customer || "");
    const [selectedProduct, setSelectedProduct] = useState(
        filters.product_id || "all"
    );
    const [perPage, setPerPage] = useState(filters.per_page || "10");
    const [sortBy, setSortBy] = useState(filters.sort_by || "id");
    const [sortDirection, setSortDirection] = useState(
        filters.sort_direction || "desc"
    );

    const [stockOutToDelete, setStockOutToDelete] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    // Debug logging
    useEffect(() => {
        console.log('=== STOCK OUT INDEX DEBUG ===');
        console.log('stockOuts prop:', stockOuts);
        console.log('filters prop:', filters);
        console.log('debug info:', debug);
        console.log('stockOuts.data length:', stockOuts?.data?.length || 0);
        console.log('stockOuts.total:', stockOuts?.total || 0);
        
        if (stockOuts?.data?.length > 0) {
            console.log('First stock out:', stockOuts.data[0]);
        } else if (stockOuts?.total > 0) {
            console.log('WARNING: Total > 0 but no data in current page!');
        }
        console.log('==========================');
    }, [stockOuts, filters, debug]);

    // Auto-search dengan debounce
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchQuery !== filters.search || customerQuery !== filters.customer) {
                applyFilter();
            }
        }, 500); // 500ms debounce

        return () => clearTimeout(timeoutId);
    }, [searchQuery, customerQuery]);

    // Toast notifications
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

    const handleConfirmDelete = useCallback((stockout) => {
        setStockOutToDelete(stockout);
        setIsDeleteModalOpen(true);
    }, []);

    const handleDelete = useCallback(() => {
        if (!stockOutToDelete) return;

        inertiaDelete(route("stock-outs.destroy", stockOutToDelete.id), {
            onSuccess: () => {
                toast({
                    title: "Berhasil dihapus!",
                    description: "Stock Out telah berhasil dihapus.",
                    variant: "success",
                });
                setIsDeleteModalOpen(false);
                setStockOutToDelete(null);
            },
            onError: (errors) => {
                console.error('Delete errors:', errors);
                toast({
                    title: "Gagal menghapus!",
                    description:
                        errors.message ||
                        "Terjadi kesalahan saat menghapus Stock Out.",
                    variant: "destructive",
                });
                setIsDeleteModalOpen(false);
                setStockOutToDelete(null);
            },
        });
    }, [stockOutToDelete, inertiaDelete]);

    const applyFilter = useCallback(() => {
        const filterData = {
            transaction_date: selectedDate
                ? dayjs(selectedDate).format("YYYY-MM-DD")
                : undefined,
            search: searchQuery.trim() || undefined,
            customer: customerQuery.trim() || undefined,
            product_id: selectedProduct === "all" ? undefined : selectedProduct,
            per_page: perPage,
            sort_by: sortBy,
            sort_direction: sortDirection,
        };

        // Filter out undefined values
        Object.keys(filterData).forEach(key => {
            if (filterData[key] === undefined) {
                delete filterData[key];
            }
        });

        console.log('Applying filter with data:', filterData);
        setIsLoading(true);

        router.get(
            route("stock-outs.index"),
            filterData,
            {
                preserveState: true,
                replace: true,
                onFinish: () => setIsLoading(false),
                onError: (errors) => {
                    console.error('Filter error:', errors);
                    setIsLoading(false);
                    toast({
                        title: "Error",
                        description: "Gagal memuat data",
                        variant: "destructive",
                    });
                }
            }
        );
    }, [
        selectedDate,
        searchQuery,
        customerQuery,
        selectedProduct,
        perPage,
        sortBy,
        sortDirection,
    ]);

    const resetFilter = useCallback(() => {
        console.log('Resetting all filters');
        setSelectedDate(null);
        setSearchQuery("");
        setCustomerQuery("");
        setSelectedProduct("all");
        setPerPage("10");
        setSortBy("id");
        setSortDirection("desc");
        setIsLoading(true);
        
        router.get(
            route("stock-outs.index"),
            {},
            { 
                preserveState: true, 
                replace: true,
                onFinish: () => setIsLoading(false),
                onError: (errors) => {
                    console.error('Reset error:', errors);
                    setIsLoading(false);
                }
            }
        );
    }, []);

    const handleSort = useCallback(
        (column) => {
            console.log('Sorting by:', column);
            if (sortBy === column) {
                setSortDirection(sortDirection === "asc" ? "desc" : "asc");
            } else {
                setSortBy(column);
                setSortDirection("asc");
            }
        },
        [sortBy, sortDirection]
    );

    // Apply filter ketika sortBy atau sortDirection berubah
    useEffect(() => {
        if (sortBy !== filters.sort_by || sortDirection !== filters.sort_direction) {
            applyFilter();
        }
    }, [sortBy, sortDirection]);

    const handleManualRefresh = () => {
        console.log('Manual refresh triggered');
        setIsLoading(true);
        router.reload({
            onFinish: () => setIsLoading(false),
            onError: (errors) => {
                console.error('Refresh error:', errors);
                setIsLoading(false);
            }
        });
    };

    const handleApplyFilter = () => {
        const filterData = {
            transaction_date: selectedDate
                ? dayjs(selectedDate).format("YYYY-MM-DD")
                : undefined,
            search: searchQuery.trim() || undefined,
            customer: customerQuery.trim() || undefined,
            product_id: selectedProduct === "all" ? undefined : selectedProduct,
            per_page: perPage,
            sort_by: sortBy,
            sort_direction: sortDirection,
            page: 1, // Reset to first page when applying filters
        };

        // Filter out undefined values
        Object.keys(filterData).forEach(key => {
            if (filterData[key] === undefined) {
                delete filterData[key];
            }
        });

        console.log('Manual filter apply with data:', filterData);
        setIsLoading(true);

        router.get(
            route("stock-outs.index"),
            filterData,
            {
                preserveState: true,
                replace: true,
                onFinish: () => setIsLoading(false),
                onError: (errors) => {
                    console.error('Filter apply error:', errors);
                    setIsLoading(false);
                }
            }
        );
    };

    const getSortIcon = (column) => {
        if (sortBy === column) {
            return sortDirection === "asc" ? (
                <ArrowUpNarrowWide className="h-4 w-4 ml-1" />
            ) : (
                <ArrowDownWideNarrow className="h-4 w-4 ml-1" />
            );
        }
        return <ArrowUpDown className="h-4 w-4 ml-1" />;
    };

    const handleBulkDelete = () => {
        if (selectedIds.length === 0) return;

        router.post(
            route("stock-outs.bulk-delete"),
            { ids: selectedIds },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setSelectedIds([]);
                    toast({
                        title: "Berhasil dihapus!",
                        description: `${selectedIds.length} Stock Out berhasil dihapus.`,
                        variant: "success",
                    });
                    setIsBulkDeleteOpen(false);
                },
                onError: (errors) => {
                    console.error('Bulk delete errors:', errors);
                    toast({
                        title: "Gagal menghapus!",
                        description:
                            "Terjadi kesalahan saat menghapus Stock Out terpilih.",
                        variant: "destructive",
                    });
                    setIsBulkDeleteOpen(false);
                },
            }
        );
    };

    // Helper function untuk safe display
    const safeDisplay = (value, fallback = "-") => {
        return value != null && value !== "" ? value : fallback;
    };

    // Cek apakah ada data
    const hasData = stockOuts?.data && stockOuts.data.length > 0;
    const hasFilters = searchQuery || customerQuery || selectedDate || selectedProduct !== 'all';

    // Checkbox handlers
    const handleSelectAll = (checked) => {
        if (checked && hasData) {
            setSelectedIds(stockOuts.data.map(item => item.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectItem = (itemId, checked) => {
        if (checked) {
            setSelectedIds(prev => [...prev, itemId]);
        } else {
            setSelectedIds(prev => prev.filter(id => id !== itemId));
        }
    };

    return (
        <Layout user={auth.user}>
            <Head title="Stock Out" />
            <div className="container max-w-6xl mx-auto px-4 py-8">
                <Card className="shadow-lg border-none animate-in fade-in-0 slide-in-from-top-2 after:duration-500 rounded-xl">
                    <CardHeader className="pb-4 border-b">
                        <Card className="relative w-full p-6 bg-red-600 overflow-hidden rounded-xl">
                            <ArrowUpCircle className="absolute right-4 bottom-[-100px] text-white opacity-10 w-80 h-80 z-0" />

                            <div className="flex gap-4 items-center z-10">
                                <ArrowUpCircle className="text-white w-14 h-14" />
                                <div>
                                    <CardTitle className="text-3xl md:text-4xl font-bold tracking-tight text-white">
                                        Stock Out
                                    </CardTitle>
                                    <CardDescription className="text-md text-white mt-1">
                                        Kelola riwayat stok keluar produk.
                                    </CardDescription>
                                    {debug && (
                                        <div className="text-xs text-white/80 mt-2">
                                            Debug: {debug.total_in_db} total | {debug.query_total} filtered | 
                                            Page: {stockOuts?.current_page} of {stockOuts?.last_page}
                                            {hasFilters && <span className="ml-2">(Filtered)</span>}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="absolute right-6 top-1/2 -translate-y-1/2 z-20 flex gap-2">
                                <Button
                                    onClick={handleManualRefresh}
                                    variant="outline"
                                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                                    disabled={isLoading}
                                >
                                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                                </Button>
                                
                                {(auth.user.roles.includes("admin") ||
                                    auth.user.roles.includes("staff")) && (
                                    <Link href={route("stock-outs.create")}>
                                        <Button className="flex items-center gap-2 bg-white text-red-600 hover:bg-gray-100 shadow-md transition-all duration-200 text-base py-2 px-6 rounded-lg">
                                            <PlusCircle className="h-5 w-5" />
                                            Catat Stock Out Baru
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        </Card>
                    </CardHeader>

                    <CardContent className="space-y-6 pt-6">
                        {/* Filter & Search Section */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 p-4 border rounded-lg shadow-sm bg-gray-50">
                            {/* Search Input */}
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium">
                                    Cari Stock Out
                                </label>
                                <div className="relative">
                                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        type="text"
                                        placeholder="Produk, Kode..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-9 pr-3 py-2 rounded-md"
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>

                            {/* Customer Search */}
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium">
                                    Cari Customer
                                </label>
                                <Input
                                    type="text"
                                    placeholder="Nama customer..."
                                    value={customerQuery}
                                    onChange={(e) => setCustomerQuery(e.target.value)}
                                    className="rounded-md"
                                    disabled={isLoading}
                                />
                            </div>

                            {/* Date Filter */}
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium">
                                    Tanggal Stock Out
                                </label>
                                <DatePicker
                                    value={selectedDate}
                                    onChange={setSelectedDate}
                                    className="border-gray-300 focus-visible:ring-red-600 focus-visible:border-red-600 w-full rounded-md"
                                    disabled={isLoading}
                                />
                            </div>

                            {/* Product Filter */}
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium">
                                    Produk
                                </label>
                                <Select
                                    value={selectedProduct}
                                    onValueChange={setSelectedProduct}
                                    disabled={isLoading}
                                >
                                    <SelectTrigger className="rounded-md">
                                        <SelectValue placeholder="Pilih Produk" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            Semua Produk
                                        </SelectItem>
                                        {products && products.length > 0 ? (
                                            products.map((product) => (
                                                <SelectItem
                                                    key={product.id}
                                                    value={String(product.id)}
                                                >
                                                    {product.name}
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <SelectItem value="no-product" disabled>
                                                Tidak ada produk
                                            </SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Per Page Selector */}
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium">
                                    Tampilkan
                                </label>
                                <Select
                                    value={perPage}
                                    onValueChange={setPerPage}
                                    disabled={isLoading}
                                >
                                    <SelectTrigger className="w-full rounded-md">
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

                            {/* Action Buttons for Filters */}
                            <div className="col-span-full flex justify-between items-center gap-3 mt-2 pt-4 border-t">
                                <div className="flex gap-2">
                                    {selectedIds.length > 0 && (
                                        <Button
                                            variant="destructive"
                                            onClick={() => setIsBulkDeleteOpen(true)}
                                            disabled={isLoading}
                                        >
                                            Hapus Terpilih ({selectedIds.length})
                                        </Button>
                                    )}
                                </div>
                                
                                <div className="flex gap-2">
                                    <Button
                                        onClick={resetFilter}
                                        variant="outline"
                                        className="gap-1 shadow-sm rounded-md"
                                        disabled={isLoading}
                                    >
                                        <RotateCcw className="h-4 w-4" /> 
                                        Reset
                                    </Button>
                                    <Button
                                        onClick={handleApplyFilter}
                                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md shadow-sm"
                                        disabled={isLoading}
                                    >
                                        {isLoading && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                                        Terapkan Filter
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <Separator className="my-6" />

                        {/* Debug info display */}
                        {debug && (
                            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
                                <strong>Debug Info:</strong> 
                                Total DB: {debug.total_in_db} | 
                                Filtered: {debug.query_total} | 
                                Results: {stockOuts?.data?.length || 0} |
                                Page: {stockOuts?.current_page} of {stockOuts?.last_page} |
                                Filters: {hasFilters ? 'Yes' : 'No'}
                            </div>
                        )}

                        {/* Loading State */}
                        {isLoading && (
                            <div className="flex justify-center items-center py-8">
                                <RefreshCw className="h-8 w-8 animate-spin text-red-600" />
                                <span className="ml-2 text-red-600">Memuat data...</span>
                            </div>
                        )}

                        {/* Table Section */}
                        {!isLoading && (
                            <div className="rounded-lg border overflow-hidden shadow-sm">
                                <Table className="min-w-full divide-y">
                                    <TableHeader className="bg-red-600">
                                        <TableRow>
                                            {/* CheckBox */}
                                            <TableHead>
                                                <Checkbox
                                                    checked={hasData && selectedIds.length === stockOuts.data.length}
                                                    onCheckedChange={handleSelectAll}
                                                />
                                            </TableHead>

                                            {/* Sortable Columns */}
                                            <TableHead
                                                className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer transition-colors duration-200 hover:bg-red-700"
                                                onClick={() => handleSort("code")}
                                            >
                                                <div className="flex items-center">
                                                    Kode {getSortIcon("code")}
                                                </div>
                                            </TableHead>

                                            <TableHead className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                                Produk
                                            </TableHead>

                                            <TableHead
                                                className="px-6 py-3 text-right text-xs font-semibold text-white uppercase tracking-wider cursor-pointer transition-colors duration-200 hover:bg-red-700"
                                                onClick={() => handleSort("quantity")}
                                            >
                                                <div className="flex items-center justify-end">
                                                    Qty {getSortIcon("quantity")}
                                                </div>
                                            </TableHead>

                                            <TableHead
                                                className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer transition-colors duration-200 hover:bg-red-700"
                                                onClick={() => handleSort("customer")}
                                            >
                                                <div className="flex items-center">
                                                    Customer {getSortIcon("customer")}
                                                </div>
                                            </TableHead>

                                            <TableHead
                                                className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer transition-colors duration-200 hover:bg-red-700"
                                                onClick={() => handleSort("transaction_date")}
                                            >
                                                <div className="flex items-center">
                                                    Tanggal {getSortIcon("transaction_date")}
                                                </div>
                                            </TableHead>

                                            <TableHead className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                                Dicatat Oleh
                                            </TableHead>

                                            <TableHead className="px-6 py-3 text-center text-xs font-semibold text-white uppercase tracking-wider">
                                                Aksi
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody className="divide-y">
                                        {hasData ? (
                                            stockOuts.data.map((stockOut) => (
                                                <TableRow
                                                    key={stockOut.id}
                                                    className="hover:bg-gray-50 transition-colors duration-150"
                                                >
                                                    <TableCell>
                                                        <Checkbox
                                                            checked={selectedIds.includes(stockOut.id)}
                                                            onCheckedChange={(checked) => 
                                                                handleSelectItem(stockOut.id, checked)
                                                            }
                                                        />
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        {safeDisplay(stockOut.code)}
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm">
                                                        <div>
                                                            <div className="font-medium">{safeDisplay(stockOut.product?.name)}</div>
                                                            {stockOut.product?.sku && (
                                                                <div className="text-xs text-gray-500">
                                                                    SKU: {stockOut.product.sku}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-red-600">
                                                        -{stockOut.quantity ? 
                                                            stockOut.quantity.toLocaleString("id-ID") : 0
                                                        }
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm">
                                                        {safeDisplay(stockOut.customer)}
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm">
                                                        {stockOut.transaction_date ? 
                                                            dayjs(stockOut.transaction_date).format("DD MMM YYYY") :
                                                            stockOut.date ? 
                                                            dayjs(stockOut.date).format("DD MMM YYYY") : "-"
                                                        }
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm">
                                                        {safeDisplay(stockOut.user?.name)}
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                                                        {auth.user.roles.includes("admin") && (
                                                            <Button
                                                                size="icon"
                                                                variant="destructive"
                                                                onClick={() => handleConfirmDelete(stockOut)}
                                                                className="rounded-md"
                                                                title="Hapus Stock Out"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={8}
                                                    className="text-center py-16"
                                                >
                                                    <div className="flex flex-col items-center gap-4">
                                                        <ArrowUpCircle className="h-16 w-16 text-gray-300" />
                                                        <div>
                                                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                                                {stockOuts?.total > 0 ? 
                                                                    "Tidak ada data dengan filter ini" : 
                                                                    "Belum ada Stock Out"
                                                                }
                                                            </h3>
                                                            <p className="text-gray-500 mb-4">
                                                                {stockOuts?.total > 0 ? 
                                                                    "Coba ubah filter atau reset untuk melihat semua data" :
                                                                    "Mulai dengan menambahkan stock out baru"
                                                                }
                                                            </p>
                                                            {stockOuts?.total > 0 ? (
                                                                <Button 
                                                                    onClick={resetFilter}
                                                                    variant="outline"
                                                                >
                                                                    <RotateCcw className="h-4 w-4 mr-2" />
                                                                    Reset Filter
                                                                </Button>
                                                            ) : (
                                                                (auth.user.roles.includes("admin") || 
                                                                 auth.user.roles.includes("staff")) && (
                                                                    <Link href={route("stock-outs.create")}>
                                                                        <Button className="bg-red-600 hover:bg-red-700">
                                                                            <PlusCircle className="h-4 w-4 mr-2" />
                                                                            Tambah Stock Out
                                                                        </Button>
                                                                    </Link>
                                                                )
                                                            )}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        )}

                        {/* Results Info */}
                        {!isLoading && stockOuts?.total > 0 && (
                            <div className="flex justify-between items-center text-sm text-gray-600">
                                <p>
                                    Menampilkan {stockOuts.from} - {stockOuts.to} dari{" "}
                                    {stockOuts.total} data
                                    {hasFilters && " (terfilter)"}
                                </p>
                                <p>
                                    Halaman {stockOuts.current_page} dari {stockOuts.last_page}
                                </p>
                            </div>
                        )}

                        {/* Pagination Section */}
                        {!isLoading && stockOuts?.links && stockOuts.links.length > 3 && (
                            <div className="flex justify-center mt-6">
                                <Pagination>
                                    <PaginationContent>
                                        {stockOuts.links.map((link, index) => {
                                            const isPreviousLabel =
                                                link.label.includes("Previous") ||
                                                link.label.includes("pagination.previous");
                                            const isNextLabel =
                                                link.label.includes("Next") ||
                                                link.label.includes("pagination.next");
                                            const isEllipsis = link.label.includes("...");

                                            if (isPreviousLabel) {
                                                return (
                                                    <PaginationItem key={index}>
                                                        <PaginationPrevious
                                                            href={link.url || "#"}
                                                            className={
                                                                !link.url
                                                                    ? "opacity-50 cursor-not-allowed"
                                                                    : "text-red-600 hover:bg-red-50"
                                                            }
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                if (link.url && !isLoading) {
                                                                    setIsLoading(true);
                                                                    router.get(link.url, {}, {
                                                                        preserveState: true,
                                                                        replace: true,
                                                                        onFinish: () => setIsLoading(false),
                                                                    });
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
                                                            href={link.url || "#"}
                                                            className={
                                                                !link.url
                                                                    ? "opacity-50 cursor-not-allowed"
                                                                    : "text-red-600 hover:bg-red-50"
                                                            }
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                if (link.url && !isLoading) {
                                                                    setIsLoading(true);
                                                                    router.get(link.url, {}, {
                                                                        preserveState: true,
                                                                        replace: true,
                                                                        onFinish: () => setIsLoading(false),
                                                                    });
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
                                                            href={link.url || "#"}
                                                            isActive={link.active}
                                                            className={
                                                                !link.url
                                                                    ? "opacity-50 cursor-not-allowed"
                                                                    : link.active
                                                                    ? "bg-red-600 text-white hover:bg-red-700"
                                                                    : "text-red-600 hover:bg-red-50"
                                                            }
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                if (link.url && !isLoading) {
                                                                    setIsLoading(true);
                                                                    router.get(link.url, {}, {
                                                                        preserveState: true,
                                                                        replace: true,
                                                                        onFinish: () => setIsLoading(false),
                                                                    });
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

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Konfirmasi Hapus</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus Stock Out dengan kode{" "}
                            <b>{stockOutToDelete?.code}</b>?{" "}
                            <br />
                            Tindakan ini tidak dapat dibatalkan dan akan
                            menambah kembali stok produk.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex justify-end gap-2 mt-4">
                        <DialogClose asChild>
                            <Button
                                type="button"
                                variant="outline"
                                className="border-gray-300 hover:bg-gray-100 rounded-md"
                            >
                                Batal
                            </Button>
                        </DialogClose>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={handleDelete}
                            className="bg-red-500 hover:bg-red-600 rounded-md"
                        >
                            Hapus
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Bulk Delete Dialog */}
            <Dialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Konfirmasi Hapus</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus{" "}
                            <b>{selectedIds.length}</b> Stock Out terpilih?{" "}
                            <br />
                            Tindakan ini tidak dapat dibatalkan dan akan
                            menambah kembali stok produk.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex justify-end gap-2 mt-4">
                        <DialogClose asChild>
                            <Button
                                type="button"
                                variant="outline"
                                className="border-gray-300 hover:bg-gray-100 rounded-md"
                            >
                                Batal
                            </Button>
                        </DialogClose>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={handleBulkDelete}
                            className="bg-red-500 hover:bg-red-600 rounded-md"
                        >
                            Hapus
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Layout>
    );}