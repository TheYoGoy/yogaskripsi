"use client";

import { ChevronsUpDown, LogOut } from "lucide-react";

import { cn } from "@/lib/utils";
import { useState } from "react";
import { router } from "@inertiajs/react";
import { usePage } from "@inertiajs/react";
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "./ui/sidebar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import LogoutAlert from "./LogoutAlert";

export function NavUser({ isNavbar, btnClassName }) {
    const { props } = usePage();
    const user = props.auth?.user;

    const { isMobile } = useSidebar();
    const [showLogoutAlert, setShowLogoutAlert] = useState(false);

    if (!user) return null;

    const handleLogout = () => {
        router.post('/logout', {}, {
            onSuccess: () => {
                console.log("Keluar berhasil");
                // Force redirect ke login page
                window.location.href = '/login';
            },
            onError: (err) => {
                console.error("Keluar gagal", err);
            }
        });
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

                        <DropdownMenuItem
                            onClick={() => setShowLogoutAlert(true)}
                            className="bg-red-500 text-white hover:bg-red-600"
                        >
                            <LogOut className="mr-2" />
                            Keluar
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