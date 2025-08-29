import React from "react";
import {
    BarChart,
    Bar,
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
import { ShoppingCart } from "lucide-react";

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="rounded-lg border bg-background p-2 shadow-sm">
                <p className="text-sm font-bold text-muted-foreground">{`${data.month} ${data.year}`}</p>
                <p className="text-sm text-indigo-500">{`Total: Rp ${payload[0].value.toLocaleString(
                    "id-ID"
                )}`}</p>
            </div>
        );
    }
    return null;
};

export default function GrafikPembelianBarang({ data = [] }) {
    // Fallback data jika tidak ada data dari database
    const defaultData = [
        { month: "Jan", year: "2024", total: 0 },
        { month: "Feb", year: "2024", total: 0 },
        { month: "Mar", year: "2024", total: 0 },
        { month: "Apr", year: "2024", total: 0 },
        { month: "May", year: "2024", total: 0 },
        { month: "Jun", year: "2024", total: 0 },
    ];

    const chartData = data && data.length > 0 ? data : defaultData;
    const totalPembelian = chartData.reduce(
        (sum, item) => sum + (item.total || 0),
        0
    );
    const rataRataPembelian =
        chartData.length > 0 ? totalPembelian / chartData.length : 0;

    return (
        <Card className="shadow-centered border-none">
            <CardHeader>
                <CardTitle>Grafik Tren Pembelian</CardTitle>
                <CardDescription>
                    Tren pembelian dalam 6 bulan terakhir
                </CardDescription>
            </CardHeader>

            <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
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
                            tickFormatter={(value) => {
                                if (value >= 1000000) {
                                    return `${(value / 1000000).toFixed(1)}M`;
                                } else if (value >= 1000) {
                                    return `${(value / 1000).toFixed(0)}K`;
                                }
                                return value;
                            }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar
                            dataKey="total"
                            fill="#4338CA"
                            radius={[4, 4, 0, 0]}
                        />
                        {rataRataPembelian > 0 && (
                            <ReferenceLine
                                y={rataRataPembelian}
                                label={{
                                    value: `Rata-rata: Rp ${
                                        rataRataPembelian >= 1000000
                                            ? (
                                                  rataRataPembelian / 1000000
                                              ).toFixed(1) + "M"
                                            : (
                                                  rataRataPembelian / 1000
                                              ).toFixed(0) + "K"
                                    }`,
                                    position: "right",
                                    fill: "#EF4444",
                                    offset: 10,
                                }}
                                stroke="#EF4444"
                                strokeDasharray="3 3"
                            />
                        )}
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>

            <CardFooter className="flex flex-col items-start gap-2 pt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="h-4 w-4 rounded-sm bg-indigo-700" />
                    <span>
                        <b className="text-indigo-500">Batang Ungu:</b> Total
                        nilai pembelian per bulan.
                    </span>
                </div>
                {rataRataPembelian > 0 && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="h-4 w-4 rounded-sm bg-red-500" />
                        <span>
                            <b className="text-red-500">
                                Garis Putus-putus Merah:
                            </b>{" "}
                            Rata-rata pembelian bulanan.
                        </span>
                    </div>
                )}
            </CardFooter>
        </Card>
    );
}
