import React from "react";
import { Boxes } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const dataStok = [
    {
        nama: "Tinta Printer",
        stok: 8,
        satuan: "pcs",
        lokasi: "Gudang Utama",
    },
    {
        nama: "Kertas A4",
        stok: 120,
        satuan: "rim",
        lokasi: "Gudang Cabang",
    },
    {
        nama: "Pulpen",
        stok: 35,
        satuan: "box",
        lokasi: "Gudang Utama",
    },
];

const PersediaanBarang = () => {
    return (
        <Card className="shadow-centered border-none">
            <CardHeader>
                <CardTitle className="flex items-center gap-4 text-lg">
                    <Boxes className="w-7 h-7 text-sky-500" />
                    Persediaan Barang
                </CardTitle>
            </CardHeader>
            <CardContent>
                <table className="w-full text-sm">
                    <thead className="text-left text-muted-foreground border-b">
                        <tr>
                            <th className="py-2">Barang</th>
                            <th>Jumlah</th>
                            <th>Lokasi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {dataStok.map((item, index) => (
                            <tr
                                key={index}
                                className="border-b last:border-none"
                            >
                                <td className="py-2">{item.nama}</td>
                                <td>
                                    {item.stok} {item.satuan}
                                </td>
                                <td>{item.lokasi}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </CardContent>
        </Card>
    );
};

export default PersediaanBarang;
