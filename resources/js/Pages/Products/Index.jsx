import { useEffect, useState, useCallback } from "react";
import { Head, router } from "@inertiajs/react";
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
import axios from "axios";
import ProductCreate from "./Create";
import ProductEdit from "./Edit";

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
    AlertTriangle,
    PlusCircle,
    RotateCcw,
    QrCode,
    Loader2,
    ArrowUpNarrowWide,
    ArrowDownWideNarrow,
    ArrowUpDown,
    SearchIcon,
    SquarePen,
    Package,
    Eye,
    Download,
} from "lucide-react";
import { Checkbox } from "@/Components/ui/checkbox";
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
import { debounce } from "lodash";

export default function ProductIndex({
    auth,
    products,
    flash,
    filters,
    categories,
    units,
    suppliers,
}) {
    const [selectedIds, setSelectedIds] = useState([]);
    const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
    const [isProductOpen, setIsProductOpen] = useState(false);
    const [isProductEditOpen, setIsProductEditOpen] = useState(false);
    
    const [selectedDate, setSelectedDate] = useState(
        filters.created_date ? dayjs(filters.created_date, "DD-MM-YYYY").toDate() : null
    );
    const [searchQuery, setSearchQuery] = useState(filters.search || "");
    const [selectedCategory, setSelectedCategory] = useState(
        filters.category_id ? String(filters.category_id) : "all"
    );
    const [selectedUnit, setSelectedUnit] = useState(
        filters.unit_id ? String(filters.unit_id) : "all"
    );
    const [selectedSupplier, setSelectedSupplier] = useState(
        filters.supplier_id ? String(filters.supplier_id) : "all"
    );
    const [perPage, setPerPage] = useState(filters.per_page || "10");
    
    const [generatedCode, setGeneratedCode] = useState("");
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [sortBy, setSortBy] = useState(filters.sort_by || "created_at");
    const [sortDirection, setSortDirection] = useState(
        filters.sort_direction || "desc"
    );
    const [isLoadingBarcode, setIsLoadingBarcode] = useState(false);
    const [barcodeSVG, setBarcodeSVG] = useState(null);
    const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // ✅ Debounced search
    const debouncedApplyFilter = useCallback(
        debounce(() => {
            setIsLoading(true);
            
            const formatted = selectedDate
                ? dayjs(selectedDate).format("DD-MM-YYYY")
                : undefined;
                
            const queryParams = {
                created_date: formatted,
                search: searchQuery || undefined,
                category_id: selectedCategory === "all" ? undefined : selectedCategory,
                unit_id: selectedUnit === "all" ? undefined : selectedUnit,
                supplier_id: selectedSupplier === "all" ? undefined : selectedSupplier,
                per_page: perPage,
                sort_by: sortBy,
                sort_direction: sortDirection,
            };
            
            router.get(
                route("products.index"),
                queryParams,
                {
                    preserveState: true,
                    replace: true,
                    onFinish: () => setIsLoading(false),
                    onError: () => setIsLoading(false)
                }
            );
        }, 300),
        [selectedDate, searchQuery, selectedCategory, selectedUnit, selectedSupplier, perPage, sortBy, sortDirection]
    );

    // Trigger debounced filter hanya pada perubahan filter, bukan pagination
    useEffect(() => {
        // Hanya jalankan debounced filter untuk perubahan search dan filter
        debouncedApplyFilter();
        
        return () => {
            debouncedApplyFilter.cancel();
        };
    }, [searchQuery, selectedDate, selectedCategory, selectedUnit, selectedSupplier, perPage]);

    // Separate useEffect untuk sorting
    useEffect(() => {
        return () => {
            debouncedApplyFilter.cancel();
        };
    }, [sortBy, sortDirection]);

    useEffect(() => {
        if (flash && flash.success) {
            toast({
                title: "Berhasil!",
                description: flash.success,
                variant: "default",
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

    const handleConfirmDelete = useCallback((product) => {
        setProductToDelete(product);
        setIsDeleteModalOpen(true);
    }, []);

    const handleDelete = useCallback(() => {
        if (!productToDelete) return;

        router.delete(route("products.destroy", productToDelete.id), {
            onSuccess: () => {
                toast({
                    title: "Berhasil Dihapus!",
                    description: `Produk "${productToDelete.name}" telah dihapus dari sistem.`,
                    variant: "default",
                });
                setIsDeleteModalOpen(false);
                setProductToDelete(null);
            },
            onError: (errors) => {
                toast({
                    title: "Gagal Menghapus!",
                    description:
                        errors.message ||
                        "Terjadi kesalahan saat menghapus produk.",
                    variant: "destructive",
                });
                setIsDeleteModalOpen(false);
                setProductToDelete(null);
            },
        });
    }, [productToDelete]);

    const resetFilter = useCallback(() => {
        setSelectedDate(null);
        setSearchQuery("");
        setSelectedCategory("all");
        setSelectedUnit("all");
        setSelectedSupplier("all");
        setPerPage("10");
        setSortBy("created_at");
        setSortDirection("desc");
        router.get(
            route("products.index"),
            {},
            { preserveState: true, replace: true }
        );
    }, []);

    // Handle pagination navigation
    const handlePaginationClick = (url) => {
        if (!url) return;
        
        // Cancel pending debounced calls untuk menghindari konflik
        debouncedApplyFilter.cancel();
        
        router.get(url, {}, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleSort = (column) => {
        const direction =
            sortBy === column && sortDirection === "asc" ? "desc" : "asc";

        setSortBy(column);
        setSortDirection(direction);

        const query = {
            ...filters,
            sort_by: column,
            sort_direction: direction,
            page: 1, // Reset to page 1 when sorting
        };
        
        debouncedApplyFilter.cancel(); // Cancel pending calls
        router.get(route("products.index"), query, { 
            preserveScroll: true,
            preserveState: true,
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
        return <ArrowUpDown className="h-4 w-4 ml-1 text-gray-400" />;
    };

    const showBarcode = async (productId) => {
        const product = products?.data?.find((p) => p.id === productId);
        if (!product) {
            toast({
                title: "Produk Tidak Ditemukan!",
                description: "Tidak dapat menemukan produk yang dipilih.",
                variant: "destructive",
            });
            return;
        }

        setSelectedProduct(product);
        setIsBarcodeModalOpen(true);
        setIsLoadingBarcode(true);
        setError(null);
        setBarcodeSVG(null);

        try {
            const response = await axios.get(
                route("products.barcode", product.id)
            );
            setBarcodeSVG(response.data.svg || response.data.barcode);
        } catch (err) {
            setError("Gagal memuat barcode.");
            toast({
                title: "Error Barcode!",
                description: "Tidak dapat memuat barcode untuk produk ini.",
                variant: "destructive",
            });
        } finally {
            setIsLoadingBarcode(false);
        }
    };

    const handleBulkDelete = () => {
        router.post(
            route("products.bulk-delete"),
            { ids: selectedIds },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setSelectedIds([]);
                    toast({
                        title: "Berhasil Dihapus!",
                        description: `${selectedIds.length} produk berhasil dihapus secara bersamaan.`,
                        variant: "default",
                    });
                    setIsBulkDeleteOpen(false);
                },
                onError: () => {
                    toast({
                        title: "Gagal Menghapus!",
                        description:
                            "Terjadi kesalahan saat menghapus produk terpilih.",
                        variant: "destructive",
                    });
                    setIsBulkDeleteOpen(false);
                },
            }
        );
    };

    const handleOpenProductModal = async () => {
        try {
            const response = await axios.get(route("products.generate-code"), {
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
            });
            
            const code = response.data.code || response.data.generatedCode || "";
            setGeneratedCode(code);
            setIsProductOpen(true);
            
        } catch (error) {
            console.error("Error generating code:", error);
            toast({
                title: "Error Generate Code",
                description: "Gagal menggenerate kode produk. " + (error.response?.data?.message || error.message),
                variant: "destructive",
            });
            // Still open modal even if code generation fails
            setIsProductOpen(true);
        }
    };

    const handleCloseProductModal = () => {
        setIsProductOpen(false);
        setGeneratedCode(""); // Reset generated code
    };

    const handleCloseEditModal = () => {
        setIsProductEditOpen(false);
        setSelectedProduct(null); // Reset selected product
    };

    const handleEditProduct = (product) => {
        setSelectedProduct(product);
        setIsProductEditOpen(true);
    };

    const handleApplyFilter = () => {
        debouncedApplyFilter.cancel();
        setIsLoading(true);
        
        const formatted = selectedDate
            ? dayjs(selectedDate).format("DD-MM-YYYY")
            : undefined;
            
        router.get(
            route("products.index"),
            {
                created_date: formatted,
                search: searchQuery || undefined,
                category_id: selectedCategory === "all" ? undefined : selectedCategory,
                unit_id: selectedUnit === "all" ? undefined : selectedUnit,
                supplier_id: selectedSupplier === "all" ? undefined : selectedSupplier,
                per_page: perPage,
                sort_by: sortBy,
                sort_direction: sortDirection,
                page: 1, // Reset to page 1 when applying filters
            },
            {
                preserveState: true,
                replace: true,
                onFinish: () => setIsLoading(false),
            }
        );
    };

    return (
        <Layout user={auth?.user}>
            <Head title="Produk" />
            <div className="container max-w-7xl mx-auto px-4 py-8">
                <Card className="relative shadow-lg border-none animate-in fade-in-0 slide-in-from-top-2 after:duration-500 rounded-xl">
                    <CardHeader className="pb-4 border-b">
                        <Card className="relative w-full p-6 bg-indigo-700 overflow-hidden rounded-xl">
                            <Package className="absolute right-4 bottom-[-100px] text-white opacity-10 w-80 h-80 z-0" />
                            <div className="flex gap-4 items-center z-10">
                                <Package className="text-white w-14 h-14" />
                                <div>
                                    <CardTitle className="text-3xl md:text-4xl text-white font-bold tracking-tight">
                                        Daftar Produk
                                        <span className="ml-2 text-lg font-normal opacity-75">
                                            ({products?.data?.length || 0} items)
                                        </span>
                                    </CardTitle>
                                    <CardDescription className="text-md text-white mt-1">
                                        Kelola inventaris produk Anda dengan mudah.
                                        {isLoading && (
                                            <span className="ml-2 text-yellow-300">
                                                Loading...
                                            </span>
                                        )}
                                    </CardDescription>
                                </div>
                            </div>

                            {(auth?.user?.roles?.includes("admin") ||
                                auth?.user?.roles?.includes("manager")) && (
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 z-20">
                                    <Button
                                        onClick={handleOpenProductModal}
                                        className="flex items-center gap-2 bg-white text-indigo-700 hover:bg-gray-100 shadow-md transition-all duration-200 text-base py-2 px-6 rounded-lg"
                                    >
                                        <PlusCircle className="h-5 w-5" />{" "}
                                        Tambah Produk
                                    </Button>
                                </div>
                            )}
                        </Card>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                        {/* Filter & Search Section */}
                        <Card className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 p-4 border rounded-lg shadow-sm">
                            {/* Search Input */}
                            <div className="flex flex-col gap-2">
                                <label
                                    htmlFor="search-input"
                                    className="text-sm font-medium"
                                >
                                    Cari Produk
                                </label>
                                <div className="relative">
                                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="search-input"
                                        type="text"
                                        placeholder="SKU atau Nama Produk..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
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
                                    Tanggal Dibuat
                                </label>
                                <DatePicker
                                    id="date-filter"
                                    value={selectedDate}
                                    onChange={setSelectedDate}
                                    className="w-full rounded-md"
                                />
                            </div>

                            {/* Category Filter */}
                            <div className="flex flex-col gap-2">
                                <label
                                    htmlFor="category-filter"
                                    className="text-sm font-medium"
                                >
                                    Kategori ({categories?.length || 0})
                                </label>
                                <Select
                                    value={selectedCategory}
                                    onValueChange={setSelectedCategory}
                                >
                                    <SelectTrigger
                                        id="category-filter"
                                        className="w-full rounded-md"
                                    >
                                        <SelectValue placeholder="Pilih Kategori" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            Semua Kategori
                                        </SelectItem>
                                        {categories?.map((category) => (
                                            <SelectItem
                                                key={category.id}
                                                value={String(category.id)}
                                            >
                                                {category.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Unit Filter */}
                            <div className="flex flex-col gap-2">
                                <label
                                    htmlFor="unit-filter"
                                    className="text-sm font-medium"
                                >
                                    Satuan ({units?.length || 0})
                                </label>
                                <Select
                                    value={selectedUnit}
                                    onValueChange={setSelectedUnit}
                                >
                                    <SelectTrigger
                                        id="unit-filter"
                                        className="w-full rounded-md"
                                    >
                                        <SelectValue placeholder="Pilih Satuan" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            Semua Satuan
                                        </SelectItem>
                                        {units?.map((unit) => (
                                            <SelectItem
                                                key={unit.id}
                                                value={String(unit.id)}
                                            >
                                                {unit.name} {unit.symbol && `(${unit.symbol})`}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Supplier Filter */}
                            <div className="flex flex-col gap-2">
                                <label
                                    htmlFor="supplier-filter"
                                    className="text-sm font-medium"
                                >
                                    Supplier ({suppliers?.length || 0})
                                </label>
                                <Select
                                    value={selectedSupplier}
                                    onValueChange={setSelectedSupplier}
                                >
                                    <SelectTrigger
                                        id="supplier-filter"
                                        className="w-full rounded-md"
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
                                    className="gap-1 hover:bg-gray-100 duration-200 shadow-sm rounded-md"
                                >
                                    <RotateCcw className="h-4 w-4" /> Reset
                                    Filter
                                </Button>
                                <Button
                                    onClick={handleApplyFilter}
                                    className="bg-indigo-700 hover:bg-indigo-800 px-4 py-2 rounded-md shadow-sm"
                                >
                                    Terapkan Filter
                                </Button>
                            </div>
                        </Card>

                        <Separator className="my-6" />

                        {/* Table Section */}
                        <div className="rounded-lg border overflow-hidden shadow-sm">
                            <Table className="min-w-full divide-y">
                                <TableHeader>
                                    <TableRow className="bg-indigo-700 hover:bg-indigo-800">
                                        {/* CheckBox */}
                                        <TableHead>
                                            <Checkbox
                                                checked={
                                                    selectedIds.length ===
                                                    products?.data?.length &&
                                                    products?.data?.length > 0
                                                }
                                                onCheckedChange={(checked) => {
                                                    if (checked) {
                                                        setSelectedIds(
                                                            products?.data?.map(
                                                                (item) => item.id
                                                            ) || []
                                                        );
                                                    } else {
                                                        setSelectedIds([]);
                                                    }
                                                }}
                                            />
                                        </TableHead>
                                        {/* Headers */}
                                        <TableHead
                                            className="px-6 py-3 text-white text-left text-xs font-semibold uppercase tracking-wider cursor-pointer duration-200"
                                            onClick={() => handleSort("code")}
                                        >
                                            <div className="flex items-center">
                                                Kode {getSortIcon("code")}
                                            </div>
                                        </TableHead>
                                        <TableHead
                                            className="px-6 py-3 text-white text-left text-xs font-semibold uppercase tracking-wider cursor-pointer duration-200"
                                            onClick={() => handleSort("sku")}
                                        >
                                            <div className="flex items-center">
                                                SKU {getSortIcon("sku")}
                                            </div>
                                        </TableHead>
                                        <TableHead
                                            className="px-6 py-3 text-white text-left text-xs font-semibold uppercase tracking-wider cursor-pointer duration-200"
                                            onClick={() => handleSort("name")}
                                        >
                                            <div className="flex items-center">
                                                Nama Produk {getSortIcon("name")}
                                            </div>
                                        </TableHead>
                                        <TableHead className="px-6 py-3 text-white text-left text-xs font-semibold uppercase tracking-wider">
                                            Kategori
                                        </TableHead>
                                        <TableHead className="px-6 py-3 text-white text-left text-xs font-semibold uppercase tracking-wider">
                                            Satuan
                                        </TableHead>
                                        <TableHead className="px-6 py-3 text-white text-left text-xs font-semibold uppercase tracking-wider">
                                            Supplier
                                        </TableHead>
                                        <TableHead
                                            className="px-6 py-3 text-white text-center text-xs font-semibold uppercase tracking-wider cursor-pointer duration-200"
                                            onClick={() => handleSort("current_stock")}
                                        >
                                            <div className="flex items-center justify-center">
                                                Stok {getSortIcon("current_stock")}
                                            </div>
                                        </TableHead>
                                        <TableHead
                                            className="px-6 py-3 text-white text-right text-xs font-semibold uppercase tracking-wider cursor-pointer duration-200"
                                            onClick={() => handleSort("price")}
                                        >
                                            <div className="flex items-center justify-end">
                                                Harga {getSortIcon("price")}
                                            </div>
                                        </TableHead>
                                        <TableHead
                                            className="px-6 py-3 text-white text-right text-xs font-semibold uppercase tracking-wider cursor-pointer duration-200"
                                            onClick={() => handleSort("created_at")}
                                        >
                                            <div className="flex items-center justify-end">
                                                Dibuat {getSortIcon("created_at")}
                                            </div>
                                        </TableHead>
                                        <TableHead className="px-6 py-3 text-white text-center text-xs font-semibold uppercase tracking-wider">
                                            Aksi
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody className="divide-y">
                                    {products?.data?.length > 0 ? (
                                        products.data.map((product) => (
                                            <TableRow
                                                key={product.id}
                                                className="hover:bg-gray-50 duration-150"
                                            >
                                                <TableCell>
                                                    <Checkbox
                                                        checked={selectedIds.includes(product.id)}
                                                        onCheckedChange={(checked) => {
                                                            if (checked) {
                                                                setSelectedIds([...selectedIds, product.id]);
                                                            } else {
                                                                setSelectedIds(
                                                                    selectedIds.filter((id) => id !== product.id)
                                                                );
                                                            }
                                                        }}
                                                    />
                                                </TableCell>
                                                <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    {product.code || "-"}
                                                </TableCell>
                                                <TableCell className="px-6 py-4 whitespace-nowrap text-sm">
                                                    {product.sku}
                                                </TableCell>
                                                <TableCell className="px-6 py-4 whitespace-nowrap text-sm">
                                                    {product.name}
                                                </TableCell>
                                                <TableCell className="px-6 py-4 whitespace-nowrap text-sm">
                                                    {product.category?.name || "-"}
                                                </TableCell>
                                                <TableCell className="px-6 py-4 whitespace-nowrap text-sm">
                                                    {product.unit?.name || "-"}
                                                    {product.unit?.symbol && ` (${product.unit.symbol})`}
                                                </TableCell>
                                                <TableCell className="px-6 py-4 whitespace-nowrap text-sm">
                                                    {product.supplier?.name || "-"}
                                                </TableCell>
                                                <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                                    <span className={
                                                        product.current_stock < 10 
                                                            ? "font-semibold text-red-600"
                                                            : ""
                                                    }>
                                                        {product.current_stock || 0}
                                                        {product.current_stock < 10 && (
                                                            <span className="ml-1 text-xs text-red-500">
                                                                (Rendah!)
                                                            </span>
                                                        )}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-right">
                                                    Rp {new Intl.NumberFormat('id-ID').format(product.price || 0)}
                                                </TableCell>
                                                <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-right">
                                                    {dayjs(product.created_at).format("DD MMM YYYY")}
                                                </TableCell>
                                                <TableCell className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2">
                                                    {/* View Product Details */}
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="bg-blue-500 hover:bg-blue-600 text-white rounded-md"
                                                        title="Lihat Detail"
                                                        onClick={() => router.get(route("products.show", product.id))}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    
                                                    {(auth?.user?.roles?.includes("admin") ||
                                                        auth?.user?.roles?.includes("manager")) && (
                                                        <Button
                                                            size="icon"
                                                            className="bg-[#00d380] hover:bg-[#00b06b] text-white rounded-md"
                                                            title="Edit Produk"
                                                            onClick={() => handleEditProduct(product)}
                                                        >
                                                            <SquarePen className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    
                                                    {auth?.user?.roles?.includes("admin") && (
                                                        <Button
                                                            size="icon"
                                                            variant="destructive"
                                                            onClick={() => handleConfirmDelete(product)}
                                                            className="rounded-md"
                                                            title="Hapus Produk"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="bg-purple-500 hover:bg-purple-600 text-white"
                                                        onClick={() => showBarcode(product.id)}
                                                        title="Lihat Barcode"
                                                    >
                                                        <QrCode className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={11} className="text-center py-10 text-lg text-gray-500">
                                                Tidak ada produk ditemukan.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                        
                        {products?.from && (
                            <p className="text-sm text-end">
                                Menampilkan {products.from} - {products.to} dari{" "}
                                {products.total} data
                            </p>
                        )}

                        {/* Pagination Section */}
                        {products?.links && products?.links?.length > 3 && (
                            <div className="flex justify-center mt-6">
                                <Pagination>
                                    <PaginationContent>
                                        {products.links.map((link, index) => {
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
                                                                    : "hover:bg-gray-100"
                                                            }
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                if (link.url) handlePaginationClick(link.url);
                                                            }}
                                                        />
                                                    </PaginationItem>
                                                );
                                            }

                                            if (isNextLabel) {
                                                return (
                                                    <PaginationItem key={index}>
                                                        <PaginationNext
                                                            href={link.url ?? ""}
                                                            className={
                                                                !link.url
                                                                    ? "opacity-50 cursor-not-allowed"
                                                                    : "hover:bg-gray-100"
                                                            }
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                if (link.url) handlePaginationClick(link.url);
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
                                                                if (link.url) handlePaginationClick(link.url);
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

            {/* Modals */}
            {/* Bulk Delete Modal */}
            <Dialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
                <DialogContent className="max-w-sm sm:max-w-md p-0 rounded-2xl shadow-2xl bg-white border-0 overflow-hidden">
                    <div className="bg-gradient-to-r from-orange-500 to-red-500 p-4 sm:p-6 text-center">
                        <div className="flex justify-center mb-4">
                            <div className="p-3 bg-white bg-opacity-20 rounded-full animate-pulse">
                                <Trash2 className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                            </div>
                        </div>
                        <DialogTitle className="text-xl sm:text-2xl font-bold text-white mb-2">
                            Hapus Massal
                        </DialogTitle>
                        <DialogDescription className="text-orange-100 text-sm sm:text-base">
                            Menghapus beberapa produk sekaligus
                        </DialogDescription>
                    </div>

                    <div className="p-4 sm:p-6">
                        <div className="text-center mb-4 sm:mb-6">
                            <p className="text-gray-700 text-base sm:text-lg mb-4">
                                Anda akan menghapus
                            </p>
                            <div className="inline-flex items-center gap-2 sm:gap-3 bg-gradient-to-r from-orange-50 to-red-50 px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl border border-orange-200 shadow-sm">
                                <div className="p-1 sm:p-2 bg-orange-500 text-white rounded-full">
                                    <Package className="h-4 w-4 sm:h-5 sm:w-5" />
                                </div>
                                <div>
                                    <span className="text-2xl sm:text-3xl font-bold text-orange-600 block">
                                        {selectedIds.length}
                                    </span>
                                    <span className="text-orange-700 font-medium text-xs sm:text-sm">
                                        produk terpilih
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2 sm:gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setIsBulkDeleteOpen(false)}
                                className="flex-1 h-10 sm:h-12 border-gray-300 text-gray-700 hover:bg-gray-50 font-medium rounded-lg sm:rounded-xl transition-all duration-200 text-sm sm:text-base"
                            >
                                Batal
                            </Button>
                            <Button
                                onClick={handleBulkDelete}
                                className="flex-1 h-10 sm:h-12 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-semibold rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] text-sm sm:text-base"
                            >
                                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                Hapus Semua
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Create Product Modal */}
            <Dialog open={isProductOpen} onOpenChange={setIsProductOpen}>
                <DialogContent className="max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl 2xl:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-lg sm:text-xl md:text-2xl">Tambah Produk</DialogTitle>
                        <DialogDescription className="text-sm sm:text-base">
                            Isi data produk baru untuk digunakan pada sistem Anda.
                        </DialogDescription>
                    </DialogHeader>

                    <ProductCreate
                        onClose={handleCloseProductModal}
                        categories={categories}
                        units={units}
                        suppliers={suppliers}
                        generatedCode={generatedCode}
                    />
                </DialogContent>
            </Dialog>

            {/* Edit Product Modal */}
            <Dialog open={isProductEditOpen} onOpenChange={setIsProductEditOpen}>
                <DialogContent className="max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl 2xl:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-lg sm:text-xl md:text-2xl">Edit Produk</DialogTitle>
                        <DialogDescription className="text-sm sm:text-base">
                            Ubah data produk Anda sesuai kebutuhan.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedProduct && (
                        <ProductEdit
                            product={selectedProduct}
                            categories={categories}
                            units={units}
                            suppliers={suppliers}
                            onClose={handleCloseEditModal}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Barcode Modal */}
            <Dialog open={isBarcodeModalOpen} onOpenChange={setIsBarcodeModalOpen}>
                <DialogContent className="max-w-xs sm:max-w-sm md:max-w-md p-4 sm:p-6 rounded-xl shadow-xl">
                    <DialogHeader>
                        <DialogTitle className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">
                            Preview Barcode
                        </DialogTitle>
                        <DialogDescription className="text-sm sm:text-base text-gray-600">
                            Scan barcode ini untuk identifikasi produk:{" "}
                            <span className="font-semibold text-gray-800">
                                {selectedProduct?.code || selectedProduct?.sku || "-"}
                            </span>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-center items-center py-4 sm:py-6 rounded-lg border border-dashed border-gray-200 min-h-[120px] sm:min-h-[150px]">
                        {isLoadingBarcode ? (
                            <div className="flex flex-col items-center text-gray-500">
                                <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin mb-2" />
                                <p className="text-sm sm:text-base">Memuat barcode...</p>
                            </div>
                        ) : error ? (
                            <p className="text-red-500 text-center text-sm sm:text-base">{error}</p>
                        ) : barcodeSVG ? (
                            <div
                                dangerouslySetInnerHTML={{ __html: barcodeSVG }}
                                className="w-full h-auto max-w-[90%] sm:max-w-[80%] flex justify-center items-center"
                            />
                        ) : (
                            <p className="text-gray-500 text-sm sm:text-base">
                                Tidak ada barcode untuk ditampilkan.
                            </p>
                        )}
                    </div>

                    <DialogFooter className="mt-4 flex justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setIsBarcodeModalOpen(false)}
                            className="border-gray-300 hover:bg-gray-100 rounded-md text-sm sm:text-base"
                        >
                            Tutup
                        </Button>
                        {selectedProduct && (
                            <a
                                href={route("products.download-barcode", selectedProduct.id)}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <Button
                                    variant="default"
                                    className="bg-blue-600 hover:bg-blue-700 rounded-md text-sm sm:text-base"
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Download QR
                                </Button>
                            </a>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Modal */}
            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent className="max-w-xs sm:max-w-sm md:max-w-md p-0 rounded-2xl shadow-2xl bg-white border-0 overflow-hidden">
                    <div className="bg-gradient-to-r from-red-500 to-red-600 p-4 sm:p-6 text-center relative overflow-hidden">
                        <div className="absolute inset-0 opacity-10">
                            <div className="absolute -top-4 -right-4 w-16 sm:w-24 h-16 sm:h-24 bg-white rounded-full"></div>
                            <div className="absolute -bottom-4 -left-4 w-12 sm:w-16 h-12 sm:h-16 bg-white rounded-full"></div>
                        </div>

                        <div className="relative z-10">
                            <div className="flex justify-center mb-4">
                                <div className="p-3 sm:p-4 bg-white bg-opacity-20 rounded-full animate-bounce">
                                    <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                                </div>
                            </div>
                            <DialogTitle className="text-xl sm:text-2xl font-bold text-white mb-2">
                                Konfirmasi Hapus
                            </DialogTitle>
                            <DialogDescription className="text-red-100 text-sm sm:text-base">
                                Tindakan ini tidak dapat dibatalkan
                            </DialogDescription>
                        </div>
                    </div>

                    <div className="p-4 sm:p-6">
                        <div className="text-center mb-4 sm:mb-6">
                            <p className="text-gray-700 text-base sm:text-lg leading-relaxed mb-3">
                                Apakah Anda yakin ingin menghapus produk
                            </p>

                            <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-3 sm:p-4 rounded-xl border border-gray-200 mb-4">
                                <div className="flex items-center justify-center gap-2 sm:gap-3">
                                    <div className="p-1 sm:p-2 bg-red-500 text-white rounded-lg">
                                        <Package className="h-3 w-3 sm:h-4 sm:w-4" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="font-bold text-lg sm:text-xl text-gray-900 truncate">
                                            {productToDelete?.name || "produk ini"}
                                        </p>
                                        <p className="text-xs sm:text-sm text-gray-500 truncate">
                                            SKU: {productToDelete?.sku || "-"}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-gray-500">
                                <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></span>
                                Data akan dihapus secara permanen
                            </div>
                        </div>

                        <div className="flex gap-2 sm:gap-3">
                            <DialogClose asChild>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1 h-10 sm:h-12 border-gray-300 text-gray-700 hover:bg-gray-50 font-medium rounded-lg sm:rounded-xl transition-all duration-200 text-sm sm:text-base"
                                >
                                    Batal
                                </Button>
                            </DialogClose>
                            <Button
                                type="button"
                                onClick={handleDelete}
                                className="flex-1 h-10 sm:h-12 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold rounded-lg sm:rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] text-sm sm:text-base"
                            >
                                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                Ya, Hapus!
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </Layout>
    );
}