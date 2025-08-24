import React from "react";
import { usePage, Link } from "@inertiajs/react";
import { LayoutDashboard, Package, Truck, Tags, Combine } from "lucide-react";
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
} from "@/components/ui/sidebar";

export const ApplicationMenu = ({ userRole }) => {
    const { url } = usePage();

    const items = [
        {
            name: "Dashboard",
            href: route("dashboard"),
            icon: LayoutDashboard,
            allowedRoles: ["admin", "staff", "manager"],
        },
        {
            name: "Produk",
            href: route("products.index"),
            icon: Package,
            allowedRoles: ["admin", "staff", "manager"],
        },
        {
            name: "Supplier",
            href: route("suppliers.index"),
            icon: Truck,
            allowedRoles: ["admin", "manager"],
        },
        {
            name: "Kategori",
            href: route("categories.index"),
            icon: Tags,
            allowedRoles: ["admin", "manager"],
        },
        {
            name: "Satuan",
            href: route("units.index"),
            icon: Combine,
            allowedRoles: ["admin", "manager"],
        },
    ];

    const visibleItems = items.filter((item) =>
        item.allowedRoles.includes(userRole)
    );

    if (visibleItems.length === 0) return null;

    return (
        <SidebarGroup>
            <SidebarGroupLabel>Application</SidebarGroupLabel>
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
