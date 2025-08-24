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
import { usePage } from "@inertiajs/react";

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
import Create from "./Create";
import {
    Trash2,
    PlusCircle,
    FilterIcon,
    RotateCcw,
    ArrowUpNarrowWide,
    ArrowDownWideNarrow,
    ArrowUpDown,
    SearchIcon,
    SquarePen,
    Combine,
    Divide,
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
import formatDate from "@/Utils/formatDate";
import { Checkbox } from "@/Components/ui/checkbox"; // ✅ Fixed: Proper import path
import Edit from "./Edit"; // ✅ Fixed: Proper case
import { debounce } from "lodash"; // ✅ Added for debouncing

export default function UnitIndex({ auth, units, flash, filters }) {
    const [selectedIds, setSelectedIds] = useState([]);
    const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
    const { settings } = usePage().props;
    const [isUnitOpen, setIsUnitOpen] = useState(false);
    const [isEditUnitOpen, setIsEditUnitOpen] = useState(false);
    const { delete: inertiaDelete } = useForm();
    const [selectedUnit, setSelectedUnit] = useState(null);
    const [selectedDate, setSelectedDate] = useState(
        filters.created_date ? new Date(filters.created_date) : null
    );
    const [searchQuery, setSearchQuery] = useState(filters.search || "");
    const [perPage, setPerPage] = useState(filters.per_page || "10");

    const [sortBy, setSortBy] = useState(filters.sort_by || "created_at");
    const [sortDirection, setSortDirection] = useState(
        filters.sort_direction || "desc"
    );

    const [unitToDelete, setUnitToDelete] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    // ✅ Improved: Debounced search
    const debouncedApplyFilter = useCallback(
        debounce(() => {
            const formatted = selectedDate
                ? dayjs(selectedDate).format("DD-MM-YYYY")
                : undefined;
            router.get(
                route("units.index"),
                {
                    created_date: formatted,
                    search: searchQuery || undefined,
                    per_page: perPage,
                    sort_by: sortBy,
                    sort_direction: sortDirection,
                },
                {
                    preserveState: true,
                    replace: true,
                }
            );
        }, 300),
        [selectedDate, searchQuery, perPage, sortBy, sortDirection]
    );

    useEffect(() => {
        debouncedApplyFilter();
        return () => {
            debouncedApplyFilter.cancel();
        };
    }, [debouncedApplyFilter]);

    const openEditUnitModal = (unit) => {
        setSelectedUnit(unit);
        setIsEditUnitOpen(true);
    };

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

    const handleConfirmDelete = useCallback((unit) => {
        setUnitToDelete(unit);
        setIsDeleteModalOpen(true);
    }, []);

    const handleDelete = useCallback(() => {
        if (!unitToDelete) return;

        inertiaDelete(route("units.destroy", unitToDelete.id), {
            onSuccess: () => {
                toast({
                    title: "Berhasil dihapus!",
                    description: "Satuan telah berhasil dihapus.",
                    variant: "success",
                });
                setIsDeleteModalOpen(false);
                setUnitToDelete(null);
            },
            onError: (errors) => {
                toast({
                    title: "Gagal menghapus!",
                    description:
                        errors.message ||
                        "Terjadi kesalahan saat menghapus satuan.", // ✅ Fixed: satuan instead of kategori
                    variant: "destructive",
                });
                setIsDeleteModalOpen(false);
                setUnitToDelete(null);
            },
        });
    }, [unitToDelete, inertiaDelete]);

    const applyFilter = useCallback(() => {
        const formatted = selectedDate
            ? dayjs(selectedDate).format("DD-MM-YYYY")
            : undefined;
        router.get(
            route("units.index"),
            {
                created_date: formatted,
                search: searchQuery || undefined,
                per_page: perPage,
                sort_by: sortBy,
                sort_direction: sortDirection,
            },
            {
                preserveState: true,
                replace: true,
            }
        );
    }, [selectedDate, searchQuery, perPage, sortBy, sortDirection]);

    const resetFilter = useCallback(() => {
        setSelectedDate(null);
        setSearchQuery("");
        setPerPage("10");
        setSortBy("created_at");
        setSortDirection("desc");
        router.get(
            route("units.index"),
            {},
            { preserveState: true, replace: true }
        );
    }, []);

    const handleSort = (column) => {
        const direction =
            sortBy === column && sortDirection === "asc" ? "desc" : "asc";
        setSortBy(column);
        setSortDirection(direction);

        router.get(
            route("units.index"),
            {
                ...filters,
                sort_by: column,
                sort_direction: direction,
            },
            {
                preserveScroll: true,
                preserveState: true,
            }
        );
    };

    const handleApplyFilter = () => {
        // Cancel debounced calls and apply immediately
        debouncedApplyFilter.cancel();
        applyFilter();
    };

    const getSortIcon = (column) => {
        if (sortBy === column) {
            return sortDirection === "asc" ? (
                <ArrowUpNarrowWide className="h-4 w-4 ml-1" />
            ) : (
                <ArrowDownWideNarrow className="h-4 w-4 ml-1" />
            );
        }
        return <ArrowUpDown className="h-4 w-4 ml-1 " />;
    };

    const handleBulkDelete = () => {
        router.post(
            route("units.bulk-delete"),
            { ids: selectedIds },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setSelectedIds([]);
                    toast({
                        title: "Berhasil dihapus!",
                        description: `${selectedIds.length} Satuan berhasil dihapus.`,
                        variant: "success",
                    });
                    setIsBulkDeleteOpen(false);
                },
                onError: () => {
                    toast({
                        title: "Gagal menghapus!",
                        description:
                            "Terjadi kesalahan saat menghapus Satuan terpilih.",
                        variant: "destructive",
                    });
                    setIsBulkDeleteOpen(false);
                },
            }
        );
    };

    return (
        <Layout user={auth.user}>
            <Head title="Satuan" />
            <div className="container max-w-6xl mx-auto px-4 py-8">
                <Card className="shadow-lg border-none rounded-xl">
                    <CardHeader className="pb-4 border-b">
                        <Card className="relative w-full p-6 bg-orange-600 overflow-hidden rounded-xl">
                            <Combine className="absolute right-4 bottom-[-100px] text-white opacity-10 w-80 h-80 z-0" />

                            <div className="flex gap-4 items-center z-10">
                                <Combine className="text-white w-14 h-14" />
                                <div>
                                    <CardTitle className="text-3xl md:text-4xl text-white font-bold tracking-tight">
                                        Daftar Satuan
                                    </CardTitle>
                                    <CardDescription className="text-md text-white mt-1">
                                        Kelola satuan produk Anda dengan mudah.
                                    </CardDescription>
                                </div>
                            </div>

                            {(auth.user.roles.includes("admin") ||
                                auth.user.roles.includes("manager")) && (
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 z-20">
                                    <Button
                                        onClick={() => setIsUnitOpen(true)}
                                        className="flex items-center gap-2 bg-white text-orange-600 hover:bg-gray-100 shadow-md transition-all duration-200 text-base py-2 px-6 rounded-lg"
                                    >
                                        <PlusCircle className="h-5 w-5" />
                                        Tambah Satuan
                                    </Button>
                                </div>
                            )}
                        </Card>
                    </CardHeader>

                    <CardContent className="space-y-6 pt-6">
                        {/* Filter & Search Section */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4 border rounded-lg shadow-sm">
                            {/* Search Input */}
                            <div className="flex flex-col gap-2">
                                <label
                                    htmlFor="search-input"
                                    className="text-sm font-medium "
                                >
                                    Cari Satuan
                                </label>
                                <div className="relative">
                                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 " />
                                    <Input
                                        id="search-input"
                                        type="text"
                                        placeholder="Nama satuan..." // ✅ Fixed: satuan instead of kategori
                                        value={searchQuery}
                                        onChange={(e) =>
                                            setSearchQuery(e.target.value)
                                        }
                                        className="pl-9 pr-3 py-2 duration-200 rounded-md"
                                    />
                                </div>
                            </div>

                            {/* Date Filter */}
                            <div className="flex flex-col gap-2">
                                <label
                                    htmlFor="date-filter"
                                    className="text-sm font-medium "
                                >
                                    Tanggal Dibuat
                                </label>
                                <DatePicker
                                    id="date-filter"
                                    value={selectedDate}
                                    onChange={setSelectedDate}
                                />
                            </div>

                            {/* Per Page Selector */}
                            <div className="flex flex-col gap-2">
                                <label
                                    htmlFor="per-page-select"
                                    className="text-sm font-medium "
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
                            <div className="col-span-full flex justify-end gap-3 mt-2 pt-4 border-t ">
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
                                    className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md shadow-sm"
                                >
                                    Terapkan Filter
                                </Button>
                            </div>
                        </div>

                        <Separator className="my-6" />

                        {/* Table Section */}
                        <div className="rounded-lg border overflow-hidden shadow-sm">
                            <Table className="min-w-full divide-y divide-gray-200">
                                <TableHeader className="bg-orange-600">
                                    <TableRow>
                                        {/* CheckBox */}
                                        <TableHead>
                                            <Checkbox
                                                checked={
                                                    selectedIds.length ===
                                                    units.data.length
                                                }
                                                onCheckedChange={(checked) => {
                                                    if (checked) {
                                                        setSelectedIds(
                                                            units.data.map(
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
                                        {/* Kolom Nama */}
                                        <TableHead
                                            className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer transition-colors duration-200"
                                            onClick={() => handleSort("name")}
                                        >
                                            <div className="flex items-center">
                                                Nama {getSortIcon("name")}
                                            </div>
                                        </TableHead>
                                        {/* Kolom Simbol */}
                                        <TableHead className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                            Simbol
                                        </TableHead>
                                        {/* Kolom Deskripsi */}
                                        <TableHead className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                            Deskripsi
                                        </TableHead>
                                        {/* Kolom Tanggal Dibuat */}
                                        <TableHead
                                            className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer transition-colors duration-200"
                                            onClick={() =>
                                                handleSort("created_at")
                                            }
                                        >
                                            <div className="flex items-center">
                                                Dibuat{" "}
                                                {getSortIcon("created_at")}
                                            </div>
                                        </TableHead>
                                        {/* Kolom Aksi */}
                                        <TableHead className="px-6 py-3 text-center text-xs font-semibold text-white uppercase tracking-wider">
                                            Aksi
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody className="divide-y">
                                    {units.data.length > 0 ? (
                                        units.data.map((unit) => (
                                            <TableRow
                                                key={unit.id}
                                                className="hover:bg-gray-50 transition-colors duration-150"
                                            >
                                                <TableCell>
                                                    <Checkbox
                                                        checked={selectedIds.includes(
                                                            unit.id
                                                        )}
                                                        onCheckedChange={(
                                                            checked
                                                        ) => {
                                                            if (checked) {
                                                                setSelectedIds([
                                                                    ...selectedIds,
                                                                    unit.id,
                                                                ]);
                                                            } else {
                                                                setSelectedIds(
                                                                    selectedIds.filter(
                                                                        (id) =>
                                                                            id !==
                                                                            unit.id
                                                                    )
                                                                );
                                                            }
                                                        }}
                                                    />
                                                </TableCell>
                                                <TableCell className="px-6 py-4 whitespace-nowrap text-sm ">
                                                    {unit.name}
                                                </TableCell>
                                                <TableCell className="px-6 py-4 whitespace-nowrap text-sm ">
                                                    {unit.symbol}
                                                </TableCell>
                                                <TableCell className="px-6 py-4 text-sm ">
                                                    {unit.description || "-"}
                                                </TableCell>
                                                <TableCell className="px-6 py-4 whitespace-nowrap text-sm ">
                                                    {/* ✅ Fixed: Use created_at instead of unit_date */}
                                                    {dayjs(
                                                        unit.created_at
                                                    ).format("DD MMM YYYY")}
                                                </TableCell>
                                                <TableCell className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2">
                                                    {(auth.user.roles.includes(
                                                        "admin"
                                                    ) ||
                                                        auth.user.roles.includes(
                                                            "manager"
                                                        )) && (
                                                        <Button
                                                            size="icon"
                                                            className="bg-[#00d380] hover:bg-[#00b06b] text-white rounded-md"
                                                            title="Edit Satuan"
                                                            onClick={() => {
                                                                openEditUnitModal(
                                                                    unit
                                                                );
                                                            }}
                                                        >
                                                            <SquarePen className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    {auth.user.roles.includes(
                                                        "admin"
                                                    ) && (
                                                        <Button
                                                            size="icon"
                                                            variant="destructive"
                                                            onClick={() =>
                                                                handleConfirmDelete(
                                                                    unit
                                                                )
                                                            }
                                                            className="rounded-md"
                                                            title="Hapus Satuan"
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
                                                colSpan={6}
                                                className="text-center py-10 text-lg text-gray-500"
                                            >
                                                {/* ✅ Fixed: satuan instead of kategori */}
                                                Tidak ada satuan ditemukan.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                        <p className="text-sm text-end">
                            Menampilkan {units.from} - {units.to} dari{" "}
                            {units.total} data
                        </p>

                        {/* Pagination Section */}
                        {units.links && units.links.length > 3 && (
                            <div className="flex justify-center mt-6">
                                <Pagination>
                                    <PaginationContent>
                                        {units.links.map((link, index) => {
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
                                                                    ? "opacity-50 cursor-not-allowed "
                                                                    : "text-[#035864] hover:bg-[#e0f2f4]"
                                                            }
                                                            onClick={(e) => {
                                                                if (!link.url)
                                                                    e.preventDefault();
                                                                else
                                                                    router.get(
                                                                        link.url,
                                                                        {},
                                                                        {
                                                                            preserveState: true,
                                                                            replace: true,
                                                                        }
                                                                    );
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
                                                                    ? "opacity-50 cursor-not-allowed "
                                                                    : "text-[#035864] hover:text-[#035864] hover:bg-[#e0f2f4]"
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
                                                                    ? "opacity-50 cursor-not-allowed "
                                                                    : link.active
                                                                    ? "bg-[#035864] text-white hover:text-white hover:bg-[#024a54]"
                                                                    : "text-[#035864] hover:text-[#035864] hover:bg-[#e0f2f4]"
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

            {/* Modals */}
            <Dialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Konfirmasi Hapus</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus{" "}
                            <b>{selectedIds.length}</b> satuan terpilih?{" "}
                            {/* ✅ Fixed: satuan instead of kategori */}
                            <br />
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

            <Dialog open={isUnitOpen} onOpenChange={setIsUnitOpen}>
                <DialogContent className="max-w-lg">
                    <DialogTitle>Tambah Satuan</DialogTitle>
                    <DialogDescription>
                        Isi data satuan baru untuk digunakan pada produk Anda.
                        {/* ✅ Fixed: satuan instead of kategori */}
                    </DialogDescription>
                    <Create onClose={() => setIsUnitOpen(false)} />
                </DialogContent>
            </Dialog>

            <Dialog open={isEditUnitOpen} onOpenChange={setIsEditUnitOpen}>
                <DialogContent className="max-w-lg">
                    <DialogTitle>Edit Satuan</DialogTitle>
                    <DialogDescription>
                        Edit data satuan untuk digunakan pada produk Anda.
                        {/* ✅ Fixed: satuan instead of kategori */}
                    </DialogDescription>
                    {selectedUnit && (
                        <Edit
                            unit={selectedUnit}
                            onClose={() => setIsEditUnitOpen(false)}
                        />
                    )}
                </DialogContent>
            </Dialog>

            <Dialog
                open={isDeleteModalOpen}
                onOpenChange={setIsDeleteModalOpen}
            >
                <DialogContent className="sm:max-w-md p-6 rounded-lg shadow-lg">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-[#035864]">
                            Konfirmasi Hapus Satuan
                        </DialogTitle>
                        <DialogDescription className="text-gray-600">
                            Anda yakin ingin menghapus satuan "
                            {/* ✅ Fixed: satuan instead of kategori */}
                            <span className="font-semibold text-red-600">
                                {unitToDelete?.name}
                            </span>
                            "? Tindakan ini tidak dapat dibatalkan dan akan
                            menghapus data satuan secara permanen.
                            {/* ✅ Fixed: satuan instead of kategori */}
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
