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
    DialogTrigger,
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
import { QRCode } from "react-qrcode-logo";

import {
    Trash2,
    PlusCircle,
    FilterIcon,
    RotateCcw,
    ArrowUpNarrowWide,
    ArrowDownWideNarrow,
    ArrowUpDown,
    SearchIcon,
    QrCode,
    Edit,
    Printer,
    ShoppingCart,
    Package,
    User,
    Calendar,
    DollarSign,
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

export default function PurchaseTransactionIndex({
    auth,
    purchaseTransactions,
    flash,
    filters,
    suppliers,
    products,
}) {
    const { settings } = usePage().props;
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [isQrModalOpen, setIsQrModalOpen] = useState(false);
    const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
    const [barcodeSVG, setBarcodeSVG] = useState(null);
    const [isLoadingBarcode, setIsLoadingBarcode] = useState(false);
    const [error, setError] = useState(null);
    const { delete: inertiaDelete } = useForm();
    const [selectedIds, setSelectedIds] = useState([]);
    const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(
        filters.transaction_date ? new Date(filters.transaction_date) : null
    );
    const [searchQuery, setSearchQuery] = useState(filters.search || "");
    const [selectedSupplier, setSelectedSupplier] = useState(
        filters.supplier_id || "all"
    );
    const [selectedProduct, setSelectedProduct] = useState(
        filters.product_id || "all"
    );
    const [perPage, setPerPage] = useState(filters.per_page || "10");

    const [sortBy, setSortBy] = useState(filters.sort_by || "transaction_date");
    const [sortDirection, setSortDirection] = useState(
        filters.sort_direction || "desc"
    );

    const [transactionToDelete, setTransactionToDelete] = useState(null);
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

    const handleConfirmDelete = useCallback((transaction) => {
        setTransactionToDelete(transaction);
        setIsDeleteModalOpen(true);
    }, []);

    const handleDelete = useCallback(() => {
        if (!transactionToDelete) return;

        inertiaDelete(
            route("purchase-transactions.destroy", transactionToDelete.id),
            {
                onSuccess: () => {
                    toast({
                        title: "Berhasil dihapus!",
                        description:
                            "Transaksi pembelian telah berhasil dihapus.",
                        variant: "success",
                    });
                    setIsDeleteModalOpen(false);
                    setTransactionToDelete(null);
                },
                onError: (errors) => {
                    toast({
                        title: "Gagal menghapus!",
                        description:
                            errors.message ||
                            "Terjadi kesalahan saat menghapus transaksi pembelian.",
                        variant: "destructive",
                    });
                    setIsDeleteModalOpen(false);
                    setTransactionToDelete(null);
                },
            }
        );
    }, [transactionToDelete, inertiaDelete]);

    const applyFilter = useCallback(() => {
        router.get(
            route("purchase-transactions.index"),
            {
                transaction_date: selectedDate
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
        setSortBy("transaction_date");
        setSortDirection("desc");
        router.get(
            route("purchase-transactions.index"),
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
            route("purchase-transactions.index"),
            {
                transaction_date: selectedDate
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
        return <ArrowUpDown className="h-4 w-4 ml-1 text-gray-400" />;
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
        }).format(amount);
    };

    const handleBulkDelete = () => {
        console.log("✅ Fungsi handleBulkDelete dipanggil");
        console.log("📝 selectedIds:", selectedIds);
        router.post(
            route("purchaseTransactions.bulk-delete"),
            { ids: selectedIds },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setSelectedIds([]);
                    toast({
                        title: "Berhasil dihapus!",
                        description: `${selectedIds.length} Satuan berhasil dihapus.`,
                        className: "bg-[#035864] text-white",
                    });
                    setIsBulkDeleteOpen(false);
                },
                onError: () => {
                    toast({
                        title: "Gagal menghapus!",
                        description:
                            "Terjadi kesalahan saat menghapus Satuan terpilih.",
                        className: "bg-red-600 text-white",
                    });
                    setIsBulkDeleteOpen(false);
                },
            }
        );
    };

    const fetchBarcode = async () => {
    if (!selectedTransaction) return;

    setIsLoadingBarcode(true);
    setError(null);
    try {
        const response = await axios.get(
            route(
                "purchase-transactions.barcode.generate",
                selectedTransaction.id
            )
        );
        setBarcodeSVG(response.data.svg);
    } catch (err) {
        console.error(err);
        setError("Gagal memuat barcode.");
    } finally {
        setIsLoadingBarcode(false);
    }
};

useEffect(() => {
    if (isBarcodeModalOpen && selectedTransaction) {
        fetchBarcode();
    } else {
        setBarcodeSVG(null);
    }
}, [isBarcodeModalOpen, selectedTransaction]);


    return (
        <Layout user={auth.user}>
            <Head title="Transaksi Pembelian" />
            <div className="container max-w-6xl mx-auto px-4 py-8">
                <Card className="shadow-lg border-none animate-in fade-in-0 slide-in-from-top-2 after:duration-500 rounded-xl">
                    <CardHeader className="pb-4 border-b">
  {/* Inner Colored Card */}
  <Card className="relative w-full p-6 bg-[#0f4c75] overflow-hidden rounded-xl">
    {/* Background Icon */}
    <ShoppingCart
      className="absolute right-4 bottom-[-100px] text-white opacity-10 w-80 h-80 z-0"
    />

    {/* Title & Description */}
    <div className="flex gap-4 items-center z-10">
      <ShoppingCart className="text-white w-14 h-14" />
      <div>
        <CardTitle className="text-3xl md:text-4xl text-white font-bold tracking-tight">
          Transaksi Pembelian
        </CardTitle>
        <CardDescription className="text-md text-white mt-1">
          Kelola riwayat transaksi pembelian produk.
        </CardDescription>
      </div>
    </div>

    {/* Tombol Tambah */}
    {(auth.user.roles.includes("admin") || auth.user.roles.includes("staff")) && (
      <div className="absolute right-6 top-1/2 -translate-y-1/2 z-20">
        <Link href={route("purchase-transactions.create")}>
          <Button className="flex items-center gap-2 bg-white text-[#0f4c75] hover:bg-gray-100 shadow-md transition-all duration-200 text-base py-2 px-6 rounded-lg">
            <PlusCircle className="h-5 w-5" /> Catat Pembelian Baru
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
                                    Cari Transaksi
                                </label>
                                <div className="relative">
                                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" />
                                    <Input
                                        id="search-input"
                                        type="text"
                                        placeholder="Produk atau Supplier..."
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
                                    Tanggal Transaksi
                                </label>
                                <DatePicker
                                    id="date-filter"
                                    value={selectedDate}
                                    onChange={setSelectedDate}
                                    className="border-gray-300 focus-visible:ring-[#035864] focus-visible:border-[#035864] w-full rounded-md"
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
                                    className="bg-[#0f4c75] hover:bg-[#0f4z75] text-white px-4 py-2 rounded-md shadow-sm"
                                >
                                    Terapkan Filter
                                </Button>
                            </div>
                        </div>

                        <Separator className="my-6" />

                        {/* Table Section */}
                        <div className="rounded-lg border overflow-hidden shadow-sm">
                            <Table className="min-w-full divide-y">
                                <TableHeader className="bg-[#0f4c75] hover:bg-[#0f4z75]">
                                    <TableRow>
                                        {/* CheckBox */}
                                        <TableHead>
                                            <Checkbox
                                                checked={
                                                    selectedIds.length ===
                                                    purchaseTransactions.data
                                                        .length
                                                }
                                                onCheckedChange={(checked) => {
                                                    if (checked) {
                                                        setSelectedIds(
                                                            purchaseTransactions.data.map(
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
                                        {/* Invoice Number */}
                                        <TableHead
                                            className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer transition-colors duration-200"
                                            onClick={() =>
                                                handleSort("product_id")
                                            }
                                        >
                                            <div className="flex items-center">
                                                Invoice{" "}
                                                {getSortIcon("product_id")}
                                            </div>
                                        </TableHead>
                                        {/* Kolom Produk */}
                                        <TableHead
                                            className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer transition-colors duration-200"
                                            onClick={() =>
                                                handleSort("product_id")
                                            }
                                        >
                                            <div className="flex items-center">
                                                Produk{" "}
                                                {getSortIcon("product_id")}
                                            </div>
                                        </TableHead>
                                        {/* Kolom Supplier */}
                                        <TableHead
                                            className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer transition-colors duration-200"
                                            onClick={() =>
                                                handleSort("supplier_id")
                                            }
                                        >
                                            <div className="flex items-center">
                                                Supplier{" "}
                                            </div>
                                        </TableHead>

                                        {/* Kolom Kuantitas */}
                                        <TableHead
                                            className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer transition-colors duration-200"
                                            onClick={() =>
                                                handleSort("quantity")
                                            }
                                        >
                                            <div className="flex items-center">
                                                Qty {getSortIcon("quantity")}
                                            </div>
                                        </TableHead>
                                        {/* Kolom Harga Per Unit */}
                                        <TableHead
                                            className="px-6 py-3 text-xs font-semibold text-white uppercase tracking-wider cursor-pointer transition-colors duration-200"
                                            onClick={() =>
                                                handleSort("price_per_unit")
                                            }
                                        >
                                            <div className="flex items-center">
                                                Harga/Unit{" "}
                                                {getSortIcon("price_per_unit")}
                                            </div>
                                        </TableHead>
                                        {/* Kolom Total Harga */}
                                        <TableHead
                                            className="px-6 py-3 text-xs font-semibold text-white uppercase tracking-wider cursor-pointer transition-colors duration-200"
                                            onClick={() =>
                                                handleSort("total_price")
                                            }
                                        >
                                            <div className="flex items-center">
                                                Total{" "}
                                                {getSortIcon("total_price")}
                                            </div>
                                        </TableHead>
                                        {/* Kolom Tanggal */}
                                        <TableHead
                                            className="px-6 py-3 text-xs font-semibold text-white uppercase tracking-wider cursor-pointer transition-colors duration-200"
                                            onClick={() =>
                                                handleSort("transaction_date")
                                            }
                                        >
                                            <div className="flex items-center">
                                                Tanggal{" "}
                                                {getSortIcon(
                                                    "transaction_date"
                                                )}
                                            </div>
                                        </TableHead>
                                        {/* Kolom Supplier */}
                                        <TableHead
                                            className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer transition-colors duration-200"
                                            onClick={() =>
                                                handleSort("supplier_id")
                                            }
                                        >
                                            <div className="flex items-center">
                                                Status{" "}
                                            </div>
                                        </TableHead>
                                        {/* Kolom Dicatat Oleh */}
                                        <TableHead
                                            className="px-6 py-3 text-xs font-semibold text-white uppercase tracking-wider cursor-pointer transition-colors duration-200"
                                            onClick={() =>
                                                handleSort("user_id")
                                            }
                                        >
                                            <div className="flex items-center">
                                                Oleh{" "}
                                            </div>
                                        </TableHead>
                                        {/* Kolom Aksi */}
                                        <TableHead className="px-6 py-3 text-center text-xs font-semibold text-white uppercase tracking-wider">
                                            Aksi
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody className="divide-y">
                                    {purchaseTransactions.data.length > 0 ? (
                                        purchaseTransactions.data.map(
                                            (transaction) => (
                                                <TableRow
                                                    key={transaction.id}
                                                >
                                                    <TableCell>
                                                        <Checkbox
                                                            checked={selectedIds.includes(
                                                                transaction.id
                                                            )}
                                                            onCheckedChange={(
                                                                checked
                                                            ) => {
                                                                if (checked) {
                                                                    setSelectedIds(
                                                                        [
                                                                            ...selectedIds,
                                                                            transaction.id,
                                                                        ]
                                                                    );
                                                                } else {
                                                                    setSelectedIds(
                                                                        selectedIds.filter(
                                                                            (
                                                                                id
                                                                            ) =>
                                                                                id !==
                                                                                transaction.id
                                                                        )
                                                                    );
                                                                }
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium ">
                                                        {transaction.invoice_number ??
                                                            "-"}
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm ">
                                                        {
                                                            transaction.product
                                                                .name
                                                        }
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm ">
                                                        {
                                                            transaction.supplier
                                                                .name
                                                        }
                                                    </TableCell>

                                                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm ">
                                                        {transaction.quantity.toLocaleString(
                                                            "id-ID"
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm ">
                                                        {formatCurrency(
                                                            transaction.price_per_unit
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm  font-semibold">
                                                        {formatCurrency(
                                                            transaction.total_price
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4 whitespace-nowrap ">
                                                        {dayjs(
                                                            transaction.transaction_date
                                                        ).format("DD MMM YYYY")}
                                                    </TableCell>
                                                    <TableCell
    className="px-6 py-4 whitespace-nowrap text-sm "
>
    {transaction.status ? (
        <span
            className={`px-2 py-1 rounded ${
                transaction.status === "pending"
                    ? "bg-red-100 text-red-700"
                    : transaction.status === "completed"
                    ? "bg-green-100 text-green-700"
                    : ""
            }`}
        >
            {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
        </span>
    ) : (
        "-"
    )}
</TableCell>

                                                    <TableCell className="px-6 py-4 whitespace-nowrap text-sm ">
                                                        {transaction.user.name}
                                                    </TableCell>
                                                    <TableCell className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2">
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="bg-blue-500 hover:bg-blue-600 text-white hover:text-white rounded-md"
                                                            onClick={() =>
                                                                router.visit(
                                                                    route(
                                                                        "purchase-transactions.edit",
                                                                        transaction.id
                                                                    )
                                                                )
                                                            }
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        {auth.user.roles.includes(
                                                            "admin"
                                                        ) && (
                                                            <Button
                                                                size="icon"
                                                                variant="destructive"
                                                                onClick={() =>
                                                                    handleConfirmDelete(
                                                                        transaction
                                                                    )
                                                                }
                                                                className="rounded-md"
                                                                title="Hapus Transaksi"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        )}

                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="bg-blue-500 hover:bg-blue-600 text-white hover:text-white rounded-md"
                                                            onClick={() => {
                                                                setSelectedTransaction(
                                                                    transaction
                                                                );
                                                                setIsBarcodeModalOpen(
                                                                    true
                                                                );
                                                            }}
                                                        >
                                                            <QrCode className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="bg-green-500 hover:bg-green-600 text-white hover:text-white rounded-md"
                                                            onClick={() =>
                                                                window.open(
                                                                    route(
                                                                        "purchase-transactions.print",
                                                                        transaction.id
                                                                    ),
                                                                    "_blank"
                                                                )
                                                            }
                                                        >
                                                            <Printer className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        )
                                    ) : (
                                        <TableRow>
                                            <TableCell
                                                colSpan={8}
                                                className="text-center py-10 text-lg"
                                            >
                                                Tidak ada transaksi pembelian
                                                ditemukan.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                        <p className="text-sm text-end">
                            Menampilkan {purchaseTransactions.from} -{" "}
                            {purchaseTransactions.to} dari{" "}
                            {purchaseTransactions.total} data
                        </p>

                        {/* Pagination Section */}
                        {purchaseTransactions.links &&
                            purchaseTransactions.links.length > 3 && (
                                <div className="flex justify-center mt-6">
                                    <Pagination>
                                        <PaginationContent>
                                            {purchaseTransactions.links.map(
                                                (link, index) => {
                                                    const isPreviousLabel =
                                                        link.label.includes(
                                                            "Previous"
                                                        ) ||
                                                        link.label.includes(
                                                            "pagination.previous"
                                                        );
                                                    const isNextLabel =
                                                        link.label.includes(
                                                            "Next"
                                                        ) ||
                                                        link.label.includes(
                                                            "pagination.next"
                                                        );
                                                    const isEllipsis =
                                                        link.label.includes(
                                                            "..."
                                                        );

                                                    if (isPreviousLabel) {
                                                        return (
                                                            <PaginationItem
                                                                key={index}
                                                            >
                                                                <PaginationPrevious
                                                                    href={
                                                                        link.url ||
                                                                        "#"
                                                                    }
                                                                    className={
                                                                        !link.url
                                                                            ? "opacity-50 cursor-not-allowed text-gray-400"
                                                                            : "text-[#035864] hover:bg-[#e0f2f4]"
                                                                    }
                                                                    onClick={(
                                                                        e
                                                                    ) => {
                                                                        e.preventDefault();
                                                                        if (
                                                                            link.url
                                                                        ) {
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
                                                            <PaginationItem
                                                                key={index}
                                                            >
                                                                <PaginationNext
                                                                    href={
                                                                        link.url ??
                                                                        ""
                                                                    }
                                                                    className={
                                                                        !link.url
                                                                            ? "opacity-50 cursor-not-allowed text-gray-400"
                                                                            : "text-[#035864] hover:bg-[#e0f2f4]"
                                                                    }
                                                                    onClick={(
                                                                        e
                                                                    ) => {
                                                                        e.preventDefault();
                                                                        if (
                                                                            link.url
                                                                        ) {
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
                                                            <PaginationItem
                                                                key={index}
                                                            >
                                                                <PaginationLink
                                                                    href={
                                                                        link.url ||
                                                                        "#"
                                                                    }
                                                                    isActive={
                                                                        link.active
                                                                    }
                                                                    className={
                                                                        !link.url
                                                                            ? "opacity-50 cursor-not-allowed text-gray-400"
                                                                            : link.active
                                                                            ? "bg-[#035864] text-white hover:bg-[#024a54]"
                                                                            : "text-[#035864] hover:bg-[#e0f2f4]"
                                                                    }
                                                                    onClick={(
                                                                        e
                                                                    ) => {
                                                                        e.preventDefault(); // ← WAJIB
                                                                        if (
                                                                            link.url
                                                                        ) {
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
                                                        <PaginationItem
                                                            key={index}
                                                        >
                                                            <PaginationEllipsis className="text-gray-500" />
                                                        </PaginationItem>
                                                    );
                                                }
                                            )}
                                        </PaginationContent>
                                    </Pagination>
                                </div>
                            )}
                    </CardContent>
                </Card>
            </div>
            <Dialog
                open={isBarcodeModalOpen}
                onOpenChange={setIsBarcodeModalOpen}
            >
                <DialogContent className="max-w-md p-6 rounded-xl shadow-xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-gray-800">
                            Preview Barcode
                        </DialogTitle>
                        {selectedTransaction && (
                            <p className="text-gray-600">
                                Scan barcode ini untuk identifikasi transaksi:{" "}
                                <span className="font-semibold text-gray-800">
                                    {selectedTransaction.invoice_number}
                                </span>
                            </p>
                        )}
                    </DialogHeader>
                    <div className="flex justify-center items-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-200 min-h-[150px]">
                        {selectedTransaction ? (
                            <QRCode
                                value={selectedTransaction.invoice_number}
                                size={200}
                            />
                        ) : (
                            <p className="text-gray-500">
                                Tidak ada barcode untuk ditampilkan.
                            </p>
                        )}
                    </div>
                    <DialogFooter className="mt-4 flex justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setIsBarcodeModalOpen(false)}
                            className="border-gray-300  hover:bg-gray-100 rounded-md"
                        >
                            Tutup
                        </Button>
                        {selectedTransaction && (
                            <a
                                href={route(
                                    "purchase-transactions.barcode.download",
                                    selectedTransaction.id
                                )}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <Button
                                    variant="default"
                                    className="bg-blue-600 text-white hover:bg-blue-700 rounded-md"
                                >
                                    Download QR
                                </Button>
                            </a>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Bulk Delete */}
            <Dialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Konfirmasi Hapus</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus{" "}
                            <b>{selectedIds.length}</b> Produk terpilih? <br />
                            Tindakan ini tidak dapat dibatalkan.
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
                        <DialogTitle className="text-xl font-bold text-[#035864]">
                            Konfirmasi Hapus Transaksi
                        </DialogTitle>
                        <DialogDescription className="text-gray-600">
                            Anda yakin ingin menghapus transaksi pembelian untuk
                            produk "
                            <span className="font-semibold text-red-600">
                                {transactionToDelete?.product?.name}
                            </span>
                            "? Tindakan ini tidak dapat dibatalkan dan akan
                            menghapus data transaksi secara permanen serta
                            mengembalikan stok.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex justify-end gap-2 mt-4">
                        <DialogClose asChild>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="border-gray-300  hover:bg-gray-100 rounded-md"
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
        </Layout>
    );
}
