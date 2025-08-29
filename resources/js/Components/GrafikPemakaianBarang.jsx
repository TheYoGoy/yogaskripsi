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
import { TrendingUp } from "lucide-react";

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="rounded-lg border bg-background p-2 shadow-sm">
                <p className="text-sm font-bold text-muted-foreground">
                    {data.product_name}
                </p>
                <p className="text-sm text-green-500">{`Pemakaian: ${payload[0].value} unit`}</p>
                {data.sku && (
                    <p className="text-xs text-gray-400">{`SKU: ${data.sku}`}</p>
                )}
            </div>
        );
    }
    return null;
};

export default function GrafikPemakaianBarang({ data = [] }) {
    // Fallback data jika tidak ada data dari database
    const defaultData = [
        { product_name: "Belum ada data", total_usage: 0, sku: "" },
    ];

    const chartData = data && data.length > 0 ? data.slice(0, 10) : defaultData;
    const totalUsed = chartData.reduce(
        (sum, item) => sum + (item.total_usage || 0),
        0
    );
    const averageUsage =
        chartData.length > 0 ? totalUsed / chartData.length : 0;

    return (
        <Card className="shadow-centered border-none">
            <CardHeader>
                <CardTitle>Top 10 Produk Paling Banyak Digunakan</CardTitle>
                <CardDescription>
                    Pemakaian produk bulan ini ({data.length || 0} produk)
                </CardDescription>
            </CardHeader>

            <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ bottom: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis
                            dataKey="product_name"
                            tickLine={false}
                            axisLine={false}
                            className="text-sm"
                            angle={-45}
                            textAnchor="end"
                            height={80}
                            interval={0}
                            tick={{ fontSize: 10 }}
                        />
                        <YAxis
                            tickLine={false}
                            axisLine={false}
                            className="text-sm"
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar
                            dataKey="total_usage"
                            fill="#22C55E"
                            radius={[4, 4, 0, 0]}
                        />
                        {averageUsage > 0 && (
                            <ReferenceLine
                                y={averageUsage}
                                label={{
                                    value: `Rata-rata: ${averageUsage.toFixed(
                                        0
                                    )} unit`,
                                    position: "right",
                                    fill: "#8884d8",
                                    offset: 10,
                                }}
                                stroke="#8884d8"
                                strokeDasharray="3 3"
                            />
                        )}
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>

            <CardFooter className="flex flex-col items-start gap-2 pt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span>
                        <b className="text-green-500">Batang Hijau:</b> Jumlah
                        unit barang yang terpakai.
                    </span>
                </div>
                {averageUsage > 0 && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="h-4 w-4 rounded-sm bg-indigo-500" />
                        <span>
                            <b className="text-indigo-500">
                                Garis Putus-putus Ungu:
                            </b>{" "}
                            Rata-rata pemakaian.
                        </span>
                    </div>
                )}
            </CardFooter>
        </Card>
    );
}
