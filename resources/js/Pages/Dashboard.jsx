import React from "react";
import { Head, Link } from "@inertiajs/react";
import Layout from "@/Layouts/Layout";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
} from "recharts";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import SummaryCard from "@/components/SummaryCard";
import {
    AlertTriangle,
    Package,
    ShoppingCart,
    TrendingUp,
    Boxes,
    DollarSign,
    Activity,
    Bell,
    ArrowUpCircle,
    ArrowDownCircle,
    PackageOpen,
    ExternalLink,
    BarChart3,
    PieChart as PieChartIcon,
    LineChart as LineChartIcon,
} from "lucide-react";
import { usePage } from "@inertiajs/react";

// Enhanced Custom Tooltips
const CustomTooltip = ({ active, payload, label, formatter }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                <p className="font-medium text-gray-900 mb-2">{label}</p>
                {payload.map((entry, index) => (
                    <p
                        key={index}
                        className="text-sm"
                        style={{ color: entry.color }}
                    >
                        {formatter
                            ? formatter(entry)
                            : `${entry.name}: ${
                                  entry.value?.toLocaleString?.("id-ID") ||
                                  entry.value
                              }`}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

export default function Dashboard() {
    const { props } = usePage();
    const {
        eoqReminderData = [],
        summaryData = {},
        chartData = {},
        recentActivities = [],
        auth,
        userRole,
        error = null,
    } = props;

    // Format helpers
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount || 0);
    };

    const formatNumber = (num) => {
        return new Intl.NumberFormat("id-ID").format(num || 0);
    };

    // Summary Cards berdasarkan role
    const getSummaryCards = () => {
        const baseCards = [
            {
                title: "Total Barang di Gudang",
                icon: Boxes,
                value: `${formatNumber(
                    summaryData.totalProducts
                )} Jenis Barang`,
                iconColor: "text-indigo-600",
                bgColor: "bg-indigo-100",
            },
            {
                title: "Barang Hampir Habis",
                icon: AlertTriangle,
                value: `${formatNumber(summaryData.lowStockCount)} Item`,
                iconColor:
                    summaryData.lowStockCount > 0
                        ? "text-red-600"
                        : "text-green-600",
                bgColor:
                    summaryData.lowStockCount > 0
                        ? "bg-red-100"
                        : "bg-green-100",
            },
        ];

        if (userRole === "admin" || userRole === "manager") {
            return [
                ...baseCards,
                {
                    title: "Total Pembelian Bulan Ini",
                    icon: ShoppingCart,
                    value: formatCurrency(summaryData.monthlyPurchases),
                    iconColor: "text-green-600",
                    bgColor: "bg-green-100",
                },
                {
                    title: "Total Penjualan Bulan Ini",
                    icon: DollarSign,
                    value: formatCurrency(summaryData.monthlySales),
                    iconColor: "text-purple-600",
                    bgColor: "bg-purple-100",
                },
            ];
        }

        return [
            ...baseCards,
            {
                title: "Total Pemakaian Bulan Ini",
                icon: PackageOpen,
                value: `${formatNumber(summaryData.monthlyUsage)} pcs`,
                iconColor: "text-yellow-600",
                bgColor: "bg-yellow-100",
            },
            {
                title: "Stok Keluar Hari Ini",
                icon: ArrowDownCircle,
                value: `${formatNumber(summaryData.todayStockOut)} Unit`,
                iconColor: "text-orange-600",
                bgColor: "bg-orange-100",
            },
        ];
    };

    // Enhanced Stock Movement Chart with Area visualization
    const StockMovementChart = () => {
        const data = chartData.stockMovements || [];

        if (data.length === 0) {
            return (
                <Card className="h-full">
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                            <LineChartIcon className="h-5 w-5 text-blue-600" />
                            <CardTitle className="text-lg">
                                Pergerakan Stok Harian
                            </CardTitle>
                        </div>
                        <CardDescription className="text-sm text-gray-600">
                            Stok masuk vs keluar 7 hari terakhir
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64 flex items-center justify-center text-gray-400">
                            <div className="text-center">
                                <Package className="h-8 w-8 mx-auto mb-2" />
                                <p className="text-sm">
                                    Tidak ada data pergerakan stok
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            );
        }

        return (
            <Card className="h-full">
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                        <LineChartIcon className="h-5 w-5 text-blue-600" />
                        <CardTitle className="text-lg">
                            Pergerakan Stok Harian
                        </CardTitle>
                    </div>
                    <CardDescription className="text-sm text-gray-600">
                        Stok masuk vs keluar 7 hari terakhir
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                                data={data}
                                margin={{
                                    top: 20,
                                    right: 30,
                                    left: 20,
                                    bottom: 20,
                                }}
                            >
                                <defs>
                                    <linearGradient
                                        id="colorStockIn"
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                    >
                                        <stop
                                            offset="5%"
                                            stopColor="#10B981"
                                            stopOpacity={0.4}
                                        />
                                        <stop
                                            offset="95%"
                                            stopColor="#10B981"
                                            stopOpacity={0.05}
                                        />
                                    </linearGradient>
                                    <linearGradient
                                        id="colorStockOut"
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                    >
                                        <stop
                                            offset="5%"
                                            stopColor="#EF4444"
                                            stopOpacity={0.4}
                                        />
                                        <stop
                                            offset="95%"
                                            stopColor="#EF4444"
                                            stopOpacity={0.05}
                                        />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid
                                    strokeDasharray="2 4"
                                    stroke="#E5E7EB"
                                    opacity={0.6}
                                />
                                <XAxis
                                    dataKey="day"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{
                                        fontSize: 12,
                                        fill: "#6B7280",
                                        fontWeight: 500,
                                    }}
                                    tickMargin={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: "#6B7280" }}
                                    tickMargin={10}
                                    tickFormatter={(value) =>
                                        formatNumber(value)
                                    }
                                />
                                <Tooltip
                                    content={
                                        <CustomTooltip
                                            formatter={(entry) =>
                                                `${entry.name}: ${
                                                    entry.value?.toLocaleString?.(
                                                        "id-ID"
                                                    ) || entry.value
                                                } unit`
                                            }
                                        />
                                    }
                                />
                                <Area
                                    type="monotone"
                                    dataKey="stock_in"
                                    stroke="#10B981"
                                    strokeWidth={3}
                                    fill="url(#colorStockIn)"
                                    name="Stok Masuk"
                                    dot={{
                                        r: 4,
                                        fill: "#10B981",
                                        strokeWidth: 2,
                                        stroke: "#fff",
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="stock_out"
                                    stroke="#EF4444"
                                    strokeWidth={3}
                                    fill="url(#colorStockOut)"
                                    name="Stok Keluar"
                                    dot={{
                                        r: 4,
                                        fill: "#EF4444",
                                        strokeWidth: 2,
                                        stroke: "#fff",
                                    }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
                <CardFooter className="pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-green-500"></div>
                            <span>Stok Masuk</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-red-500"></div>
                            <span>Stok Keluar</span>
                        </div>
                    </div>
                </CardFooter>
            </Card>
        );
    };

    // Enhanced Top Products Chart with better styling
    const TopProductsChart = () => {
        const data = chartData.topProducts || [];

        if (data.length === 0) {
            return (
                <Card className="h-full">
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-green-600" />
                            <CardTitle className="text-lg">
                                Produk Terlaris
                            </CardTitle>
                        </div>
                        <CardDescription className="text-sm text-gray-600">
                            Top 10 produk paling banyak digunakan
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64 flex items-center justify-center text-gray-400">
                            <div className="text-center">
                                <Package className="h-8 w-8 mx-auto mb-2" />
                                <p className="text-sm">Tidak ada data produk</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            );
        }

        const topProducts = data.slice(0, 8);

        return (
            <Card className="h-full">
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-green-600" />
                        <CardTitle className="text-lg">
                            Produk Terlaris
                        </CardTitle>
                    </div>
                    <CardDescription className="text-sm text-gray-600">
                        Top 8 produk paling banyak digunakan bulan ini
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={topProducts}
                                margin={{
                                    top: 20,
                                    right: 20,
                                    left: 20,
                                    bottom: 20,
                                }}
                            >
                                <CartesianGrid
                                    strokeDasharray="2 4"
                                    stroke="#E5E7EB"
                                    opacity={0.6}
                                />
                                <XAxis
                                    dataKey="product_name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={false}
                                    height={20}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: "#6B7280" }}
                                    tickMargin={10}
                                    tickFormatter={(value) =>
                                        formatNumber(value)
                                    }
                                />
                                <Tooltip
                                    content={
                                        <CustomTooltip
                                            formatter={(entry) =>
                                                `Pemakaian: ${
                                                    entry.value?.toLocaleString?.(
                                                        "id-ID"
                                                    ) || entry.value
                                                } unit`
                                            }
                                        />
                                    }
                                />
                                <Bar
                                    dataKey="total_usage"
                                    radius={[6, 6, 0, 0]}
                                    fill="#10B981"
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
                <CardFooter className="pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded bg-green-500"></div>
                            <span>Produk Terlaris</span>
                        </div>
                    </div>
                </CardFooter>
            </Card>
        );
    };

    // Enhanced Purchase Trend Chart
    const PurchaseTrendChart = () => {
        const data = chartData.purchaseTrend || [];

        if (data.length === 0) {
            return (
                <Card className="h-full">
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-purple-600" />
                            <CardTitle className="text-lg">
                                Tren Pembelian
                            </CardTitle>
                        </div>
                        <CardDescription className="text-sm text-gray-600">
                            Nilai pembelian 6 bulan terakhir
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64 flex items-center justify-center text-gray-400">
                            <div className="text-center">
                                <ShoppingCart className="h-8 w-8 mx-auto mb-2" />
                                <p className="text-sm">
                                    Tidak ada data pembelian
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            );
        }

        return (
            <Card className="h-full">
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-purple-600" />
                        <CardTitle className="text-lg">
                            Tren Pembelian
                        </CardTitle>
                    </div>
                    <CardDescription className="text-sm text-gray-600">
                        Nilai pembelian 6 bulan terakhir
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                                data={data}
                                margin={{
                                    top: 20,
                                    right: 30,
                                    left: 20,
                                    bottom: 20,
                                }}
                            >
                                <CartesianGrid
                                    strokeDasharray="2 4"
                                    stroke="#E5E7EB"
                                    opacity={0.6}
                                />
                                <XAxis
                                    dataKey="month"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{
                                        fontSize: 12,
                                        fill: "#6B7280",
                                        fontWeight: 500,
                                    }}
                                    tickMargin={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: "#6B7280" }}
                                    tickMargin={10}
                                    tickFormatter={(value) => {
                                        if (value >= 1000000)
                                            return `${(value / 1000000).toFixed(
                                                1
                                            )}M`;
                                        if (value >= 1000)
                                            return `${(value / 1000).toFixed(
                                                0
                                            )}K`;
                                        return formatNumber(value);
                                    }}
                                />
                                <Tooltip
                                    content={
                                        <CustomTooltip
                                            formatter={(entry) =>
                                                `Total Pembelian: ${formatCurrency(
                                                    entry.value
                                                )}`
                                            }
                                        />
                                    }
                                />
                                <Line
                                    type="monotone"
                                    dataKey="total"
                                    stroke="#8B5CF6"
                                    strokeWidth={4}
                                    dot={{
                                        r: 6,
                                        fill: "#8B5CF6",
                                        strokeWidth: 3,
                                        stroke: "#fff",
                                    }}
                                    activeDot={{
                                        r: 8,
                                        stroke: "#8B5CF6",
                                        strokeWidth: 3,
                                        fill: "#fff",
                                    }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
                <CardFooter className="pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                        <div className="h-3 w-3 rounded-full bg-purple-500"></div>
                        <span>Tren Pembelian</span>
                    </div>
                </CardFooter>
            </Card>
        );
    };

    // Enhanced Stock Analysis Chart
    const StockAnalysisChart = () => {
        const analysis = chartData.stockAnalysis || {};
        const data = [
            {
                name: "Stok Normal",
                value: analysis.normal || 0,
                color: "#10B981",
            },
            { name: "Stok Rendah", value: analysis.low || 0, color: "#F59E0B" },
            {
                name: "Stok Kritis",
                value: analysis.critical || 0,
                color: "#EF4444",
            },
        ].filter((item) => item.value > 0);

        if (data.length === 0) {
            return (
                <Card className="h-full">
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                            <PieChartIcon className="h-5 w-5 text-orange-600" />
                            <CardTitle className="text-lg">
                                Analisis Status Stok
                            </CardTitle>
                        </div>
                        <CardDescription className="text-sm text-gray-600">
                            Distribusi kondisi stok produk
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64 flex items-center justify-center text-gray-400">
                            <div className="text-center">
                                <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                                <p className="text-sm">
                                    Tidak ada data analisis stok
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            );
        }

        return (
            <Card className="h-full">
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                        <PieChartIcon className="h-5 w-5 text-orange-600" />
                        <CardTitle className="text-lg">
                            Analisis Status Stok
                        </CardTitle>
                    </div>
                    <CardDescription className="text-sm text-gray-600">
                        Distribusi kondisi stok produk
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={90}
                                    innerRadius={50}
                                    dataKey="value"
                                    label={false}
                                    strokeWidth={2}
                                    stroke="#fff"
                                >
                                    {data.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.color}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    content={
                                        <CustomTooltip
                                            formatter={(entry) =>
                                                `${entry.name}: ${formatNumber(
                                                    entry.value
                                                )} item (${(
                                                    (entry.value /
                                                        data.reduce(
                                                            (sum, item) =>
                                                                sum +
                                                                item.value,
                                                            0
                                                        )) *
                                                    100
                                                ).toFixed(1)}%)`
                                            }
                                        />
                                    }
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
                <CardFooter className="pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
                        {data.map((item, index) => (
                            <div
                                key={index}
                                className="flex items-center gap-2"
                            >
                                <div
                                    className="h-3 w-3 rounded-full"
                                    style={{ backgroundColor: item.color }}
                                ></div>
                                <span>{item.name}</span>
                            </div>
                        ))}
                    </div>
                </CardFooter>
            </Card>
        );
    };

    return (
        <Layout>
            <Head title="Dashboard" />

            <div className="flex items-end justify-between mb-7">
                <h1 className="text-3xl font-bold">Dashboard</h1>
                <div className="text-sm text-gray-500">
                    Selamat datang, {auth.user.name} ({userRole})
                </div>
            </div>

            {/* Error Alert */}
            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center">
                        <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                        <p className="text-red-700">{error}</p>
                    </div>
                </div>
            )}

            <div className="flex flex-col gap-4">
                {/* Hero Card */}
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

                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {getSummaryCards().map((item) => (
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
                {/* EOQ Reminder Table - Full Width */}
                {eoqReminderData.length > 0 && (
                    <div className="col-span-full">
                        <Card>
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Bell className="h-5 w-5 text-orange-500" />
                                        <CardTitle className="text-lg">
                                            Item Memerlukan Perhatian (
                                            {eoqReminderData.length})
                                        </CardTitle>
                                    </div>
                                    <Link href="/reports/minimum-stock">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-xs"
                                        >
                                            Lihat Semua
                                            <ExternalLink className="h-3 w-3 ml-1" />
                                        </Button>
                                    </Link>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    {eoqReminderData.length > 0 ? (
                                        <>
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="border-b border-gray-200">
                                                        <th className="text-left py-3 font-medium text-gray-600">
                                                            Produk
                                                        </th>
                                                        <th className="text-center py-3 font-medium text-gray-600">
                                                            SKU
                                                        </th>
                                                        <th className="text-center py-3 font-medium text-gray-600">
                                                            Stok
                                                        </th>
                                                        <th className="text-center py-3 font-medium text-gray-600">
                                                            ROP
                                                        </th>
                                                        <th className="text-center py-3 font-medium text-gray-600">
                                                            EOQ
                                                        </th>
                                                        <th className="text-center py-3 font-medium text-gray-600">
                                                            Status
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {eoqReminderData
                                                        .slice(0, 3)
                                                        .map((item) => (
                                                            <tr
                                                                key={item.id}
                                                                className="border-b border-gray-100 hover:bg-gray-50"
                                                            >
                                                                <td className="py-3 font-medium text-gray-900">
                                                                    {item.nama}
                                                                </td>
                                                                <td className="py-3 text-center text-gray-600 text-xs">
                                                                    {item.sku ||
                                                                        "-"}
                                                                </td>
                                                                <td className="py-3 text-center font-medium">
                                                                    {formatNumber(
                                                                        item.stok
                                                                    )}
                                                                </td>
                                                                <td className="py-3 text-center text-gray-600">
                                                                    {formatNumber(
                                                                        item.rop
                                                                    )}
                                                                </td>
                                                                <td className="py-3 text-center text-blue-600">
                                                                    {formatNumber(
                                                                        item.eoq
                                                                    )}
                                                                </td>
                                                                <td className="py-3 text-center">
                                                                    <Badge
                                                                        variant={
                                                                            item.status ===
                                                                            "critical"
                                                                                ? "destructive"
                                                                                : "secondary"
                                                                        }
                                                                        className="text-xs"
                                                                    >
                                                                        {item.status ===
                                                                        "critical"
                                                                            ? "KRITIS"
                                                                            : "RENDAH"}
                                                                    </Badge>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                </tbody>
                                            </table>
                                            <div className="pt-3 text-center">
                                                <Link href="/reports/minimum-stock">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-xs text-blue-600"
                                                    >
                                                        Lihat Semua
                                                    </Button>
                                                </Link>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="py-8 text-center text-gray-500">
                                            <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                            <p className="text-sm">
                                                Tidak ada item yang memerlukan
                                                perhatian
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Charts Row 1 */}
                <StockMovementChart />
                <StockAnalysisChart />

                {/* Charts Row 2 - Only for admin/manager */}
                {(userRole === "admin" || userRole === "manager") && (
                    <>
                        <TopProductsChart />
                        <PurchaseTrendChart />
                    </>
                )}

                {/* Recent Activities - Full Width */}
                {recentActivities.length > 0 && (
                    <div className="col-span-full">
                        <Card>
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Activity className="h-5 w-5 text-blue-500" />
                                        <CardTitle className="text-lg">
                                            Aktivitas Terkini (
                                            {recentActivities.length})
                                        </CardTitle>
                                    </div>
                                    <Link href="/reports/mutation">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-xs"
                                        >
                                            Lihat Semua
                                            <ExternalLink className="h-3 w-3 ml-1" />
                                        </Button>
                                    </Link>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {recentActivities
                                        .slice(0, 6)
                                        .map((activity, index) => (
                                            <div
                                                key={`${activity.type}-${activity.id}-${index}`}
                                                className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50"
                                            >
                                                <div className="flex items-center gap-3">
                                                    {activity.type ===
                                                    "stock_in" ? (
                                                        <ArrowUpCircle className="h-4 w-4 text-green-600" />
                                                    ) : (
                                                        <ArrowDownCircle className="h-4 w-4 text-red-600" />
                                                    )}
                                                    <div>
                                                        <div className="font-medium text-sm text-gray-900">
                                                            {
                                                                activity.product_name
                                                            }
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {activity.type ===
                                                            "stock_in"
                                                                ? "Masuk"
                                                                : "Keluar"}
                                                            :{" "}
                                                            {formatNumber(
                                                                activity.quantity
                                                            )}{" "}
                                                            unit
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right text-xs text-gray-500">
                                                    <div>
                                                        {new Date(
                                                            activity.date
                                                        ).toLocaleDateString(
                                                            "id-ID"
                                                        )}
                                                    </div>
                                                    <div>
                                                        {activity.user_name}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </Layout>
    );
}
