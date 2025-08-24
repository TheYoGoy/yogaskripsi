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
import { Input } from "@/Components/ui/input";
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
    Trash2,
    PlusCircle,
    SearchIcon,
    RotateCcw,
    UserCircle,
    SquarePen,
    Shield,
    Users,
} from "lucide-react";
import Layout from "@/Layouts/Layout";
import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
    SelectValue,
} from "@/Components/ui/select";
import { usePage } from "@inertiajs/react";
import { debounce } from "lodash";

export default function UserIndex({ auth, users, flash, filters = {} }) {
    const { settings } = usePage().props;

    // ✅ FIXED: Initialize useForm for delete operation
    const { delete: inertiaDelete, processing } = useForm();

    // ✅ FIXED: Initialize state with proper defaults
    const [searchQuery, setSearchQuery] = useState(filters.search || "");
    const [perPage, setPerPage] = useState(filters.per_page || "10");

    // ✅ FIXED: Toast notifications
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

    // ✅ FIXED: Apply filters function
    const applyFilters = useCallback(() => {
        router.get(
            route("users.index"),
            {
                search: searchQuery || undefined,
                per_page: perPage,
                page: 1,
            },
            { preserveState: true, replace: true }
        );
    }, [searchQuery, perPage]);

    // ✅ FIXED: Debounced search
    const debouncedApplyFilters = useMemo(
        () => debounce(applyFilters, 500),
        [applyFilters]
    );

    // ✅ FIXED: Handle search query changes
    useEffect(() => {
        if (searchQuery !== filters.search) {
            debouncedApplyFilters();
        }
        return () => {
            debouncedApplyFilters.cancel();
        };
    }, [searchQuery, debouncedApplyFilters, filters.search]);

    // ✅ FIXED: Handle per page changes
    useEffect(() => {
        if (perPage !== filters.per_page) {
            applyFilters();
        }
    }, [perPage, applyFilters, filters.per_page]);

    // ✅ FIXED: Reset filters
    const resetFilters = useCallback(() => {
        setSearchQuery("");
        setPerPage("10");
        router.get(
            route("users.index"),
            {},
            { preserveState: true, replace: true }
        );
    }, []);

    // ✅ FIXED: Delete modal state
    const [userToDelete, setUserToDelete] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    // ✅ FIXED: Confirm delete
    const handleConfirmDelete = useCallback((user) => {
        setUserToDelete(user);
        setIsDeleteModalOpen(true);
    }, []);

    // ✅ FIXED: Handle delete with better error handling
    const handleDelete = useCallback(() => {
        if (!userToDelete) return;

        inertiaDelete(route("users.destroy", userToDelete.id), {
            onSuccess: () => {
                toast({
                    title: "Berhasil dihapus!",
                    description: "Pengguna telah berhasil dihapus.",
                    variant: "success",
                });
                setIsDeleteModalOpen(false);
                setUserToDelete(null);
            },
            onError: (errors) => {
                const errorMessage =
                    errors.message ||
                    Object.values(errors)[0] ||
                    "Terjadi kesalahan saat menghapus pengguna.";

                toast({
                    title: "Gagal menghapus!",
                    description: errorMessage,
                    variant: "destructive",
                });
                setIsDeleteModalOpen(false);
                setUserToDelete(null);
            },
        });
    }, [userToDelete, inertiaDelete]);

    // ✅ FIXED: Helper function for pagination labels
    const getLabelString = (label) => {
        const doc = new DOMParser().parseFromString(label, "text/html");
        return doc.documentElement.textContent;
    };

    // ✅ FIXED: Check if user can manage users
    const canManageUsers = () => {
        return auth.user?.roles?.includes("admin") || false;
    };

    // ✅ FIXED: Format user roles display
    const formatUserRoles = (roles) => {
        if (!roles || !Array.isArray(roles)) return "-";
        return roles
            .map((role) => role.charAt(0).toUpperCase() + role.slice(1))
            .join(", ");
    };

    // ✅ FIXED: Get role badge color
    const getRoleBadgeColor = (roles) => {
        if (!roles || !Array.isArray(roles)) return "bg-gray-100 text-gray-800";

        if (roles.includes("admin")) return "bg-red-100 text-red-800";
        if (roles.includes("manager")) return "bg-blue-100 text-blue-800";
        return "bg-green-100 text-green-800";
    };

    return (
        <Layout user={auth.user}>
            <Head title="Pengguna" />
            <div className="container max-w-6xl mx-auto px-4 py-8">
                <Card className="shadow-lg border-none rounded-xl">
                    <CardHeader className="pb-4 border-b">
                        <Card className="relative w-full p-6 bg-blue-700 overflow-hidden rounded-xl">
                            {/* Background decoration */}
                            <UserCircle className="absolute right-4 bottom-[-100px] text-white opacity-10 w-80 h-80 z-0" />

                            {/* Title & Description */}
                            <div className="flex gap-4 items-center z-10">
                                <UserCircle className="text-white w-14 h-14" />
                                <div>
                                    <CardTitle className="text-3xl md:text-4xl font-bold tracking-tight text-white">
                                        Daftar Pengguna
                                    </CardTitle>
                                    <CardDescription className="text-md text-white mt-1">
                                        Kelola akun pengguna aplikasi Anda.
                                    </CardDescription>
                                </div>
                            </div>

                            {/* Add User Button */}
                            {canManageUsers() && (
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 z-20">
                                    <Link href={route("users.create")}>
                                        <Button className="flex items-center gap-2 bg-white text-[#0B63A3] hover:bg-gray-100 shadow-md transition-all duration-200 text-base py-2 px-6 rounded-lg">
                                            <PlusCircle className="h-5 w-5" />
                                            Tambah Pengguna
                                        </Button>
                                    </Link>
                                </div>
                            )}
                        </Card>
                    </CardHeader>

                    <CardContent className="space-y-6 pt-6">
                        {/* Filter & Search Section */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 border rounded-lg shadow-sm">
                            {/* Search Input */}
                            <div className="flex flex-col gap-2">
                                <label
                                    htmlFor="search-input"
                                    className="text-sm font-medium"
                                >
                                    Cari Pengguna
                                </label>
                                <div className="relative">
                                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="search-input"
                                        type="text"
                                        placeholder="Nama atau Email..."
                                        value={searchQuery}
                                        onChange={(e) =>
                                            setSearchQuery(e.target.value)
                                        }
                                        className="pl-9 pr-3 py-2 rounded-md"
                                    />
                                </div>
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

                            {/* Action Buttons */}
                            <div className="col-span-full flex justify-end gap-3 mt-2 pt-4 border-t">
                                <Button
                                    onClick={resetFilters}
                                    variant="outline"
                                    className="gap-1 shadow-sm rounded-md"
                                    disabled={processing}
                                >
                                    <RotateCcw className="h-4 w-4" />
                                    Reset Filter
                                </Button>
                            </div>
                        </div>

                        <Separator className="my-6" />

                        {/* Summary Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-2xl font-bold text-blue-600">
                                                {users.total ||
                                                    users.data.length}
                                            </div>
                                            <div className="text-sm text-blue-700">
                                                Total Pengguna
                                            </div>
                                        </div>
                                        <Users className="h-8 w-8 text-blue-500" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-2xl font-bold text-green-600">
                                                {
                                                    users.data.filter((user) =>
                                                        user.roles?.includes(
                                                            "admin"
                                                        )
                                                    ).length
                                                }
                                            </div>
                                            <div className="text-sm text-green-700">
                                                Admin
                                            </div>
                                        </div>
                                        <Shield className="h-8 w-8 text-green-500" />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-2xl font-bold text-purple-600">
                                                {users.current_page || 1}
                                            </div>
                                            <div className="text-sm text-purple-700">
                                                Halaman Saat Ini
                                            </div>
                                        </div>
                                        <UserCircle className="h-8 w-8 text-purple-500" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Table Section */}
                        <div className="rounded-lg border overflow-hidden shadow-sm">
                            <Table className="min-w-full divide-y">
                                <TableHeader className="bg-blue-700">
                                    <TableRow>
                                        <TableHead className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                            Nama
                                        </TableHead>
                                        <TableHead className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                            Email
                                        </TableHead>
                                        <TableHead className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                            Peran
                                        </TableHead>
                                        <TableHead className="px-6 py-3 text-center text-xs font-semibold text-white uppercase tracking-wider">
                                            Aksi
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody className="divide-y">
                                    {users.data.length > 0 ? (
                                        users.data.map((user) => (
                                            <TableRow
                                                key={user.id}
                                                className="hover:bg-gray-50 transition-colors duration-150"
                                            >
                                                <TableCell className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex-shrink-0 h-10 w-10">
                                                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                                <UserCircle className="h-6 w-6 text-blue-600" />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-medium">
                                                                {user.name}
                                                            </div>
                                                            {user.id ===
                                                                auth.user
                                                                    .id && (
                                                                <div className="text-xs">
                                                                    (You)
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                <TableCell className="px-6 py-4 whitespace-nowrap text-sm">
                                                    {user.email}
                                                </TableCell>

                                                <TableCell className="px-6 py-4 whitespace-nowrap">
                                                    <span
                                                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(
                                                            user.roles
                                                        )}`}
                                                    >
                                                        {formatUserRoles(
                                                            user.roles
                                                        )}
                                                    </span>
                                                </TableCell>

                                                <TableCell className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                                    <div className="flex items-center justify-center gap-2">
                                                        {/* Edit Button - Only admin can edit */}
                                                        {canManageUsers() && (
                                                            <Link
                                                                href={route(
                                                                    "users.edit",
                                                                    user.id
                                                                )}
                                                            >
                                                                <Button
                                                                    className="bg-[#00d380] hover:bg-[#00b06b] text-white rounded-md"
                                                                    size="icon"
                                                                    title="Edit Pengguna"
                                                                >
                                                                    <SquarePen className="h-4 w-4" />
                                                                </Button>
                                                            </Link>
                                                        )}

                                                        {/* Delete Button - Only admin can delete, cannot delete self */}
                                                        {canManageUsers() &&
                                                            auth.user.id !==
                                                                user.id && (
                                                                <Button
                                                                    variant="destructive"
                                                                    size="icon"
                                                                    onClick={() =>
                                                                        handleConfirmDelete(
                                                                            user
                                                                        )
                                                                    }
                                                                    className="rounded-md"
                                                                    title="Hapus Pengguna"
                                                                    disabled={
                                                                        processing
                                                                    }
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell
                                                colSpan={4}
                                                className="text-center py-10 text-lg text-gray-500"
                                            >
                                                <div className="flex flex-col items-center gap-2">
                                                    <UserCircle className="h-12 w-12 text-gray-400" />
                                                    <span>
                                                        Tidak ada pengguna
                                                        ditemukan.
                                                    </span>
                                                    {searchQuery && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={
                                                                resetFilters
                                                            }
                                                            className="mt-2"
                                                        >
                                                            Clear Filters
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        {users.links && users.links.length > 3 && (
                            <div className="flex justify-center mt-6">
                                <Pagination>
                                    <PaginationContent>
                                        {users.links.map((link, index) => {
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
                                                                    : "text-[#035864] hover:bg-[#e0f2f4]"
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
                                                                    : "text-[#035864] hover:bg-[#e0f2f4]"
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
                                                                    ? "bg-[#035864] text-white hover:bg-[#024a54]"
                                                                    : "text-[#035864] hover:bg-[#e0f2f4]"
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

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={isDeleteModalOpen}
                onOpenChange={setIsDeleteModalOpen}
            >
                <DialogContent className="sm:max-w-md p-6 rounded-lg shadow-lg">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-[#035864]">
                            Konfirmasi Hapus Pengguna
                        </DialogTitle>
                        <DialogDescription className="text-gray-600">
                            Anda yakin ingin menghapus pengguna "
                            <span className="font-semibold text-red-600">
                                {userToDelete?.name}
                            </span>
                            "? Tindakan ini tidak dapat dibatalkan dan akan
                            menghapus akun pengguna secara permanen.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex justify-end gap-2 mt-4">
                        <DialogClose asChild>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="border-gray-300 hover:bg-gray-100 rounded-md"
                                disabled={processing}
                            >
                                Batal
                            </Button>
                        </DialogClose>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={handleDelete}
                            className="bg-red-500 hover:bg-red-600 rounded-md"
                            disabled={processing}
                        >
                            {processing ? "Menghapus..." : "Hapus"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Layout>
    );
}
