"use client";

import { Bell, ChevronsUpDown, LogOut, Settings } from "lucide-react";

import { cn } from "@/lib/utils";
import { useState } from "react";
import { Inertia } from "@inertiajs/inertia";
import { Link, usePage } from "@inertiajs/react";
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "./ui/sidebar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import LogoutAlert from "./LogoutAlert";

export function NavUser({ isNavbar, btnClassName }) {
    const { props } = usePage();
    const user = props.auth?.user;

    const { isMobile } = useSidebar();
    const [showLogoutAlert, setShowLogoutAlert] = useState(false);

    if (!user) return null;

    const handleLogout = () => {
        Inertia.post(
            "/logout",
            {},
            {
                onSuccess: () => console.log("Logout berhasil"),
                onError: (err) => console.error("Logout gagal", err),
            }
        );
    };

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className={cn(
                                "data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground shadow h-12 border hover:bg-indigo-700 hover:text-white",
                                btnClassName
                            )}
                        >
                            <Avatar className="h-8 w-8 rounded-lg">
                                <AvatarImage
                                    src={user.avatar || undefined}
                                    alt={user.name}
                                />
                                <AvatarFallback className="rounded-lg">
                                    {user.name?.[0] ?? "U"}
                                </AvatarFallback>
                            </Avatar>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-semibold">
                                    {user.name}
                                </span>
                                <span className="truncate text-xs">
                                    {user.email}
                                </span>
                            </div>
                            <ChevronsUpDown className="ml-auto size-4" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                        side={isMobile || isNavbar ? "bottom" : "right"}
                        align="end"
                        sideOffset={4}
                    >
                        {!isNavbar && (
                            <DropdownMenuLabel className="p-0 font-normal">
                                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                    <Avatar className="h-8 w-8 rounded-lg">
                                        <AvatarImage
                                            src={user.avatar || undefined}
                                            alt={user.name}
                                        />
                                        <AvatarFallback className="rounded-lg">
                                            {user.name?.[0] ?? "U"}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="grid flex-1 text-left text-sm leading-tight">
                                        <span className="truncate font-semibold">
                                            {user.name}
                                        </span>
                                        <span className="truncate text-xs">
                                            {user.email}
                                        </span>
                                    </div>
                                </div>
                            </DropdownMenuLabel>
                        )}

                        <DropdownMenuSeparator />

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                            onClick={() => setShowLogoutAlert(true)}
                            className="bg-red-500 text-white hover:bg-red-600"
                        >
                            <LogOut className="mr-2 " />
                            Log out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>

            <LogoutAlert
                open={showLogoutAlert}
                onOpenChange={setShowLogoutAlert}
                onConfirm={handleLogout}
            />
        </SidebarMenu>
    );
}
