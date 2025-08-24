import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const sales = [
    {
        name: "Bambang",
        email: "babang.example.com",
        paidAmount: "100.00",
        avatar: "AJ",
    },
    {
        name: "Siti Nurhaliza",
        email: "siti.n@example.com",
        paidAmount: "250.00",
        avatar: "SN",
    },
    {
        name: "Joko Widodo",
        email: "jokowi@example.com",
        paidAmount: "500.00",
        avatar: "JW",
    },
    {
        name: "Agus Salim",
        email: "agus.s@example.com",
        paidAmount: "300.50",
        avatar: "AS",
    },
    {
        name: "Dewi Lestari",
        email: "dewi.l@example.com",
        paidAmount: "120.00",
        avatar: "DL",
    },
    {
        name: "Rudi Hartono",
        email: "rudi.h@example.com",
        paidAmount: "90.00",
        avatar: "RH",
    },
    {
        name: "Tono Suharto",
        email: "tono.s@example.com",
        paidAmount: "185.75",
        avatar: "TS",
    },
    {
        name: "Putri Ayu",
        email: "putri.a@example.com",
        paidAmount: "410.25",
        avatar: "PA",
    },
    {
        name: "Bayu Anggara",
        email: "bayu.a@example.com",
        paidAmount: "275.00",
        avatar: "BA",
    },
    {
        name: "Mega Wati",
        email: "mega.w@example.com",
        paidAmount: "320.00",
        avatar: "MW",
    },
];
const RecentSales = () => {
    return (
        <div className="space-y-8">
            {sales.map((sale) => (
                <div key={sale.name} className="flex items-center">
                    <Avatar className="h-9 w-9">
                        <AvatarImage src="" alt="Avatar" />
                        <AvatarFallback>{sale.avatar}</AvatarFallback>
                    </Avatar>

                    <div className="ml-4 space-y-1 text-sm">
                        <p className="font-medium leading-none">{sale.name}</p>
                        <p className="text-muted-foreground">{sale.email}</p>
                    </div>
                    <div className="ml-auto font-medium">
                        ${sale.paidAmount}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default RecentSales;
