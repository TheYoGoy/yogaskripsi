import React from "react";
import {
    BarChart, // Menggunakan BarChart untuk grafik batang
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine, // Untuk menampilkan garis rata-rata
} from "recharts";

import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter, // Digunakan untuk legenda di bagian bawah
} from "@/components/ui/card";

// Menggunakan ikon yang relevan untuk pembelian dan rata-rata
import { ShoppingCart, Scale } from "lucide-react";

const pembelianData = [
    { month: "Jan", total: 120 },
    { month: "Feb", total: 200 },
    { month: "Mar", total: 180 },
    { month: "Apr", total: 150 },
    { month: "May", total: 210 },
    { month: "Jun", total: 190 },
];

// Komponen Tooltip Kustom untuk kejelasan
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="rounded-lg border bg-background p-2 shadow-sm">
                <p className="text-sm font-bold text-muted-foreground">{`Bulan: ${label}`}</p>
                <p className="text-sm text-indigo-500">{`Pembelian: ${payload[0].value} unit`}</p>
            </div>
        );
    }
    return null;
};

export default function GrafikPembelianBarang() {
    // Menghitung rata-rata pembelian untuk garis referensi
    const totalPembelianKeseluruhan = pembelianData.reduce(
        (sum, item) => sum + item.total,
        0
    );
    const rataRataPembelian = totalPembelianKeseluruhan / pembelianData.length;

    return (
        <Card className="shadow-centered border-none">
            <CardHeader>
                <CardTitle>Grafik Pembelian Barang</CardTitle>
                <CardDescription>
                    Tren pembelian bulanan (Januari - Juni 2024)
                </CardDescription>
            </CardHeader>

            <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={pembelianData}>
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
                        <Bar
                            dataKey="total"
                            fill="#4338CA" // Warna biru-ungu untuk batang (indigo-500)
                            radius={[4, 4, 0, 0]} // Sudut membulat di bagian atas batang
                        />
                        {/* Garis rata-rata, dengan label dan warna yang jelas */}
                        <ReferenceLine
                            y={rataRataPembelian}
                            label={{
                                value: `Rata-rata: ${rataRataPembelian.toFixed(
                                    0
                                )} unit`,
                                position: "right",
                                fill: "#EF4444", // Warna merah untuk garis rata-rata (red-500)
                                offset: 10,
                            }}
                            stroke="#EF4444" // Warna merah
                            strokeDasharray="3 3" // Garis putus-putus
                        />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>

            <CardFooter className="flex flex-col items-start gap-2 pt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {/* Simbol warna untuk batang, menggunakan div kecil sebagai pengganti ikon untuk batang */}
                    <div className="h-4 w-4 rounded-sm bg-indigo-700" />
                    <span>
                        <b className="text-indigo-500">Batang Ungu:</b> Jumlah
                        total unit barang yang dibeli setiap bulan.
                    </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="h-4 w-4 rounded-sm bg-red-500" />
                    <span>
                        <b className="text-red-500">Garis Putus-putus Merah:</b>{" "}
                        Rata-rata pembelian barang selama periode ini.
                    </span>
                </div>
            </CardFooter>
        </Card>
    );
}
