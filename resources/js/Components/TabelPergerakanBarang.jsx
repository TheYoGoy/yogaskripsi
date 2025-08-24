import React from "react";
import { MoveHorizontal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const dataPergerakan = [
    {
        tanggal: "2025-07-20",
        nama: "Kertas A4",
        jenis: "Masuk",
        jumlah: 50,
        satuan: "rim",
    },
    {
        tanggal: "2025-07-19",
        nama: "Tinta Printer",
        jenis: "Keluar",
        jumlah: 5,
        satuan: "pcs",
    },
    {
        tanggal: "2025-07-18",
        nama: "Pulpen",
        jenis: "Masuk",
        jumlah: 20,
        satuan: "box",
    },
];

const PergerakanBarang = () => {
    return (
        <Card className="shadow-centered border-none">
            <CardHeader>
                <CardTitle className="flex items-center gap-4 text-lg">
                    <MoveHorizontal className="w-7 h-7 text-purple-500" />
                    Pergerakan Barang Terakhir
                </CardTitle>
            </CardHeader>
            <CardContent>
                <table className="w-full text-sm">
                    <thead className="text-left text-muted-foreground border-b">
                        <tr>
                            <th className="py-2">Tanggal</th>
                            <th>Barang</th>
                            <th>Jenis</th>
                            <th>Jumlah</th>
                        </tr>
                    </thead>
                    <tbody>
                        {dataPergerakan.map((item, index) => (
                            <tr
                                key={index}
                                className="border-b last:border-none"
                            >
                                <td className="py-2">{item.tanggal}</td>
                                <td>{item.nama}</td>
                                <td>
                                    <span
                                        className={`px-2 py-1 rounded-md text-xs font-medium ${
                                            item.jenis === "Masuk"
                                                ? "bg-green-100 text-green-600"
                                                : "bg-red-100 text-red-600"
                                        }`}
                                    >
                                        {item.jenis}
                                    </span>
                                </td>
                                <td>
                                    {item.jumlah} {item.satuan}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </CardContent>
        </Card>
    );
};

export default PergerakanBarang;
