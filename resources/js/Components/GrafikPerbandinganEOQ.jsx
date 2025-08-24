import React from "react";
import {
    BarChart,
    Bar,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine, // Tetap disertakan jaga-jaga jika ingin menambahkan garis rata-rata di masa depan
} from "recharts";

import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter, // Digunakan untuk legenda dan keterangan
} from "@/components/ui/card";

// Icons yang relevan
import { TrendingUp, TrendingDown, LayoutDashboard } from "lucide-react"; // Menggunakan LayoutDashboard untuk representasi umum perbandingan/dashboard

// 📊 Data EOQ vs Pembelian Aktual
const chartData = [
    { month: "Jan", eoq: 200, aktual: 180 },
    { month: "Feb", eoq: 220, aktual: 190 },
    { month: "Mar", eoq: 210, aktual: 240 },
    { month: "Apr", eoq: 230, aktual: 220 },
    { month: "May", eoq: 240, aktual: 210 },
    { month: "Jun", eoq: 250, aktual: 230 },
];

// 🎨 Konfigurasi warna dan label
const chartConfig = {
    eoq: {
        label: "EOQ",
        color: "#4338CA", // indigo-700
    },
    aktual: {
        label: "Pembelian Aktual",
        color: "#22C55E", // green-500
    },
};

// Custom Tooltip component untuk keterbacaan yang lebih baik
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        // Mendapatkan warna dari chartConfig
        const eoqColor = chartConfig.eoq.color;
        const aktualColor = chartConfig.aktual.color;

        return (
            <div className="rounded-lg border bg-background p-2 shadow-sm">
                <p className="text-sm font-bold text-muted-foreground">{`Bulan: ${label}`}</p>
                <p
                    className="text-sm"
                    style={{ color: eoqColor }}
                >{`EOQ: ${payload[0].value} unit`}</p>
                <p
                    className="text-sm"
                    style={{ color: aktualColor }}
                >{`Aktual: ${payload[1].value} unit`}</p>
            </div>
        );
    }
    return null;
};

export default function GrafikPerbandinganEOQ() {
    return (
        <Card className="shadow-centered border-none">
            <CardHeader>
                <CardTitle>
                    Grafik Perbandingan EOQ vs Pembelian Aktual
                </CardTitle>
                <CardDescription>Januari - Juni 2024</CardDescription>
            </CardHeader>

            <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} barGap={8}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis
                            dataKey="month"
                            tickLine={false}
                            axisLine={false}
                            className="text-sm"
                        />
                        <YAxis
                            tickLine={false}
                            axisLine={false}
                            className="text-sm"
                        />
                        {/* Menggunakan Tooltip kustom */}
                        <Tooltip content={<CustomTooltip />} />
                        {/* Menghilangkan Legend bawaan Recharts karena akan dibuat di CardFooter */}
                        {/* <Legend /> */}

                        <Bar
                            dataKey="eoq"
                            name={chartConfig.eoq.label} // Penting untuk Tooltip kustom
                            fill={chartConfig.eoq.color}
                            radius={[4, 4, 0, 0]}
                        />
                        <Bar
                            dataKey="aktual"
                            name={chartConfig.aktual.label} // Penting untuk Tooltip kustom
                            fill={chartConfig.aktual.color}
                            radius={[4, 4, 0, 0]}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>

            <CardFooter className="flex flex-col items-start gap-2 pt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {/* Simbol warna untuk batang EOQ */}
                    <div
                        className="h-4 w-4 rounded-sm"
                        style={{ backgroundColor: chartConfig.eoq.color }}
                    />
                    <span>
                        <b className="text-indigo-500">Batang Ungu (EOQ):</b>{" "}
                        Kuantitas Pesanan Ekonomis yang disarankan.
                    </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {/* Simbol warna untuk batang Aktual */}
                    <div
                        className="h-4 w-4 rounded-sm"
                        style={{ backgroundColor: chartConfig.aktual.color }}
                    />
                    <span>
                        <b className="text-green-500">Batang Hijau (Aktual):</b>{" "}
                        Jumlah unit barang yang benar-benar dibeli.
                    </span>
                </div>
            </CardFooter>
        </Card>
    );
}
