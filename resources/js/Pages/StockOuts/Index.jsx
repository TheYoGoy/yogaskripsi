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
    ArrowUpCircle,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
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

export default function StockOutIndex({
    auth,
    stockOuts,
    flash,
    filters,
    suppliers,
    products,
}) {
    const { settings } = usePage().props;
    const [selectedIds, setSelectedIds] = useState([]);
    const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
    const { delete: inertiaDelete } = useForm();

    const [selectedDate, setSelectedDate] = useState(
        filters.stockout_date ? new Date(filters.stockout_date) : null
    );
    const [searchQuery, setSearchQuery] = useState(filters.search || "");
    const [selectedSupplier, setSelectedSupplier] = useState(
        filters.supplier_id || "all"
    );
    const [selectedProduct, setSelectedProduct] = useState(
        filters.product_id || "all"
    );
    const [perPage, setPerPage] = useState(filters.per_page || "10");

    const [sortBy, setSortBy] = useState(filters.sort_by || "stockout_date");
    const [sortDirection, setSortDirection] = useState(
        filters.sort_direction || "desc"
    );
    const [isDeleting, setIsDeleting] = useState(false);

    const [stockOutToDelete, setStockOutToDelete] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    useEffect(() => {
        applyFilter();
    }, [searchQuery]);

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
        if (!stockOutToDelete || isDeleting) return;

        setIsDeleting(true);

        inertiaDelete(route("stock-outs.destroy", stockOutToDelete.id), {
            onSuccess: () => {
                toast({
                    title: "Berhasil dihapus!",
                    description: "Stock Out telah berhasil dihapus.",
                    variant: "success",
                });
                setIsDeleteModalOpen(false);
                setStockOutToDelete(null);
                setIsDeleting(false);
            },
            onError: (errors) => {
                toast({
                    title: "Gagal menghapus!",
                    description:
                        errors.message ||
                        "Terjadi kesalahan saat menghapus Stock Out.",
                    variant: "destructive",
                });
                setIsDeleteModalOpen(false);
                setStockOutToDelete(null);
                setIsDeleting(false);
            },
        });
    }, [stockOutToDelete, inertiaDelete, isDeleting]);

    const applyFilter = useCallback(() => {
        router.get(
            route("stock-outs.index"),
            {
                stockout_date: selectedDate
                    ? dayjs(selectedDate).format("YYYY-MM-DD")
                    : undefined,
                search: searchQuery || undefined,
                supplier_id:
                    selectedSupplier === "all" ? undefined : selectedSupplier,
                product_id:
                    selectedProduct === "all" ? undefined : selectedProduct,
                per_page: perPage,
                sort_by: sortBy,
                sort_direction: sortDirection,
            },
            {
                preserveState: true,
                replace: true,
            }
        );
    }, [
        selectedDate,
        searchQuery,
        selectedSupplier,
        selectedProduct,
        perPage,
        sortBy,
        sortDirection,
    ]);

    const resetFilter = useCallback(() => {
        setSelectedDate(null);
        setSearchQuery("");
        setSelectedSupplier("all");
        setSelectedProduct("all");
        setPerPage("10");
        setSortBy("stockout_date");
        setSortDirection("desc");
        router.get(
            route("stock-outs.index"),
            {},
            { preserveState: true, replace: true }
        );
    }, []);

    const handleSort = useCallback(
        (column) => {
            if (sortBy === column) {
                setSortDirection(sortDirection === "asc" ? "desc" : "asc");
            } else {
                setSortBy(column);
                setSortDirection("asc");
            }
        },
        [sortBy, sortDirection]
    );

    const handleApplyFilter = () => {
        router.get(
            route("stock-outs.index"),
            {
                stockout_date: selectedDate
                    ? dayjs(selectedDate).format("YYYY-MM-DD")
                    : undefined,
                search: searchQuery || undefined,
                supplier_id:
                    selectedSupplier === "all" ? undefined : selectedSupplier,
                product_id:
                    selectedProduct === "all" ? undefined : selectedProduct,
                per_page: perPage,
                sort_by: sortBy,
                sort_direction: sortDirection,
                page: 1,
            },
            {
                preserveState: true,
                replace: true,
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
                onError: () => {
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

    return (
        <Layout user={auth.user}>
            <Head title="Stock Out" />
            <div className="container max-w-6xl mx-auto px-4 py-8">
                <Card className="shadow-lg border-none animate-in fade-in-0 slide-in-from-top-2 after:duration-500 rounded-xl">
                    <CardHeader className="pb-4 border-b">
                        <Card className="relative w-full p-6 bg-red-700 overflow-hidden rounded-xl">
                            <ArrowUpCircle className="absolute right-4 bottom-[-100px] text-white opacity-10 w-80 h-80 z-0" />

                            <div className="flex gap-4 items-center z-10">
                                <ArrowUpCircle className="text-white w-14 h-14" />
                                <div>
                                    <CardTitle className="text-3xl md:text-4xl font-bold tracking-tight text-white">
                                        Stock Out
                                    </CardTitle>
                                    <CardDescription className="text-md text-white mt-1">
                                        Kelola riwayat pengeluaran produk dari
                                        stok.
                                    </CardDescription>
                                </div>
                            </div>

                            {(auth.user.roles.includes("admin") ||
                                auth.user.roles.includes("staff")) && (
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 z-20">
                                    <Link href={route("stock-outs.create")}>
                                        <Button className="flex items-center gap-2 bg-white text-red-700 hover:bg-gray-100 shadow-md transition-all duration-200 text-base py-2 px-6 rounded-lg">
                                            <PlusCircle className="h-5 w-5" />{" "}
                                            Catat Stock Out Baru
                                        </Button>
                                    </Link>
                                </div>
                            )}
                        </Card>
                    </CardHeader>

                    <CardContent className="space-y-6 pt-6">
                        {/* Filter & Search Section */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 p-4 border rounded-lg shadow-sm">
                            {/* Search Input */}
                            <div className="flex flex-col gap-2">
                                <label
                                    htmlFor="search-input"
                                    className="text-sm font-medium"
                                >
                                    Cari Stock Out
                                </label>
                                <div className="relative">
                                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" />
                                    <Input
                                        id="search-input"
                                        type="text"
                                        placeholder="Produk, Customer, atau Kode..."
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
                                <label
                                    htmlFor="date-filter"
                                    className="text-sm font-medium"
                                >
                                    Tanggal Stock Out
                                </label>
                                <DatePicker
                                    id="date-filter"
                                    value={selectedDate}
                                    onChange={setSelectedDate}
                                    className="border-gray-300 focus-visible:ring-red-700 focus-visible:border-red-700 w-full rounded-md"
                                />
                            </div>

                            {/* Supplier Filter */}
                            <div className="flex flex-col gap-2">
                                <label
                                    htmlFor="supplier-filter"
                                    className="text-sm font-medium"
                                >
                                    Supplier
                                </label>
                                <Select
                                    value={selectedSupplier}
                                    onValueChange={setSelectedSupplier}
                                >
                                    <SelectTrigger
                                        id="supplier-filter"
                                        className="rounded-md"
                                    >
                                        <SelectValue placeholder="Pilih Supplier" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            Semua Supplier
                                        </SelectItem>
                                        {suppliers?.map((supplier) => (
                                            <SelectItem
                                                key={supplier.id}
                                                value={String(supplier.id)}
                                            >
                                                {supplier.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Product Filter */}
                            <div className="flex flex-col gap-2">
                                <label
                                    htmlFor="product-filter"
                                    className="text-sm font-medium"
                                >
                                    Produk
                                </label>
                                <Select
                                    value={selectedProduct}
                                    onValueChange={setSelectedProduct}
                                >
                                    <SelectTrigger
                                        id="product-filter"
                                        className="rounded-md"
                                    >
                                        <SelectValue placeholder="Pilih Produk" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            Semua Produk
                                        </SelectItem>
                                        {products?.map((product) => (
                                            <SelectItem
                                                key={product.id}
                                                value={String(product.id)}
                                            >
                                                {product.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Per Page Selector */}
                            <div className="flex flex-col gap-2">
                                <label
                                    htmlFor="per-page-select"
                                    className="text-sm font-medium"
                                >
                                    Tampilkan
                                </label>
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

                            {/* Action Buttons for Filters */}
                            <div className="col-span-full flex justify-end gap-3 mt-2 pt-4 border-t">
                                <Button
                                    variant="destructive"
                                    disabled={selectedIds.length === 0}
                                    onClick={() => setIsBulkDeleteOpen(true)}
                                >
                                    Hapus Terpilih ({selectedIds.length})
                                </Button>
                                <Button
                                    onClick={resetFilter}
                                    variant="outline"
                                    className="gap-1 shadow-sm rounded-md"
                                >
                                    <RotateCcw className="h-4 w-4" /> Reset
                                    Filter
                                </Button>
                                <Button
                                    onClick={handleApplyFilter}
                                    className="bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded-md shadow-sm"
                                >
                                    Terapkan Filter
                                </Button>
                            </div>
                        </div>

                        <Separator className="my-6" />

                        {/* Table Section */}
                        <div className="rounded-lg border overflow-hidden shadow-sm">
                            <Table className="min-w-full divide-y">
                                <TableHeader className="bg-red-700">
                                    <TableRow>
                                        {/* CheckBox */}
                                        <TableHead>
                                            <Checkbox
                                                checked={
                                                    selectedIds.length ===
                                                    stockOuts.data.length
                                                }
                                                onCheckedChange={(checked) => {
                                                    if (checked) {
                                                        setSelectedIds(
                                                            stockOuts.data.map(
                                                                (item) =>
                                                                    item.id
                                                            )
                                                        );
                                                    } else {
                                                        setSelectedIds([]);
                                                    }
                                                }}
                                            />
                                        </TableHead>

                                        {/* Kolom Kode */}
                                        <TableHead
                                            className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer transition-colors duration-200"
                                            onClick={() => handleSort("code")}
                                        >
                                            <div className="flex items-center">
                                                Kode {getSortIcon("code")}
                                            </div>
                                        </TableHead>

                                        {/* Kolom Produk */}
                                        <TableHead className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                            <div className="flex items-center">
                                                Produk
                                            </div>
                                        </TableHead>

                                        {/* Kolom Kuantitas */}
                                        <TableHead
                                            className="px-6 py-3 text-right text-xs font-semibold text-white uppercase tracking-wider cursor-pointer transition-colors duration-200"
                                            onClick={() =>
                                                handleSort("quantity")
                                            }
                                        >
                                            <div className="flex items-center justify-end">
                                                Kuantitas{" "}
                                                {getSortIcon("quantity")}
                                            </div>
                                        </TableHead>

                                        {/* Kolom Customer */}
                                        <TableHead className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                            <div className="flex items-center">
                                                Customer
                                            </div>
                                        </TableHead>

                                        {/* Kolom Tanggal */}
                                        <TableHead
                                            className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer transition-colors duration-200"
                                            onClick={() =>
                                                handleSort("stockout_date")
                                            }
                                        >
                                            <div className="flex items-center">
                                                Tanggal{" "}
                                                {getSortIcon("stockout_date")}
                                            </div>
                                        </TableHead>

                                        {/* Kolom Dicatat Oleh */}
                                        <TableHead className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                            <div className="flex items-center">
                                                Dicatat Oleh
                                            </div>
                                        </TableHead>

                                        {/* Kolom Aksi */}
                                        <TableHead className="px-6 py-3 text-center text-xs font-semibold text-white uppercase tracking-wider">
                                            Aksi
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody className="divide-y">
                                    {stockOuts.data.length > 0 ? (
                                        stockOuts.data.map((stockOut) => (
                                            <TableRow
                                                key={stockOut.id}
                                                className="hover:bg-gray-50 transition-colors duration-150"
                                            >
                                                <TableCell>
                                                    <Checkbox
                                                        checked={selectedIds.includes(
                                                            stockOut.id
                                                        )}
                                                        onCheckedChange={(
                                                            checked
                                                        ) => {
                                                            if (checked) {
                                                                setSelectedIds([
                                                                    ...selectedIds,
                                                                    stockOut.id,
                                                                ]);
                                                            } else {
                                                                setSelectedIds(
                                                                    selectedIds.filter(
                                                                        (id) =>
                                                                            id !==
                                                                            stockOut.id
                                                                    )
                                                                );
                                                            }
                                                        }}
                                                    />
                                                </TableCell>
                                                <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    {stockOut.code || "-"}
                                                </TableCell>
                                                <TableCell className="px-6 py-4 whitespace-nowrap text-sm">
                                                    {stockOut.product?.name ||
                                                        "-"}
                                                </TableCell>
                                                <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-right">
                                                    {stockOut.quantity?.toLocaleString(
                                                        "id-ID"
                                                    ) ?? 0}
                                                </TableCell>
                                                <TableCell className="px-6 py-4 whitespace-nowrap text-sm">
                                                    {stockOut.customer || "-"}
                                                </TableCell>
                                                <TableCell className="px-6 py-4 whitespace-nowrap text-sm">
                                                    {dayjs(
                                                        stockOut.stockout_date
                                                    ).format("DD MMM YYYY")}
                                                </TableCell>
                                                <TableCell className="px-6 py-4 whitespace-nowrap text-sm">
                                                    {stockOut.user?.name || "-"}
                                                </TableCell>

                                                <TableCell className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                                    {auth.user.roles.includes(
                                                        "admin"
                                                    ) && (
                                                        <Button
                                                            size="icon"
                                                            variant="destructive"
                                                            onClick={() =>
                                                                handleConfirmDelete(
                                                                    stockOut
                                                                )
                                                            }
                                                            className="rounded-md"
                                                            disabled={
                                                                isDeleting
                                                            }
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
                                                className="text-center py-10 text-lg text-gray-500"
                                            >
                                                Tidak ada stock out ditemukan.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        <p className="text-sm text-end text-gray-600">
                            Menampilkan {stockOuts.from} - {stockOuts.to} dari{" "}
                            {stockOuts.total} data
                        </p>

                        {/* Pagination Section */}
                        {stockOuts.links && stockOuts.links.length > 3 && (
                            <div className="flex justify-center mt-6">
                                <Pagination>
                                    <PaginationContent>
                                        {stockOuts.links.map((link, index) => {
                                            const isPreviousLabel =
                                                link.label.includes(
                                                    "Previous"
                                                ) ||
                                                link.label.includes(
                                                    "pagination.previous"
                                                );
                                            const isNextLabel =
                                                link.label.includes("Next") ||
                                                link.label.includes(
                                                    "pagination.next"
                                                );
                                            const isEllipsis =
                                                link.label.includes("...");

                                            if (isPreviousLabel) {
                                                return (
                                                    <PaginationItem key={index}>
                                                        <PaginationPrevious
                                                            href={
                                                                link.url || "#"
                                                            }
                                                            className={
                                                                !link.url
                                                                    ? "opacity-50 cursor-not-allowed"
                                                                    : "text-red-700 hover:bg-red-50"
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
                                                                link.url ?? ""
                                                            }
                                                            className={
                                                                !link.url
                                                                    ? "opacity-50 cursor-not-allowed"
                                                                    : "text-red-700 hover:bg-red-50"
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
                                                                    ? "opacity-50 cursor-not-allowed"
                                                                    : link.active
                                                                    ? "bg-red-700 text-white hover:bg-red-800"
                                                                    : "text-red-700 hover:bg-red-50"
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
                            mengembalikan stok produk.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setIsBulkDeleteOpen(false)}
                        >
                            Batal
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleBulkDelete}
                        >
                            Hapus
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={isDeleteModalOpen}
                onOpenChange={setIsDeleteModalOpen}
            >
                <DialogContent className="sm:max-w-md p-6 rounded-lg shadow-lg">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-red-700">
                            Konfirmasi Hapus Stock Out
                        </DialogTitle>
                        <DialogDescription className="text-gray-600">
                            Anda yakin ingin menghapus stock out untuk produk "
                            <span className="font-semibold text-red-600">
                                {stockOutToDelete?.product?.name}
                            </span>
                            "? Tindakan ini tidak dapat dibatalkan dan akan
                            mengembalikan stok produk secara permanen.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex justify-end gap-2 mt-4">
                        <DialogClose asChild>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="border-gray-300 hover:bg-gray-100 rounded-md"
                            >
                                Batal
                            </Button>
                        </DialogClose>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-red-500 hover:bg-red-600 rounded-md"
                        >
                            {isDeleting ? "Menghapus..." : "Hapus"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Layout>
    );
}
