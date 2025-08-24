// resources/js/Pages/Dashboard.jsx
import React from "react";
import Chart from "@/components/chart";
import DatePicker from "@/components/DatePicker";
import Layout from "@/Layouts/Layout";
import RecentSales from "@/components/RecentSales";
import SummaryCard from "@/components/SummaryCard";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    AlertTriangle,
    PackageOpen,
    ShoppingCart,
    Filter,
    Boxes,
} from "lucide-react";
import TabelPersediaan from "@/components/TabelPersediaan";
import TabelPergerakanBarang from "@/components/TabelPergerakanBarang";
import EOQReminder from "@/components/EOQReminder";
import GrafikPerbandinganEOQ from "../components/GrafikPerbandinganEOQ";
import GrafikTrenStok from "@/components/GrafikTrenStok";
import { usePage } from "@inertiajs/react";
import GrafikPemakaianBarang from "@/components/GrafikPemakaianBarang";
import GrafikPembelianBarang from "@/components/GrafikPembelianBarang";

function Dashboard() {
    // ✅ AMBIL DATA DARI INERTIA PROPS
    const { props } = usePage();
    const { eoqReminderData = [], summaryData = {}, auth, userRole } = props;

    // Dynamic summary data berdasarkan role dan data real
    const summaryCards = [
        {
            title: "Total Barang di Gudang",
            icon: Boxes,
            value: `${summaryData.totalProducts || 0} Jenis Barang`,
            iconColor: "text-indigo-600",
            bgColor: "bg-indigo-100",
        },
        {
            title: "Barang Hampir Habis",
            icon: AlertTriangle,
            value: `${summaryData.lowStockCount || 0} Item`,
            iconColor: "text-red-600",
            bgColor: "bg-red-100",
        },
        {
            title: "Total Pemakaian Bulan Ini",
            icon: PackageOpen,
            value: `${summaryData.monthlyUsage || 0} pcs`,
            iconColor: "text-yellow-600",
            bgColor: "bg-yellow-100",
        },
        {
            title: "Total Pembelian Bulan Ini",
            icon: ShoppingCart,
            value: `Rp ${(summaryData.monthlyPurchases || 0).toLocaleString(
                "id-ID"
            )}`,
            iconColor: "text-green-600",
            bgColor: "bg-green-100",
        },
    ];

    return (
        <Layout>
            <div className="flex items-end justify-between mb-7">
                <h1 className="text-3xl font-bold">Dashboard</h1>
                <div className="text-sm text-gray-500">
                    Selamat datang, {auth.user.name} ({userRole})
                </div>
            </div>

            <div className="flex flex-col gap-4">
                <Card className="bg-indigo-700 relative overflow-hidden">
                    <div className="flex items-center justify-between px-6 py-4 relative z-10">
                        <CardHeader className="text-white p-0">
                            <CardTitle className="text-3xl font-bold">
                                Sistem Informasi Stok
                            </CardTitle>
                            <CardDescription className="text-white text-sm mt-1">
                                Kelola stok barang secara efisien dengan
                                perhitungan ROP & EOQ otomatis.
                            </CardDescription>
                        </CardHeader>
                        <Boxes className="text-white w-12 h-12 z-20" />
                    </div>
                    <Boxes className="absolute right-4 bottom-[-100px] text-white opacity-10 w-80 h-80 z-0" />
                </Card>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {summaryCards.map((item) => (
                        <SummaryCard
                            key={item.title}
                            title={item.title}
                            icon={item.icon}
                            value={item.value}
                            iconColor={item.iconColor}
                            bgColor={item.bgColor}
                        />
                    ))}
                </div>
            </div>

            <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* ✅ PASS DATA DARI PROPS */}
                <div className="col-span-full">
                    <EOQReminder data={eoqReminderData} />
                </div>

                <GrafikPemakaianBarang />
                <GrafikPembelianBarang />
                <GrafikPerbandinganEOQ />
                <GrafikTrenStok />
                <TabelPersediaan />
                <TabelPergerakanBarang />
            </div>
        </Layout>
    );
}

export default Dashboard;
