import React from "react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine, // Ditambahkan untuk garis referensi jika diperlukan (misal: stok minimum)
} from "recharts";

import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter, // Ditambahkan untuk legenda dan keterangan
} from "@/components/ui/card";

// Icons yang relevan
import { Package, LineChart as LineChartIcon } from "lucide-react"; // Menggunakan Package untuk stok, LineChartIcon untuk tren

const stokData = [
    { month: "Jan", stock: 500 },
    { month: "Feb", stock: 470 },
    { month: "Mar", stock: 440 },
    { month: "Apr", stock: 460 },
    { month: "May", stock: 420 },
    { month: "Jun", stock: 390 },
];

// Custom Tooltip component untuk keterbacaan yang lebih baik
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="rounded-lg border bg-background p-2 shadow-sm">
                <p className="text-sm font-bold text-muted-foreground">{`Bulan: ${label}`}</p>
                <p className="text-sm text-emerald-500">{`Stok: ${payload[0].value} unit`}</p>
            </div>
        );
    }
    return null;
};

export default function GrafikTrenKetersediaan() {
    // Anda bisa menambahkan perhitungan rata-rata atau stok minimum di sini jika ingin menambahkan ReferenceLine
    // const rataRataStok = stokData.reduce((sum, item) => sum + item.stock, 0) / stokData.length;
    const stokMinimumTarget = 400; // Contoh: target stok minimum

    return (
        <Card className="shadow-centered border-none">
            <CardHeader>
                <CardTitle>Grafik Tren Ketersediaan Barang</CardTitle>
                <CardDescription>
                    Stok Gudang per Bulan (Januari - Juni 2024)
                </CardDescription>
            </CardHeader>

            <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stokData}>
                        <defs>
                            <linearGradient
                                id="colorStock"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                            >
                                <stop
                                    offset="5%"
                                    stopColor="#10B981" // Emerald-500 for a consistent green shade
                                    stopOpacity={0.8}
                                />
                                <stop
                                    offset="95%"
                                    stopColor="#10B981"
                                    stopOpacity={0}
                                />
                            </linearGradient>
                        </defs>
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
                            label={{
                                angle: -90,
                                position: "insideLeft",
                                offset: 5,
                                style: {
                                    textAnchor: "middle",
                                    fontSize: "12px",
                                    fill: "#6b7280",
                                },
                            }} // Label sumbu Y
                        />
                        {/* Menggunakan Tooltip kustom */}
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                            type="monotone"
                            dataKey="stock"
                            stroke="#10B981" // Emerald-500
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorStock)"
                            dot={{
                                r: 4,
                                fill: "#10B981",
                                stroke: "#fff",
                                strokeWidth: 2,
                            }} // Dots for clarity on the line
                            activeDot={{
                                r: 8,
                                stroke: "#10B981",
                                strokeWidth: 2,
                            }}
                        />
                        {/* Contoh ReferenceLine untuk stok minimum */}
                        <ReferenceLine
                            y={stokMinimumTarget}
                            label={{
                                value: `Target Stok Min: ${stokMinimumTarget} unit`,
                                position: "right",
                                fill: "#EF4444", // Merah untuk peringatan
                                offset: 10,
                            }}
                            stroke="#EF4444" // red-500
                            strokeDasharray="3 3"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>

            <CardFooter className="flex flex-col items-start gap-2 pt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {/* Simbol warna untuk area/garis */}
                    <LineChartIcon className="h-4 w-4 text-green-500" />{" "}
                    {/* Ikon garis untuk tren */}
                    <span>
                        <b className="text-green-500">Area Hijau:</b> Jumlah
                        stok barang di gudang setiap bulan.
                    </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="h-4 w-4 rounded-sm bg-red-500" />
                    {/* Ikon kotak untuk stok/batas */}
                    <span>
                        <b className="text-red-500">Garis Putus-putus Merah:</b>{" "}
                        Target stok minimum untuk peringatan.
                    </span>
                </div>
            </CardFooter>
        </Card>
    );
}
