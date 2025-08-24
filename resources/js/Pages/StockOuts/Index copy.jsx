import Layout from "@/Layouts/Layout";
import { Head, Link, useForm, router } from "@inertiajs/react"; // Import 'router' for Inertia navigation
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
import { useEffect, useState } from "react"; // Import useState for search and date filtering
import { Trash2, PlusCircle, FilterIcon, RotateCcw } from "lucide-react"; // Import icons
import { Input } from "@/Components/ui/input"; // Import Input component for search bar
import DatePicker from "@/Components/DatePicker"; // Import DatePicker component
import dayjs from "dayjs";
import { Card } from "@/Components/ui/card"; // Import dayjs for date formatting
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationPrevious,
    PaginationNext,
    PaginationEllipsis,
} from "@/Components/ui/pagination"; // Import Shadcn Pagination components

export default function StockOutIndex({ auth, stockOuts, flash }) {
    // Initialize useForm for delete operation
    const { delete: inertiaDelete } = useForm();
    // State to hold the search query input by the user
    const [searchQuery, setSearchQuery] = useState("");
    // State to hold the selected date for filtering
    const [selectedDate, setSelectedDate] = useState(null);

    // useEffect hook to display toast notifications for flash messages
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
    }, [flash]); // Dependency array ensures this runs when 'flash' prop changes

    // Function to handle stock out record deletion
    const handleDelete = (stockOutId) => {
        inertiaDelete(route("stock-outs.destroy", stockOutId), {
            onSuccess: () => {
                // Show success toast after successful deletion
                toast({
                    title: "Berhasil dihapus!",
                    description: "Catatan stok keluar telah berhasil dihapus.",
                    variant: "success",
                });
            },
            onError: (errors) => {
                // Show error toast if deletion fails
                toast({
                    title: "Gagal menghapus!",
                    description:
                        errors.message ||
                        "Terjadi kesalahan saat menghapus catatan stok keluar.",
                    variant: "destructive",
                });
            },
        });
    };

    // Function to apply search and date filters
    const applyFilters = () => {
        router.get(
            route("stock-outs.index"),
            {
                search: searchQuery || undefined, // Pass the search query to the backend
                transaction_date: selectedDate
                    ? dayjs(selectedDate).format("YYYY-MM-DD")
                    : undefined, // Pass formatted date to backend
            },
            { preserveState: true, replace: true } // Preserve scroll position and replace history entry
        );
    };

    // Function to reset all filters (search and date)
    const resetFilters = () => {
        setSearchQuery("");
        setSelectedDate(null);
        router.get(
            route("stock-outs.index"),
            {},
            { preserveState: true, replace: true }
        );
    };

    return (
        <Layout user={auth.user}>
            <Head title="Stock Out" />
            <Card className="p-8">
                {/* Header Title and Date Filter Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-7 gap-4">
                    <h1 className="text-3xl font-bold ">Daftar Stok Keluar</h1>
                    {/* Date Filter and related buttons */}
                    <div className="flex flex-col md:flex-row items-end gap-3">
                        <div className="flex flex-col gap-2">
                            <label
                                htmlFor="date-filter"
                                className="text-sm font-medium text-gray-700"
                            >
                                Filter Tanggal Transaksi
                            </label>
                            <DatePicker
                                id="date-filter"
                                value={selectedDate}
                                onChange={setSelectedDate}
                            />
                        </div>
                        <Button
                            onClick={applyFilters}
                            className="gap-1 mt-auto"
                        >
                            <FilterIcon className="h-4 w-4" /> Filter
                        </Button>
                        <Button
                            variant="outline"
                            onClick={resetFilters}
                            className="gap-1 mt-auto"
                        >
                            <RotateCcw className="h-4 w-4" /> Reset
                        </Button>
                    </div>
                </div>

                {/* Action Button (Catat Stok Keluar Baru) and Search Bar Section */}
                <div className="flex flex-col md:flex-row justify-between mb-5 items-center gap-4">
                    {/* "Catat Stok Keluar Baru" button, visible only for admin or staff roles */}
                    {(auth.user.role === "admin" ||
                        auth.user.role === "staff") && (
                        <Link href={route("stock-outs.create")}>
                            <Button className="gap-2 w-full md:w-auto">
                                <PlusCircle className="h-4 w-4" /> Catat Stok
                                Keluar Baru
                            </Button>
                        </Link>
                    )}
                    {/* Search Input Bar */}
                    <div className="w-full md:w-fit flex justify-end">
                        <Input
                            type="text"
                            placeholder="Cari berdasarkan nama produk atau pelanggan..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            // Trigger search when Enter key is pressed
                            onKeyPress={(e) => {
                                if (e.key === "Enter") {
                                    applyFilters(); // Call applyFilters to include search
                                }
                            }}
                            className="max-w-sm" // Limit width for better aesthetics
                        />
                    </div>
                </div>

                {/* Table Section */}
                <div className="rounded-lg border overflow-hidden">
                    <Table className="min-w-full divide-y divide-gray-200">
                        <TableHeader className="bg-[#035864]">
                            <TableRow>
                                <TableHead className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                                    Produk
                                </TableHead>
                                <TableHead className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">
                                    Kuantitas
                                </TableHead>
                                <TableHead className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                                    Pelanggan
                                </TableHead>
                                <TableHead className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                                    Tanggal Transaksi
                                </TableHead>
                                <TableHead className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                                    Dicatat Oleh
                                </TableHead>
                                <TableHead className="px-6 py-3 text-center text-xs font-medium text-white uppercase tracking-wider">
                                    Aksi
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="bg-white divide-y divide-gray-200">
                            {/* Conditional rendering based on whether stockOuts data exists */}
                            {stockOuts.data.length > 0 ? (
                                stockOuts.data.map((transaction) => (
                                    <TableRow
                                        key={transaction.id}
                                        className="hover:bg-gray-50"
                                    >
                                        <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {transaction.product.name}
                                        </TableCell>
                                        <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700">
                                            {transaction.quantity}
                                        </TableCell>
                                        <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {transaction.customer
                                                ? transaction.customer.name
                                                : "-"}
                                        </TableCell>
                                        <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {dayjs(
                                                transaction.transaction_date
                                            ).format("DD MMMM YYYY")}
                                        </TableCell>
                                        <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {transaction.user.name}
                                        </TableCell>
                                        <TableCell className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2">
                                            {/* Only admin can delete stock out records */}
                                            {auth.user.roles.includes(
                                                "admin"
                                            ) ? (
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button
                                                            className="bg-red-500"
                                                            size="sm"
                                                        >
                                                            <Trash2 className="w-4 h-4 mr-1" />{" "}
                                                            Hapus
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="sm:max-w-md">
                                                        <DialogHeader>
                                                            <DialogTitle>
                                                                Hapus Catatan
                                                                Stok Keluar?
                                                            </DialogTitle>
                                                            <DialogDescription>
                                                                Tindakan ini
                                                                tidak dapat
                                                                dibatalkan dan
                                                                akan menghapus
                                                                catatan stok
                                                                keluar secara
                                                                permanen dan
                                                                mengembalikan
                                                                kuantitas stok
                                                                untuk produk.
                                                            </DialogDescription>
                                                        </DialogHeader>
                                                        <DialogFooter className="flex justify-end gap-2 mt-4">
                                                            <DialogClose
                                                                asChild
                                                            >
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                >
                                                                    Batal
                                                                </Button>
                                                            </DialogClose>
                                                            <Button
                                                                type="button"
                                                                className="bg-[#035864]"
                                                                onClick={() =>
                                                                    handleDelete(
                                                                        transaction.id
                                                                    )
                                                                }
                                                            >
                                                                Hapus
                                                            </Button>
                                                        </DialogFooter>
                                                    </DialogContent>
                                                </Dialog>
                                            ) : null}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                // Message when no stock out transactions are found
                                <TableRow>
                                    <TableCell
                                        colSpan={6} // Adjusted colspan to match number of columns
                                        className="text-center py-10 text-lg text-gray-500"
                                    >
                                        Tidak ada catatan stok keluar ditemukan.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination Section (below the table) */}
                {/* Only render pagination if there are links and more than 3 (Previous, 1, Next) */}
                {stockOuts.links && stockOuts.links.length > 3 && (
                    <div className="flex justify-center mt-6">
                        <Pagination>
                            <PaginationContent>
                                {stockOuts.links.map((link, index) => {
                                    const isPrevious =
                                        link.label.includes("Previous");
                                    const isNext = link.label.includes("Next");
                                    const isEllipsis =
                                        link.label.includes("...");

                                    // Do not render disabled "Previous" or "Next" links if they have no URL
                                    if (link.url === null && !isEllipsis) {
                                        return null;
                                    }

                                    return (
                                        <PaginationItem key={index}>
                                            {/* Render PaginationPrevious for "Previous" link */}
                                            {isPrevious && (
                                                <PaginationPrevious
                                                    href={link.url || "#"}
                                                    className={
                                                        !link.url
                                                            ? "opacity-50 cursor-not-allowed"
                                                            : ""
                                                    }
                                                />
                                            )}
                                            {/* Render PaginationNext for "Next" link */}
                                            {isNext && (
                                                <PaginationNext
                                                    href={link.url || "#"}
                                                    className={
                                                        !link.url
                                                            ? "opacity-50 cursor-not-allowed"
                                                            : ""
                                                    }
                                                />
                                            )}
                                            {/* Render standard PaginationLink for page numbers */}
                                            {!isPrevious &&
                                                !isNext &&
                                                !isEllipsis && (
                                                    <PaginationLink
                                                        href={link.url || "#"}
                                                        isActive={link.active}
                                                        className={
                                                            !link.url
                                                                ? "opacity-50 cursor-not-allowed"
                                                                : ""
                                                        }
                                                    >
                                                        {link.label}
                                                    </PaginationLink>
                                                )}
                                            {isEllipsis && (
                                                <PaginationEllipsis />
                                            )}
                                        </PaginationItem>
                                    );
                                })}
                            </PaginationContent>
                        </Pagination>
                    </div>
                )}
            </Card>
        </Layout>
    );
}
