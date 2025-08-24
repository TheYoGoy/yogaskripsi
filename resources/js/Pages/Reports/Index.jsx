import Layout from "@/Layouts/Layout";
import { Head, Link } from "@inertiajs/react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import {
    ArrowRight,
    Package,
    Repeat,
    ShoppingCart,
    ScrollText,
    Truck,
    BarChart3,
    AlertCircle,
} from "lucide-react";
import { usePage } from "@inertiajs/react";

export default function ReportIndex({ auth }) {
    const { settings } = usePage().props;

    return (
        <Layout user={auth.user}>
            <Head title="Laporan" />
            <div className="container mx-auto px-4 py-8">
                <Card className="shadow-lg border-none animate-in fade-in-0 slide-in-from-top-2 after:duration-500 rounded-xl">
                    <CardHeader className="pb-4 border-b">
                        <Card className="relative w-full p-6 bg-violet-900 overflow-hidden rounded-xl">
                            {/* Ikon background dekoratif */}
                            <BarChart3 className="absolute right-4 bottom-[-100px] text-white opacity-10 w-80 h-80 z-0" />

                            {/* Judul & Deskripsi */}
                            <div className="flex gap-4 items-center z-10">
                                <BarChart3 className="text-white w-14 h-14" />
                                <div>
                                    <CardTitle className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
                                        Laporan Tersedia
                                    </CardTitle>
                                    <CardDescription className="text-md text-white mt-1">
                                        Pilih laporan di bawah untuk melihat
                                        wawasan dan data terperinci.
                                    </CardDescription>
                                </div>
                            </div>
                        </Card>
                    </CardHeader>

                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Stock Report Card */}
                            <Card className="flex flex-col justify-between h-full border-2 border-gray-100 hover:border-[#035864] transition-all duration-300 shadow-md hover:shadow-lg rounded-lg">
                                <CardHeader className="pb-4">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Package className="h-8 w-8 text-[#035864]" />
                                        <CardTitle className="text-2xl font-bold ">
                                            Laporan Stok
                                        </CardTitle>
                                    </div>
                                    <CardDescription className="text-base ">
                                        Lihat tingkat stok saat ini untuk semua
                                        produk.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="pt-4">
                                    <Link href={route("reports.stock")}>
                                        <Button className="w-full text-lg py-6 rounded-lg bg-[#035864] hover:bg-[#024a54] text-white shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center">
                                            Lihat Laporan
                                            <ArrowRight className="ml-2 h-5 w-5" />
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>

                            {/* Stock Mutation Report Card */}
                            <Card className="flex flex-col justify-between h-full border-2 border-gray-100 hover:border-green-500 transition-all duration-300 shadow-md hover:shadow-lg rounded-lg">
                                <CardHeader className="pb-4">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Repeat className="h-8 w-8 text-green-600" />
                                        <CardTitle className="text-2xl font-bold ">
                                            Laporan Mutasi Stok
                                        </CardTitle>
                                    </div>
                                    <CardDescription className="text-base ">
                                        Lacak semua pergerakan stok masuk dan
                                        keluar dari waktu ke waktu.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="pt-4">
                                    <Link href={route("reports.mutation")}>
                                        <Button className="w-full text-lg py-6 rounded-lg bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center">
                                            Lihat Laporan
                                            <ArrowRight className="ml-2 h-5 w-5" />
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>

                            {/* Purchase History Report Card */}
                            <Card className="flex flex-col justify-between h-full border-2 border-gray-100 hover:border-purple-500 transition-all duration-300 shadow-md hover:shadow-lg rounded-lg">
                                <CardHeader className="pb-4">
                                    <div className="flex items-center gap-3 mb-2">
                                        <ShoppingCart className="h-8 w-8 text-purple-600" />
                                        <CardTitle className="text-2xl font-bold ">
                                            Laporan Riwayat Pembelian
                                        </CardTitle>
                                    </div>
                                    <CardDescription className="text-base ">
                                        Tinjau transaksi pembelian sebelumnya
                                        secara terperinci.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="pt-4">
                                    <Link
                                        href={route("reports.purchase-history")}
                                    >
                                        <Button className="w-full text-lg py-6 rounded-lg bg-purple-600 hover:bg-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center">
                                            Lihat Laporan
                                            <ArrowRight className="ml-2 h-5 w-5" />
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>

                            {/* Supplier Report Card */}
                            <Card className="flex flex-col justify-between h-full border-2 border-gray-100 hover:border-yellow-500 transition-all duration-300 shadow-md hover:shadow-lg rounded-lg">
                                <CardHeader className="pb-4">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Truck className="h-8 w-8 text-yellow-600" />
                                        <CardTitle className="text-2xl font-bold ">
                                            Laporan Pemasok
                                        </CardTitle>
                                    </div>
                                    <CardDescription className="text-base ">
                                        Lihat dan analisis aktivitas serta
                                        transaksi pemasok Anda.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="pt-4">
                                    <Link href={route("reports.suppliers")}>
                                        <Button className="w-full text-lg py-6 rounded-lg bg-yellow-600 hover:bg-yellow-700 text-white shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center">
                                            Lihat Laporan
                                            <ArrowRight className="ml-2 h-5 w-5" />
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>

                            {/* ✅ FIXED: Sales Report Card - Changed route from reports.sales to reports.sales-history */}
                            <Card className="flex flex-col justify-between h-full border-2 border-gray-100 hover:border-red-500 transition-all duration-300 shadow-md hover:shadow-lg rounded-lg">
                                <CardHeader className="pb-4">
                                    <div className="flex items-center gap-3 mb-2">
                                        <ScrollText className="h-8 w-8 text-red-600" />
                                        <CardTitle className="text-2xl font-bold ">
                                            Laporan Penjualan
                                        </CardTitle>
                                    </div>
                                    <CardDescription className="text-base ">
                                        Analisis transaksi penjualan dan tren
                                        kinerja.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="pt-4">
                                    <Link href={route("reports.sales-history")}>
                                        <Button className="w-full text-lg py-6 rounded-lg bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center">
                                            Lihat Laporan
                                            <ArrowRight className="ml-2 h-5 w-5" />
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>

                            {/* Minimum Stock Report Card */}
                            <Card className="flex flex-col justify-between h-full border-2 border-gray-100 hover:border-pink-500 transition-all duration-300 shadow-md hover:shadow-lg rounded-lg">
                                <CardHeader className="pb-4">
                                    <div className="flex items-center gap-3 mb-2">
                                        <AlertCircle className="h-8 w-8 text-pink-600" />
                                        <CardTitle className="text-2xl font-bold ">
                                            Laporan Stok Minimum
                                        </CardTitle>
                                    </div>
                                    <CardDescription className="text-base ">
                                        Pantau produk dengan tingkat stok rendah
                                        yang memerlukan pemesanan ulang.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="pt-4">
                                    <Link href={route("reports.minimum-stock")}>
                                        <Button className="w-full text-lg py-6 rounded-lg bg-pink-600 hover:bg-pink-700 text-white shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center">
                                            Lihat Laporan
                                            <ArrowRight className="ml-2 h-5 w-5" />
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
}
