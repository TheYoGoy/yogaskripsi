import React from "react";
import { usePage, Link } from "@inertiajs/react";
import { Users } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";

import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
} from "@/components/ui/sidebar";

export const ManagementMenu = ({ userRole, isCollapsed }) => {
    const { url } = usePage();

    const items = [
        {
            name: "Pengguna",
            href: route("users.index"),
            icon: Users,
            allowedRoles: ["admin"],
        },
        // Settings removed
    ];

    const visibleItems = items.filter((item) =>
        item.allowedRoles.includes(userRole)
    );

    if (visibleItems.length === 0) {
        // Still render for dark mode toggle even if no menu items
        return (
            <SidebarGroup>
                <SidebarMenu>
                    {/* Dark Mode Toggle placed cleanly */}
                    <ModeToggle isCollapsed={isCollapsed} />
                </SidebarMenu>
            </SidebarGroup>
        );
    }

    return (
        <SidebarGroup>
            <SidebarGroupLabel>Management</SidebarGroupLabel>
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

                {/* Dark Mode Toggle placed cleanly */}
                <ModeToggle isCollapsed={isCollapsed} />
            </SidebarMenu>
        </SidebarGroup>
    );
};
