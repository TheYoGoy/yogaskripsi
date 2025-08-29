"use client";

import React from "react";
import { SidebarTrigger } from "./ui/sidebar";
import { NavUser } from "./nav-user";
import { usePage, Link, router } from "@inertiajs/react";
import { Separator } from "./ui/separator";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Bell, CheckCheck, Eye } from "lucide-react";
import { Button } from "./ui/button";

const Upbar = () => {
    const { props } = usePage();
    const pageTitle =
        typeof props.pageTitle === "string" ? props.pageTitle : "Dashboard";

    // Ambil data dari props yang dishare via AppServiceProvider
    const ropWarnings = props.ropWarnings || [];
    const unreadCount = props.unreadNotificationsCount || 0;

    const markAsRead = async (notificationId) => {
        try {
            await router.patch(
                `/notifications/${notificationId}/read`,
                {},
                {
                    preserveState: true,
                    preserveScroll: true,
                    onSuccess: () => {
                        // Reload untuk update notification count
                        router.reload({
                            only: ["ropWarnings", "unreadNotificationsCount"],
                        });
                    },
                }
            );
        } catch (error) {
            console.error("Failed to mark notification as read:", error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await router.patch(
                "/notifications/read-all",
                {},
                {
                    preserveState: true,
                    preserveScroll: true,
                    onSuccess: () => {
                        router.reload({
                            only: ["ropWarnings", "unreadNotificationsCount"],
                        });
                    },
                }
            );
        } catch (error) {
            console.error("Failed to mark all notifications as read:", error);
        }
    };

    const getUrgencyIcon = (urgencyLevel) => {
        switch (urgencyLevel) {
            case "critical":
            case "out_of_stock":
                return "🔴";
            case "high":
                return "🟠";
            case "medium":
                return "🟡";
            default:
                return "🔵";
        }
    };

    const getUrgencyBgColor = (urgencyLevel) => {
        switch (urgencyLevel) {
            case "critical":
                return "bg-red-50 border-l-4 border-l-red-500";
            case "high":
                return "bg-orange-50 border-l-4 border-l-orange-500";
            case "medium":
                return "bg-yellow-50 border-l-4 border-l-yellow-500";
            case "out_of_stock":
                return "bg-gray-50 border-l-4 border-l-gray-500";
            default:
                return "bg-blue-50 border-l-4 border-l-blue-500";
        }
    };

    return (
        <>
            <header className="sticky z-10 bg-background/95 supports-[backdrop-filter]:bg-background/60 backdrop-blur top-0 flex shrink-0 items-center gap-2 h-16 px-3">
                <SidebarTrigger />

                <div className="ml-auto flex items-center gap-2">
                    {/* Enhanced Notifications */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="relative"
                            >
                                <Bell className="h-5 w-5" />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-medium">
                                        {unreadCount > 9 ? "9+" : unreadCount}
                                    </span>
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-80">
                            {/* Header */}
                            <div className="flex items-center justify-between p-3 border-b">
                                <span className="font-semibold">
                                    Notifikasi Stok Rendah
                                </span>
                                {unreadCount > 0 && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={markAllAsRead}
                                        className="text-xs h-7"
                                    >
                                        <CheckCheck className="h-3 w-3 mr-1" />
                                        Tandai Semua
                                    </Button>
                                )}
                            </div>

                            {/* Notifications List */}
                            <div className="max-h-96 overflow-y-auto">
                                {ropWarnings.length === 0 ? (
                                    <div className="p-4 text-center text-muted-foreground">
                                        Tidak ada notifikasi stok rendah.
                                    </div>
                                ) : (
                                    ropWarnings.map((notification) => (
                                        <div
                                            key={notification.id}
                                            className={`p-3 cursor-pointer hover:bg-muted/30 ${getUrgencyBgColor(
                                                notification.urgency_level
                                            )}`}
                                            onClick={() =>
                                                markAsRead(notification.id)
                                            }
                                        >
                                            <div className="flex items-start gap-2">
                                                <span className="text-sm mt-0.5">
                                                    {getUrgencyIcon(
                                                        notification.urgency_level
                                                    )}
                                                </span>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span
                                                            className="text-xs px-2 py-1 rounded-full bg-opacity-20 font-medium"
                                                            style={{
                                                                backgroundColor:
                                                                    notification.urgency_level ===
                                                                    "critical"
                                                                        ? "#fee2e2"
                                                                        : notification.urgency_level ===
                                                                          "high"
                                                                        ? "#fef3c7"
                                                                        : notification.urgency_level ===
                                                                          "medium"
                                                                        ? "#fef9c3"
                                                                        : "#dbeafe",
                                                                color:
                                                                    notification.urgency_level ===
                                                                    "critical"
                                                                        ? "#dc2626"
                                                                        : notification.urgency_level ===
                                                                          "high"
                                                                        ? "#d97706"
                                                                        : notification.urgency_level ===
                                                                          "medium"
                                                                        ? "#ca8a04"
                                                                        : "#2563eb",
                                                            }}
                                                        >
                                                            {
                                                                notification.urgency_label
                                                            }
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {
                                                                notification.created_at
                                                            }
                                                        </span>
                                                    </div>

                                                    <Link
                                                        href={route(
                                                            "products.show",
                                                            notification.product_id
                                                        )}
                                                        className="font-medium hover:underline text-sm block mb-1"
                                                        onClick={(e) =>
                                                            e.stopPropagation()
                                                        }
                                                    >
                                                        {notification.name}
                                                    </Link>

                                                    <div className="text-xs text-muted-foreground mb-1">
                                                        SKU: {notification.sku}
                                                    </div>

                                                    <div className="text-xs">
                                                        <span className="font-medium text-red-600">
                                                            Stok:{" "}
                                                            {notification.stock}{" "}
                                                            unit
                                                        </span>
                                                        <span className="text-muted-foreground mx-2">
                                                            •
                                                        </span>
                                                        <span>
                                                            ROP:{" "}
                                                            {notification.rop}{" "}
                                                            unit
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Footer - Link ke halaman notifikasi */}
                            {ropWarnings.length > 0 && (
                                <>
                                    <DropdownMenuSeparator />
                                    <div className="p-2">
                                        <Link
                                            href="/notifications"
                                            className="flex items-center justify-center w-full text-center text-sm font-medium py-2 hover:bg-muted/50 rounded"
                                        >
                                            <Eye className="h-4 w-4 mr-2" />
                                            Lihat Semua Notifikasi
                                        </Link>
                                    </div>
                                </>
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
