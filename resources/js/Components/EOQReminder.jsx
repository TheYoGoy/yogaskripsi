// Alternative: EOQReminder dengan auto-refresh
import React, { useState, useEffect } from "react";
import { BellRing, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import axios from "axios";

const EOQReminder = ({ data: initialData = [] }) => {
    const [data, setData] = useState(initialData);
    const [loading, setLoading] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(new Date());

    const refreshData = async () => {
        try {
            setLoading(true);
            const response = await axios.get("/api/dashboard/eoq-reminder");
            setData(response.data);
            setLastUpdated(new Date());
        } catch (error) {
            console.error("Error refreshing EOQ data:", error);
        } finally {
            setLoading(false);
        }
    };

    // Auto-refresh setiap 5 menit
    useEffect(() => {
        const interval = setInterval(refreshData, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <Card className="shadow-centered border-none">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-4 text-lg">
                        <BellRing className="w-7 h-7 text-yellow-500" />
                        Reminder & EOQ Preview
                        {data.length > 0 && (
                            <span className="text-sm font-normal text-gray-500">
                                ({data.length} item)
                            </span>
                        )}
                    </CardTitle>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={refreshData}
                        disabled={loading}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <RefreshCw
                            className={`w-4 h-4 ${
                                loading ? "animate-spin" : ""
                            }`}
                        />
                    </Button>
                </div>
                <p className="text-xs text-gray-500">
                    Terakhir diperbarui:{" "}
                    {lastUpdated.toLocaleTimeString("id-ID")}
                </p>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="text-left text-muted-foreground border-b">
                            <tr>
                                <th className="py-2 px-2">Barang</th>
                                <th className="px-2">EOQ</th>
                                <th className="px-2">Stok Saat Ini</th>
                                <th className="px-2">ROP</th>
                                <th className="px-2">Rekomendasi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((item, index) => (
                                <tr
                                    key={item.id || index}
                                    className="border-b last:border-none hover:bg-gray-50"
                                >
                                    <td className="py-3 px-2">
                                        <div>
                                            <div className="font-medium">
                                                {item.nama}
                                            </div>
                                            {item.sku && (
                                                <div className="text-xs text-gray-500">
                                                    SKU: {item.sku}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-2 font-medium">
                                        {item.eoq}
                                    </td>
                                    <td className="px-2">
                                        <span
                                            className={`font-medium ${
                                                item.status === "critical"
                                                    ? "text-red-600"
                                                    : item.status === "warning"
                                                    ? "text-yellow-600"
                                                    : "text-green-600"
                                            }`}
                                        >
                                            {item.stok}
                                        </span>
                                    </td>
                                    <td className="px-2">{item.rop}</td>
                                    <td className="px-2">
                                        <span
                                            className={`px-2 py-1 rounded-md text-xs font-medium ${
                                                item.status === "critical"
                                                    ? "bg-red-100 text-red-700 border border-red-200"
                                                    : item.status === "warning"
                                                    ? "bg-yellow-100 text-yellow-700 border border-yellow-200"
                                                    : "bg-green-100 text-green-700 border border-green-200"
                                            }`}
                                        >
                                            {item.rekomendasi}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
};

export default EOQReminder;
