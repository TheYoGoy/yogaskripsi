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
import dayjs from "dayjs"; // Import dayjs for date formatting
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationPrevious,
    PaginationNext,
    PaginationEllipsis,
} from "@/Components/ui/pagination";
import { Card } from "@/Components/ui/card"; // Import Shadcn Card component

// Helper function to decode HTML entities in labels (e.g., &laquo; Previous)
const getLabelString = (label) => {
    const doc = new DOMParser().parseFromString(label, "text/html");
    return doc.documentElement.textContent;
};

export default function PurchaseTransactionIndex({
    auth,
    purchaseTransactions,
    flash,
}) {
    // Initialize useForm for delete operation
    const { delete: inertiaDelete } = useForm();
    // State to hold the search query input by the user
    const [searchQuery, setSearchQuery] = useState("");
    // State to hold the selected date for filtering
    const [selectedDate, setSelectedDate] = useState(null);

    // --- DEBUGGING LOGS ---
    // Ini akan membantu Anda melihat struktur data purchaseTransactions
    console.log("purchaseTransactions prop received:", purchaseTransactions);
    console.log("purchaseTransactions.links:", purchaseTransactions?.links);
    console.log(
        "purchaseTransactions.links.length:",
        purchaseTransactions?.links?.length
    );
    // --- END DEBUGGING LOGS ---

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

    // Function to handle purchase transaction deletion
    const handleDelete = (transactionId) => {
        inertiaDelete(route("purchase-transactions.destroy", transactionId), {
            onSuccess: () => {
                // Show success toast after successful deletion
                toast({
                    title: "Berhasil dihapus!",
                    description: "Transaksi pembelian telah berhasil dihapus.",
                    variant: "success",
                });
            },
            onError: (errors) => {
                // Show error toast if deletion fails
                toast({
                    title: "Gagal menghapus!",
                    description:
                        errors.message ||
                        "Terjadi kesalahan saat menghapus transaksi pembelian.",
                    variant: "destructive",
                });
            },
        });
    };

    // Function to apply search and date filters
    const applyFilters = () => {
        router.get(
            route("purchase-transactions.index"),
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
            route("purchase-transactions.index"),
            {},
            { preserveState: true, replace: true }
        );
    };

    // Function to handle pagination link clicks
    const handlePaginationClick = (e, url) => {
        e.preventDefault(); // Prevent default link behavior
        if (url) {
            router.get(
                url,
                {},
                {
                    preserveState: true, // Keep existing form data and scroll position
                    replace: true, // Replace history entry
                }
            );
        }
    };

    return (
        <Layout
            user={auth.user}
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Manajemen Transaksi Pembelian
                </h2>
            }
        >
            <Head title="Purchase Transactions" />
            <Card className="p-8">
                {/* Header Title and Date Filter Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-7 gap-4">
                    <h1 className="text-3xl font-bold">
                        Daftar Transaksi Pembelian
                    </h1>
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

                {/* Action Button (Catat Pembelian Baru) and Search Bar Section */}
                <div className="flex flex-col md:flex-row justify-between mb-5 items-center gap-4">
                    {/* "Catat Pembelian Baru" button, visible only for admin or staff roles */}
                    {(auth.user.role === "admin" ||
                        auth.user.role === "staff") && (
                        <Link href={route("purchase-transactions.create")}>
                            <Button className="gap-2 w-full md:w-auto">
                                <PlusCircle className="h-4 w-4" /> Catat
                                Pembelian Baru
                            </Button>
                        </Link>
                    )}
                    {/* Search Input Bar */}
                    <div className="w-full md:w-fit flex justify-end">
                        <Input
                            type="text"
                            placeholder="Cari berdasarkan nama produk atau supplier..."
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
                                <TableHead className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                                    Supplier
                                </TableHead>
                                <TableHead className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">
                                    Kuantitas
                                </TableHead>
                                <TableHead className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">
                                    Harga/Unit
                                </TableHead>
                                <TableHead className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">
                                    Total Harga
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
                            {/* Conditional rendering based on whether purchaseTransactions data exists */}
                            {purchaseTransactions.data.length > 0 ? (
                                purchaseTransactions.data.map((transaction) => (
                                    <TableRow
                                        key={transaction.id}
                                        className="hover:bg-gray-50"
                                    >
                                        <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {transaction.product.name}
                                        </TableCell>
                                        <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {transaction.supplier.name}
                                        </TableCell>
                                        <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700">
                                            {transaction.quantity}
                                        </TableCell>
                                        <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700">
                                            Rp{" "}
                                            {parseFloat(
                                                transaction.price_per_unit
                                            ).toLocaleString("id-ID")}
                                        </TableCell>
                                        <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700">
                                            Rp{" "}
                                            {parseFloat(
                                                transaction.total_price
                                            ).toLocaleString("id-ID")}
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
                                            {/* Only admin can delete purchase transactions */}
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
                                                                Hapus Transaksi
                                                                Pembelian?
                                                            </DialogTitle>
                                                            <DialogDescription>
                                                                Tindakan ini
                                                                tidak dapat
                                                                dibatalkan dan
                                                                akan menghapus
                                                                transaksi
                                                                pembelian secara
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
                                                                variant="destructive"
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
                                // Message when no purchase transactions are found
                                <TableRow>
                                    <TableCell
                                        colSpan={8} // Adjusted colspan to match number of columns
                                        className="text-center py-10 text-lg text-gray-500"
                                    >
                                        Tidak ada transaksi pembelian ditemukan.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination Section (below the table) */}
                {/* Only render pagination if there are links and more than 1 (meaning more than just current page) */}
                {purchaseTransactions.links &&
                    purchaseTransactions.links.length > 1 && ( // Changed from > 3 to > 1 to always show if there's more than one page
                        <div className="flex justify-center mt-6">
                            <Pagination>
                                <PaginationContent>
                                    {purchaseTransactions.links.map(
                                        (link, index) => {
                                            const label = getLabelString(
                                                link.label
                                            ); // Use helper function
                                            const isPrevious =
                                                label.includes("Previous") ||
                                                label.includes(
                                                    "pagination.previous"
                                                );
                                            const isNext =
                                                label.includes("Next") ||
                                                label.includes(
                                                    "pagination.next"
                                                );
                                            const isEllipsis =
                                                label.includes("...");

                                            // Render PaginationPrevious for "Previous" link
                                            if (isPrevious) {
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
                                                            onClick={(e) =>
                                                                handlePaginationClick(
                                                                    e,
                                                                    link.url
                                                                )
                                                            }
                                                        />
                                                    </PaginationItem>
                                                );
                                            }

                                            // Render PaginationNext for "Next" link
                                            if (isNext) {
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
                                                            onClick={(e) =>
                                                                handlePaginationClick(
                                                                    e,
                                                                    link.url
                                                                )
                                                            }
                                                        />
                                                    </PaginationItem>
                                                );
                                            }

                                            // Render ellipsis (...)
                                            if (isEllipsis) {
                                                return (
                                                    <PaginationItem key={index}>
                                                        <PaginationEllipsis className="text-gray-500" />
                                                    </PaginationItem>
                                                );
                                            }

                                            // Render standard PaginationLink for page numbers
                                            return (
                                                <PaginationItem key={index}>
                                                    <PaginationLink
                                                        href={link.url || "#"}
                                                        isActive={link.active}
                                                        className={
                                                            !link.url
                                                                ? "opacity-50 cursor-not-allowed text-gray-400"
                                                                : link.active
                                                                ? "bg-[#035864] text-white hover:bg-[#024a54]"
                                                                : "text-[#035864] hover:bg-[#e0f2f4]"
                                                        }
                                                        onClick={(e) =>
                                                            handlePaginationClick(
                                                                e,
                                                                link.url
                                                            )
                                                        }
                                                    >
                                                        {label}
                                                    </PaginationLink>
                                                </PaginationItem>
                                            );
                                        }
                                    )}
                                </PaginationContent>
                            </Pagination>
                        </div>
                    )}
            </Card>
        </Layout>
    );
}
