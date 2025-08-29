import React from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
} from "recharts";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter,
} from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="rounded-lg border bg-background p-2 shadow-sm">
                <p className="text-sm font-bold text-muted-foreground">{`${
                    data.day || label
                }`}</p>
                <p className="text-sm text-green-500">{`Stok Masuk: ${
                    data.stock_in || 0
                } unit`}</p>
                <p className="text-sm text-red-500">{`Stok Keluar: ${
                    data.stock_out || 0
                } unit`}</p>
                <p className="text-sm text-blue-500">{`Net Movement: ${
                    data.net_movement || 0
                } unit`}</p>
            </div>
        );
    }
    return null;
};

export default function GrafikTrenStok({ data = [] }) {
    // Fallback data untuk 7 hari terakhir
    const defaultData = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return {
            date: date.toISOString().split("T")[0],
            day: ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"][
                date.getDay()
            ],
            stock_in: 0,
            stock_out: 0,
            net_movement: 0,
        };
    });

    const chartData = data && data.length > 0 ? data : defaultData;

    // Hitung trend
    const totalNetMovement = chartData.reduce(
        (sum, item) => sum + (item.net_movement || 0),
        0
    );
    const avgNetMovement =
        chartData.length > 0 ? totalNetMovement / chartData.length : 0;

    const isPositiveTrend = avgNetMovement > 0;

    return (
        <Card className="shadow-centered border-none">
            <CardHeader>
                <CardTitle>Grafik Pergerakan Stok Harian</CardTitle>
                <CardDescription>
                    Stok masuk vs keluar dalam 7 hari terakhir
                    {avgNetMovement !== 0 && (
                        <span
                            className={`ml-2 font-semibold ${
                                isPositiveTrend
                                    ? "text-green-600"
                                    : "text-red-600"
                            }`}
                        >
                            (Trend: {isPositiveTrend ? "+" : ""}
                            {avgNetMovement.toFixed(1)} unit/hari)
                        </span>
                    )}
                </CardDescription>
            </CardHeader>

            <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis
                            dataKey="day"
                            tickLine={false}
                            axisLine={false}
                            className="text-sm"
                        />
                        <YAxis
                            tickLine={false}
                            axisLine={false}
                            className="text-sm"
                        />
                        <Tooltip content={<CustomTooltip />} />

                        {/* Garis Stok Masuk */}
                        <Line
                            type="monotone"
                            dataKey="stock_in"
                            stroke="#22C55E"
                            strokeWidth={2}
                            dot={{
                                r: 4,
                                fill: "#22C55E",
                                stroke: "#fff",
                                strokeWidth: 2,
                            }}
                            activeDot={{
                                r: 6,
                                stroke: "#22C55E",
                                strokeWidth: 2,
                            }}
                            name="Stok Masuk"
                        />

                        {/* Garis Stok Keluar */}
                        <Line
                            type="monotone"
                            dataKey="stock_out"
                            stroke="#EF4444"
                            strokeWidth={2}
                            dot={{
                                r: 4,
                                fill: "#EF4444",
                                stroke: "#fff",
                                strokeWidth: 2,
                            }}
                            activeDot={{
                                r: 6,
                                stroke: "#EF4444",
                                strokeWidth: 2,
                            }}
                            name="Stok Keluar"
                        />

                        {/* Garis Net Movement */}
                        <Line
                            type="monotone"
                            dataKey="net_movement"
                            stroke="#3B82F6"
                            strokeWidth={3}
                            dot={{
                                r: 5,
                                fill: "#3B82F6",
                                stroke: "#fff",
                                strokeWidth: 2,
                            }}
                            activeDot={{
                                r: 7,
                                stroke: "#3B82F6",
                                strokeWidth: 2,
                            }}
                            strokeDasharray="5 5"
                            name="Net Movement"
                        />

                        {/* Garis referensi di 0 */}
                        <ReferenceLine
                            y={0}
                            stroke="#6B7280"
                            strokeDasharray="2 2"
                        />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>

            <CardFooter className="flex flex-col items-start gap-2 pt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="h-4 w-4 rounded-full bg-green-500" />
                    <span>
                        <b className="text-green-500">Garis Hijau:</b> Jumlah
                        stok masuk harian.
                    </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="h-4 w-4 rounded-full bg-red-500" />
                    <span>
                        <b className="text-red-500">Garis Merah:</b> Jumlah stok
                        keluar harian.
                    </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div
                        className="h-4 w-4 border-2 border-blue-500 rounded-full bg-white"
                        style={{ borderStyle: "dashed" }}
                    />
                    <span>
                        <b className="text-blue-500">Garis Putus Biru:</b> Net
                        movement (masuk - keluar).
                    </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {isPositiveTrend ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                    <span
                        className={
                            isPositiveTrend ? "text-green-600" : "text-red-600"
                        }
                    >
                        <b>Trend:</b> Rata-rata{" "}
                        {isPositiveTrend ? "kenaikan" : "penurunan"} stok
                        {Math.abs(avgNetMovement).toFixed(1)} unit per hari.
                    </span>
                </div>
            </CardFooter>
        </Card>
    );
}
