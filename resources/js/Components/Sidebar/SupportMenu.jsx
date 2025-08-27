import React from "react";
import { usePage, Link } from "@inertiajs/react";
import { BarChart, FileText } from "lucide-react";

import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
} from "@/components/ui/sidebar";

export const SupportMenu = ({ userRole }) => {
    const { url } = usePage();

    const items = [
        {
            name: "EOQ & ROP",
            href: route("eoq-rop.index"),
            icon: BarChart,
            allowedRoles: ["admin", "manager"],
        },
        {
            name: "Laporan",
            href: route("reports.index"),
            icon: FileText,
            allowedRoles: ["admin", "manager"],
        },
    ];

    const visibleItems = items.filter((item) =>
        item.allowedRoles.includes(userRole)
    );

    if (visibleItems.length === 0) return null;

    return (
        <SidebarGroup>
            <SidebarGroupLabel>Laporan & Perhitungan</SidebarGroupLabel>
            <SidebarMenu>
                {visibleItems.map((item) => (
                    <SidebarMenuItem key={item.name}>
                        <SidebarMenuButton
                            asChild
                            isActive={url.startsWith(item.href)}
                            className="hover:bg-indigo-700 hover:text-white"
                        >
                            <Link
                                href={item.href}
                                className="flex items-center gap-2"
                            >
                                <item.icon className="h-4 w-4" />
                                <span>{item.name}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
};
