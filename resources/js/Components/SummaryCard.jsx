import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

const SummaryCard = ({ title, icon: Icon, value, bgColor, iconColor }) => {
    return (
        <Card className="flex items-center gap-4 p-4 shadow-centered border-none">
            {/* Ikon */}
            <CardHeader
                className={`flex items-center justify-center p-2 rounded-md w-10 h-10 ${bgColor}`}
            >
                <Icon className={`w-5 h-5 ${iconColor}`} />
            </CardHeader>

            {/* Konten */}
            <CardContent className="p-0">
                <div className="text-xl font-bold">{value}</div>
                <p className="text-sm text-gray-600">{title}</p>
            </CardContent>
        </Card>
    );
};

export default SummaryCard;
