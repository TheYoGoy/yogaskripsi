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
    CardFooter, // Still using CardFooter for the legend
} from "@/components/ui/card";

import { TrendingUp, Scale } from "lucide-react"; // Icons for the legend

const pemakaianData = [
    { month: "Jan", used: 120 },
    { month: "Feb", used: 150 },
    { month: "Mar", used: 100 },
    { month: "Apr", used: 180 },
    { month: "May", used: 160 },
    { month: "Jun", used: 140 },
];

// Custom Tooltip component for better readability
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="rounded-lg border bg-background p-2 shadow-sm">
                <p className="text-sm font-bold text-muted-foreground">{`Bulan: ${label}`}</p>
                <p className="text-sm text-green-500">{`Pemakaian: ${payload[0].value} unit`}</p>
            </div>
        );
    }
    return null;
};

export default function GrafikPemakaianBarang() {
    const totalUsed = pemakaianData.reduce((sum, item) => sum + item.used, 0);
    const averageUsage = totalUsed / pemakaianData.length;

    return (
        <Card className="shadow-centered border-none">
            <CardHeader>
                <CardTitle>Grafik Pemakaian Barang</CardTitle>
                <CardDescription>
                    Tren pemakaian bulanan (Januari - Juni 2024)
                </CardDescription>
            </CardHeader>

            <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={pemakaianData}>
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
                        <Tooltip content={<CustomTooltip />} />
                        <Line
                            type="monotone"
                            dataKey="used"
                            stroke="#22C55E" // green-500
                            strokeWidth={2}
                            dot={{ r: 4, fill: "#22C55E" }}
                            activeDot={{
                                r: 8,
                                stroke: "#22C55E",
                                strokeWidth: 2,
                            }}
                        />
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
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>

            <CardFooter className="flex flex-col items-start gap-2 pt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span>
                        <b className="text-green-500">Garis Hijau:</b> Jumlah
                        unit barang yang terpakai setiap bulan.
                    </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="h-4 w-4 rounded-sm bg-indigo-500" />
                    <span>
                        <b className="text-indigo-500">
                            Garis Putus-putus Ungu:
                        </b>{" "}
                        Rata-rata pemakaian barang selama periode ini.
                    </span>
                </div>
            </CardFooter>
        </Card>
    );
}
