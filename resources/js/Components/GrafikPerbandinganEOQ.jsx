import React from "react";
import {
    BarChart,
    Bar,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter,
} from "@/components/ui/card";

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="rounded-lg border bg-background p-2 shadow-sm">
                <p className="text-sm font-bold text-muted-foreground">
                    {data.name}
                </p>
                <p className="text-sm text-indigo-500">{`EOQ: ${
                    payload.find((p) => p.dataKey === "eoq")?.value || 0
                } unit`}</p>
                <p className="text-sm text-green-500">{`Stok: ${
                    payload.find((p) => p.dataKey === "current_stock")?.value ||
                    0
                } unit`}</p>
                <p className="text-sm text-orange-500">{`ROP: ${
                    data.rop || 0
                } unit`}</p>
                {data.sku && (
                    <p className="text-xs text-gray-400">{`SKU: ${data.sku}`}</p>
                )}
            </div>
        );
    }
    return null;
};

export default function GrafikPerbandinganEOQ({ data = [] }) {
    // Transform data untuk chart dengan fallback
    const chartData =
        data && data.length > 0
            ? data.slice(0, 10).map((item) => ({
                  name: item.name
                      ? item.name.length > 15
                          ? item.name.substring(0, 15) + "..."
                          : item.name
                      : "Unknown",
                  eoq: item.eoq || 0,
                  current_stock: item.current_stock || 0,
                  rop: item.rop || 0,
                  stock_level: item.stock_level || "normal",
                  sku: item.sku || "",
              }))
            : [
                  {
                      name: "Belum ada data",
                      eoq: 0,
                      current_stock: 0,
                      rop: 0,
                      sku: "",
                  },
              ];

    return (
        <Card className="shadow-centered border-none">
            <CardHeader>
                <CardTitle>Grafik Perbandingan EOQ vs Stok Aktual</CardTitle>
                <CardDescription>
                    Top 10 Produk dengan EOQ Tertinggi ({data.length || 0}{" "}
                    produk)
                </CardDescription>
            </CardHeader>

            <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={chartData}
                        barGap={8}
                        margin={{ bottom: 60 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis
                            dataKey="name"
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
                            dataKey="eoq"
                            name="EOQ"
                            fill="#4338CA"
                            radius={[4, 4, 0, 0]}
                        />
                        <Bar
                            dataKey="current_stock"
                            name="Stok Saat Ini"
                            fill="#22C55E"
                            radius={[4, 4, 0, 0]}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>

            <CardFooter className="flex flex-col items-start gap-2 pt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="h-4 w-4 rounded-sm bg-indigo-700" />
                    <span>
                        <b className="text-indigo-500">Batang Ungu (EOQ):</b>{" "}
                        Kuantitas pesanan ekonomis yang disarankan.
                    </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="h-4 w-4 rounded-sm bg-green-500" />
                    <span>
                        <b className="text-green-500">Batang Hijau:</b> Stok
                        saat ini di gudang.
                    </span>
                </div>
            </CardFooter>
        </Card>
    );
}
