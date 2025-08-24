"use client";

import React from "react";
import { SidebarTrigger } from "./ui/sidebar";
import { NavUser } from "./nav-user";
import { usePage, Link } from "@inertiajs/react";
import { Separator } from "./ui/separator";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Bell } from "lucide-react";
import { Button } from "./ui/button";

const Upbar = () => {
    const { props } = usePage();
    const pageTitle =
        typeof props.pageTitle === "string" ? props.pageTitle : "Dashboard";

    const ropWarnings = props.ropWarnings || [];

    return (
        <>
            <header className="sticky z-10 bg-background/95 supports-[backdrop-filter]:bg-background/60 backdrop-blur top-0 flex shrink-0 items-center gap-2 h-16 px-3">
                <SidebarTrigger />

                <div className="ml-auto flex items-center gap-2">
                    {/* Notifikasi */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="relative"
                            >
                                <Bell className="h-5 w-5" />
                                {ropWarnings.length > 0 && (
                                    <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500" />
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-72">
                            <DropdownMenuItem className="font-semibold">
                                Notifikasi Stok Rendah
                            </DropdownMenuItem>
                            {ropWarnings.length === 0 ? (
                                <DropdownMenuItem className="text-muted-foreground">
                                    Tidak ada notifikasi.
                                </DropdownMenuItem>
                            ) : (
                                ropWarnings.map((item) => (
                                    <DropdownMenuItem
                                        key={item.id}
                                        className="text-sm whitespace-normal"
                                    >
                                        <Link
                                            href={route(
                                                "products.index",
                                                item.id
                                            )}
                                            className="w-full hover:underline"
                                        >
                                            ⚠️ <strong>{item.name}</strong>:{" "}
                                            {item.stock} unit (ROP: {item.rop})
                                        </Link>
                                    </DropdownMenuItem>
                                ))
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* User dropdown */}
                    <NavUser />
                </div>
            </header>
            <Separator />
        </>
    );
};

export default Upbar;
