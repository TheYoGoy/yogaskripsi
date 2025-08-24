import React from "react";
import { ChevronsUpDown } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar";

export function TeamSwitcher({ settings }) {
    const { isMobile } = useSidebar();

    // Default company info
    const companyName = "Brawijaya Digital Print";
    const companyTagline = "Solusi Cetak Digital Terpercaya";
    const companyInitial = "B"; // First letter of Brawijaya

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                        >
                            <div className="flex aspect-square size-8 items-center justify-center rounded-lg overflow-hidden text-white">
                                <img
                                    src="/logobrawijaya.png"
                                    alt="Brawijaya Digital Print Logo"
                                    className="object-cover w-full h-full"
                                    onError={(e) => {
                                        // Fallback to initial if logo fails to load
                                        e.target.style.display = "none";
                                        e.target.nextSibling.style.display =
                                            "block";
                                    }}
                                />
                                <div
                                    className="text-xs font-bold"
                                    style={{ display: "none" }}
                                >
                                    {companyInitial}
                                </div>
                            </div>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-semibold">
                                    {companyName}
                                </span>
                                <span className="truncate text-xs text-muted-foreground">
                                    {companyTagline}
                                </span>
                            </div>
                            <ChevronsUpDown className="ml-auto" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                        align="start"
                        side={isMobile ? "bottom" : "right"}
                        sideOffset={4}
                    >
                        <DropdownMenuLabel className="text-xs text-muted-foreground">
                            Perusahaan
                        </DropdownMenuLabel>
                        <DropdownMenuItem className="gap-2 p-2">
                            <div className="flex flex-col">
                                <div className="font-medium">{companyName}</div>
                                <div className="text-xs text-muted-foreground">
                                    {companyTagline}
                                </div>
                            </div>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="gap-2 p-2" disabled>
                            <div className="font-medium text-muted-foreground">
                                Ganti Perusahaan (coming soon)
                            </div>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
