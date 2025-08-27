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
    SearchIcon,
    ArrowDownCircle,
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
import { Checkbox } from "@/components/ui/checkbox";

export default function StockInIndex({
    auth,
    stockIns,
    flash,
    filters,
    suppliers,
    products,
}) {
    const [selectedIds, setSelectedIds] = useState([]);
    const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { delete: inertiaDelete } = useForm();

    // Filter states
    const [selectedDate, setSelectedDate] = useState(
        filters.transaction_date ? new Date(filters.transaction_date) : null
    );
    const [searchQuery, setSearchQuery] = useState(filters.search || "");
    const [selectedSupplier, setSelectedSupplier] = useState(
        filters.supplier_name || "all"
    );
    const [selectedProduct, setSelectedProduct] = useState(
        filters.product_id || "all"
    );
    const [perPage, setPerPage] = useState(filters.per_page || "10");
    const [sortBy, setSortBy] = useState(filters.sort_by || "id");
    const [sortDirection, setSortDirection] = useState(
        filters.sort_direction || "desc"
    );

    const [stockInToDelete, setStockInToDelete] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    // Auto-search dengan debounce
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchQuery !== filters.search) {
                applyFilter();
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    // Toast notifications
    useEffect(() => {
        if (flash?.success) {
            toast({
                title: "Sukses!",
                description: flash.success,
                variant: "success",
            });
        }
        if (flash?.error) {
            toast({
                title: "Error!",
                description: flash.error,
                variant: "destructive",
            });
        }
    }, [flash]);

    const handleConfirmDelete = useCallback((stockin) => {
        setStockInToDelete(stockin);
        setIsDeleteModalOpen(true);
    }, []);

    const handleDelete = useCallback(() => {
        if (!stockInToDelete) return;

        inertiaDelete(route("stock-ins.destroy", stockInToDelete.id), {
            onSuccess: () => {
                toast({
                    title: "Berhasil dihapus!",
                    description: "Stock In telah berhasil dihapus.",
                    variant: "success",
                });
                setIsDeleteModalOpen(false);
                setStockInToDelete(null);
            },
            onError: () => {
                toast({
                    title: "Gagal menghapus!",
                    description: "Terjadi kesalahan saat menghapus Stock In.",
                    variant: "destructive",
                });
                setIsDeleteModalOpen(false);
                setStockInToDelete(null);
            },
        });
    }, [stockInToDelete, inertiaDelete]);

    const applyFilter = useCallback(() => {
        const filterData = {
            transaction_date: selectedDate
                ? dayjs(selectedDate).format("YYYY-MM-DD")
                : undefined,
            search: searchQuery.trim() || undefined,
            supplier_name: selectedSupplier === "all" ? undefined : selectedSupplier,
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

        setIsLoading(true);
        router.get(route("stock-ins.index"), filterData, {
            preserveState: true,
            replace: true,
            onFinish: () => setIsLoading(false),
        });
    }, [selectedDate, searchQuery, selectedSupplier, selectedProduct, perPage, sortBy, sortDirection]);

    const resetFilter = useCallback(() => {
        setSelectedDate(null);
        setSearchQuery("");
        setSelectedSupplier("all");
        setSelectedProduct("all");
        setPerPage("10");
        setSortBy("id");
        setSortDirection("desc");
        setIsLoading(true);
        
        router.get(route("stock-ins.index"), {}, { 
            preserveState: true, 
            replace: true,
            onFinish: () => setIsLoading(false),
        });
    }, []);

    const handleSort = useCallback((column) => {
        if (sortBy === column) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortBy(column);
            setSortDirection("asc");
        }
    }, [sortBy, sortDirection]);

    // Apply filter ketika sort berubah
    useEffect(() => {
        if (sortBy !== filters.sort_by || sortDirection !== filters.sort_direction) {
            applyFilter();
        }
    }, [sortBy, sortDirection]);

    const handleManualRefresh = () => {
        setIsLoading(true);
        router.reload({
            onFinish: () => setIsLoading(false),
        });
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
        router.post(
            route("stock-ins.bulk-delete"),
            { ids: selectedIds },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setSelectedIds([]);
                    toast({
                        title: "Berhasil dihapus!",
                        description: `${selectedIds.length} Stock In berhasil dihapus.`,
                        variant: "success",
                    });
                    setIsBulkDeleteOpen(false);
                },
                onError: () => {
                    toast({
                        title: "Gagal menghapus!",
                        description: "Terjadi kesalahan saat menghapus Stock In terpilih.",
                        variant: "destructive",
                    });
                    setIsBulkDeleteOpen(false);
                },
            }
        );
    };

    const safeDisplay = (value, fallback = "-") => {
        return value != null && value !== "" ? value : fallback;
    };

    const hasData = stockIns?.data && stockIns.data.length > 0;
    const hasFilters = searchQuery || selectedDate || selectedSupplier !== 'all' || selectedProduct !== 'all';

    return (
        <Layout user={auth.user}>
            <Head title="Stock In" />
            <div className="container max-w-6xl mx-auto px-4 py-8">
                <Card className="shadow-lg border-none rounded-xl">
                    <CardHeader className="pb-4 border-b">
                        <Card className="relative w-full p-6 bg-green-800 overflow-hidden rounded-xl">
                            <ArrowDownCircle className="absolute right-4 bottom-[-100px] text-white opacity-10 w-80 h-80 z-0" />

                            <div className="flex gap-4 items-center z-10">
                                <ArrowDownCircle className="text-white w-14 h-14" />
                                <div>
                                    <CardTitle className="text-3xl md:text-4xl font-bold tracking-tight text-white">
                                        Stock In
                                    </CardTitle>
                                    <CardDescription className="text-md text-white mt-1">
                                        Kelola riwayat stok masuk produk.
                                    </CardDescription>
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
                                
                                {(auth.user.roles.includes("admin") || auth.user.roles.includes("staff")) && (
                                    <Link href={route("stock-ins.create")}>
                                        <Button className="flex items-center gap-2 bg-white text-green-800 hover:bg-gray-100 shadow-md">
                                            <PlusCircle className="h-5 w-5" />
                                            Catat Stock In Baru
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        </Card>
                    </CardHeader>

                    <CardContent className="space-y-6 pt-6">
                        {/* Filter Section */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 p-4 border rounded-lg shadow-sm bg-gray-50">
                            {/* Search */}
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium">Cari Stock In</label>
                                <div className="relative">
                                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        type="text"
                                        placeholder="Produk, Supplier, Kode..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-9"
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>

                            {/* Date Filter */}
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium">Tanggal Stock In</label>
                                <DatePicker
                                    value={selectedDate}
                                    onChange={setSelectedDate}
                                    className="w-full"
                                    disabled={isLoading}
                                />
                            </div>

                            {/* Supplier Filter */}
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium">Supplier</label>
                                <Select
                                    value={selectedSupplier}
                                    onValueChange={setSelectedSupplier}
                                    disabled={isLoading}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih Supplier" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua Supplier</SelectItem>
                                        {suppliers?.map((supplier) => (
                                            <SelectItem key={supplier.id} value={supplier.name}>
                                                {supplier.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Product Filter */}
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium">Produk</label>
                                <Select
                                    value={selectedProduct}
                                    onValueChange={setSelectedProduct}
                                    disabled={isLoading}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih Produk" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua Produk</SelectItem>
                                        {products?.map((product) => (
                                            <SelectItem key={product.id} value={String(product.id)}>
                                                {product.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Per Page */}
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium">Tampilkan</label>
                                <Select value={perPage} onValueChange={setPerPage} disabled={isLoading}>
                                    <SelectTrigger>
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
                                        disabled={isLoading}
                                    >
                                        <RotateCcw className="h-4 w-4 mr-2" /> 
                                        Reset
                                    </Button>
                                    <Button
                                        onClick={applyFilter}
                                        className="bg-green-800 hover:bg-green-900"
                                        disabled={isLoading}
                                    >
                                        {isLoading && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                                        Terapkan Filter
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <Separator className="my-6" />

                        {/* Loading State */}
                        {isLoading && (
                            <div className="flex justify-center items-center py-8">
                                <RefreshCw className="h-8 w-8 animate-spin text-green-800" />
                                <span className="ml-2 text-green-800">Memuat data...</span>
                            </div>
                        )}

                        {/* Table */}
                        {!isLoading && (
                            <div className="rounded-lg border overflow-hidden shadow-sm">
                                <Table>
                                    <TableHeader className="bg-green-800">
                                        <TableRow>
                                            <TableHead className="w-12">
                                                <Checkbox
                                                    checked={hasData && selectedIds.length === stockIns.data.length}
                                                    onCheckedChange={(checked) => {
                                                        if (checked && hasData) {
                                                            setSelectedIds(stockIns.data.map(item => item.id));
                                                        } else {
                                                            setSelectedIds([]);
                                                        }
                                                    }}
                                                />
                                            </TableHead>

                                            <TableHead
                                                className="text-white cursor-pointer hover:bg-green-700"
                                                onClick={() => handleSort("code")}
                                            >
                                                <div className="flex items-center">
                                                    Kode {getSortIcon("code")}
                                                </div>
                                            </TableHead>

                                            <TableHead className="text-white">Produk</TableHead>

                                            <TableHead
                                                className="text-white cursor-pointer hover:bg-green-700 text-right"
                                                onClick={() => handleSort("quantity")}
                                            >
                                                <div className="flex items-center justify-end">
                                                    Qty {getSortIcon("quantity")}
                                                </div>
                                            </TableHead>

                                            <TableHead className="text-white">Supplier</TableHead>

                                            <TableHead
                                                className="text-white cursor-pointer hover:bg-green-700"
                                                onClick={() => handleSort("date")}
                                            >
                                                <div className="flex items-center">
                                                    Tanggal {getSortIcon("date")}
                                                </div>
                                            </TableHead>

                                            <TableHead className="text-white">Sumber</TableHead>
                                            <TableHead className="text-white">Dicatat Oleh</TableHead>
                                            <TableHead className="text-white text-center">Aksi</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {hasData ? (
                                            stockIns.data.map((stockIn) => (
                                                <TableRow
                                                    key={stockIn.id}
                                                    className="hover:bg-gray-50"
                                                >
                                                    <TableCell>
                                                        <Checkbox
                                                            checked={selectedIds.includes(stockIn.id)}
                                                            onCheckedChange={(checked) => {
                                                                if (checked) {
                                                                    setSelectedIds([...selectedIds, stockIn.id]);
                                                                } else {
                                                                    setSelectedIds(selectedIds.filter(id => id !== stockIn.id));
                                                                }
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell className="font-medium">
                                                        {safeDisplay(stockIn.code)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div>
                                                            <div className="font-medium">{safeDisplay(stockIn.product?.name)}</div>
                                                            {stockIn.product?.sku && (
                                                                <div className="text-xs text-gray-500">
                                                                    SKU: {stockIn.product.sku}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right font-medium">
                                                        {stockIn.quantity ? stockIn.quantity.toLocaleString("id-ID") : 0}
                                                    </TableCell>
                                                    <TableCell>
                                                        {safeDisplay(stockIn.supplier || stockIn.product?.supplier?.name)}
                                                    </TableCell>
                                                    <TableCell>
                                                        {stockIn.transaction_date || stockIn.date ? 
                                                            dayjs(stockIn.transaction_date || stockIn.date).format("DD MMM YYYY") : 
                                                            "-"
                                                        }
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className={`px-2 py-1 rounded-full text-xs ${
                                                            stockIn.source ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-500'
                                                        }`}>
                                                            {safeDisplay(stockIn.source, 'Manual')}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        {safeDisplay(stockIn.user?.name)}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {auth.user.roles.includes("admin") && (
                                                            <Button
                                                                size="icon"
                                                                variant="destructive"
                                                                onClick={() => handleConfirmDelete(stockIn)}
                                                                title="Hapus Stock In"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={9} className="text-center py-16">
                                                    <div className="flex flex-col items-center gap-4">
                                                        <ArrowDownCircle className="h-16 w-16 text-gray-300" />
                                                        <div>
                                                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                                                {hasFilters ? "Tidak ada data dengan filter ini" : "Belum ada Stock In"}
                                                            </h3>
                                                            <p className="text-gray-500 mb-4">
                                                                {hasFilters ? "Coba ubah filter atau reset untuk melihat semua data" : "Mulai dengan menambahkan stock in baru"}
                                                            </p>
                                                            {hasFilters ? (
                                                                <Button onClick={resetFilter} variant="outline">
                                                                    <RotateCcw className="h-4 w-4 mr-2" />
                                                                    Reset Filter
                                                                </Button>
                                                            ) : (
                                                                auth.user.roles.includes("admin") || auth.user.roles.includes("staff")
                                                            ) && (
                                                                <Link href={route("stock-ins.create")}>
                                                                    <Button className="bg-green-800 hover:bg-green-900">
                                                                        <PlusCircle className="h-4 w-4 mr-2" />
                                                                        Tambah Stock In
                                                                    </Button>
                                                                </Link>
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

                        {/* Pagination */}
                        {!isLoading && stockIns?.links && stockIns.links.length > 3 && (
                            <div className="flex justify-center mt-6">
                                <Pagination>
                                    <PaginationContent>
                                        {stockIns.links.map((link, index) => {
                                            const isPreviousLabel = link.label.includes("Previous");
                                            const isNextLabel = link.label.includes("Next");
                                            const isEllipsis = link.label.includes("...");

                                            if (isPreviousLabel) {
                                                return (
                                                    <PaginationItem key={index}>
                                                        <PaginationPrevious
                                                            href={link.url || "#"}
                                                            className={!link.url ? "opacity-50 cursor-not-allowed" : ""}
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
                                                            className={!link.url ? "opacity-50 cursor-not-allowed" : ""}
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
                                                    <PaginationEllipsis />
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
                            Apakah Anda yakin ingin menghapus Stock In ini? 
                            Tindakan ini tidak dapat dibatalkan dan akan mengurangi stok produk.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Batal</Button>
                        </DialogClose>
                        <Button variant="destructive" onClick={handleDelete}>
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
                            Apakah Anda yakin ingin menghapus {selectedIds.length} Stock In terpilih?
                            Tindakan ini tidak dapat dibatalkan dan akan mengurangi stok produk.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Batal</Button>
                        </DialogClose>
                        <Button variant="destructive" onClick={handleBulkDelete}>
                            Hapus
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Layout>
    );
}