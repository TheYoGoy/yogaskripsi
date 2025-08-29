import React, { useState } from "react";
import Layout from "@/Layouts/Layout";
import { Head, Link, router } from "@inertiajs/react";
import { Button } from "@/Components/ui/button";
import { Card, CardContent } from "@/Components/ui/card";
import { CheckCheck, Eye, Trash2, Filter, Bell } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/Components/ui/select";

export default function Index(props) {
    // Console debug untuk melihat props yang dikirim
    console.log("Notification Index props:", props);

    // Destructure dengan fallback yang sangat aman
    const notifications = props?.notifications || {
        data: [],
        links: [],
        last_page: 1,
    };
    const unreadCount = props?.unreadCount || 0;
    const filters = props?.filters || {};
    const auth = props?.auth; // Add this line to extract auth from props

    // useState dengan fallback yang aman
    const [selectedFilter, setSelectedFilter] = useState(() => {
        const filterValue = filters?.filter;
        return filterValue && typeof filterValue === "string"
            ? filterValue
            : "all";
    });

    // Data dengan fallback aman
    const notificationData = Array.isArray(notifications?.data)
        ? notifications.data
        : [];
    const notificationLinks = Array.isArray(notifications?.links)
        ? notifications.links
        : [];
    const lastPage = notifications?.last_page || 1;

    const handleFilterChange = (value) => {
        setSelectedFilter(value);
        router.get(
            route("notifications.index"),
            {
                filter: value === "all" ? null : value,
            },
            { preserveState: true }
        );
    };

    const markAsRead = (id) => {
        router.patch(
            route("notifications.read", id),
            {},
            {
                preserveState: true,
                onSuccess: () => {
                    router.reload({ only: ["notifications", "unreadCount"] });
                },
            }
        );
    };

    const markAllAsRead = () => {
        router.patch(
            route("notifications.read-all"),
            {},
            {
                preserveState: true,
                onSuccess: () => {
                    router.reload({ only: ["notifications", "unreadCount"] });
                },
            }
        );
    };

    const deleteNotification = (id) => {
        if (confirm("Hapus notifikasi ini?")) {
            router.delete(route("notifications.destroy", id));
        }
    };

    const getUrgencyColor = (urgencyLevel) => {
        const colors = {
            critical: "bg-red-100 text-red-800 border-red-200",
            high: "bg-orange-100 text-orange-800 border-orange-200",
            medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
            low: "bg-blue-100 text-blue-800 border-blue-200",
            out_of_stock: "bg-gray-100 text-gray-800 border-gray-200",
        };
        return (
            colors[urgencyLevel] || "bg-gray-100 text-gray-800 border-gray-200"
        );
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

    return (
        <Layout user={auth?.user}>
            {" "}
            {/* Use optional chaining here */}
            <Head title="Notifikasi" />
            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="mb-6">
                        <div className="flex items-center gap-3 mb-2">
                            <Bell className="h-6 w-6 text-blue-600" />
                            <h1 className="text-2xl font-semibold text-gray-900">
                                Notifikasi
                            </h1>
                        </div>
                        <p className="text-gray-600">
                            {unreadCount > 0
                                ? `${unreadCount} notifikasi belum dibaca`
                                : "Semua notifikasi sudah dibaca"}
                        </p>
                    </div>

                    {/* Controls */}
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-4">
                            <Select
                                value={selectedFilter}
                                onValueChange={handleFilterChange}
                            >
                                <SelectTrigger className="w-40">
                                    <Filter className="h-4 w-4 mr-2" />
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua</SelectItem>
                                    <SelectItem value="unread">
                                        Belum Dibaca
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {unreadCount > 0 && (
                            <Button onClick={markAllAsRead} variant="outline">
                                <CheckCheck className="h-4 w-4 mr-2" />
                                Tandai Semua Dibaca
                            </Button>
                        )}
                    </div>

                    {/* Notifications List */}
                    <div className="space-y-4">
                        {notificationData.length === 0 ? (
                            <Card>
                                <CardContent className="text-center py-8">
                                    <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-500">
                                        {selectedFilter === "unread"
                                            ? "Tidak ada notifikasi belum dibaca."
                                            : "Tidak ada notifikasi."}
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            notificationData.map((notification) => {
                                const data = notification?.data || {};

                                return (
                                    <Card
                                        key={notification.id}
                                        className={`${
                                            !notification.read_at
                                                ? "border-l-4 border-l-blue-500 bg-blue-50/30"
                                                : ""
                                        }`}
                                    >
                                        <CardContent className="p-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <span className="text-lg">
                                                            {data.urgency_level &&
                                                                getUrgencyIcon(
                                                                    data.urgency_level
                                                                )}
                                                        </span>
                                                        <span
                                                            className={`px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(
                                                                data.urgency_level ||
                                                                    "low"
                                                            )}`}
                                                        >
                                                            {data.urgency_label ||
                                                                "Rendah"}
                                                        </span>
                                                        <span className="text-sm text-gray-500">
                                                            {notification.created_at
                                                                ? new Date(
                                                                      notification.created_at
                                                                  ).toLocaleDateString(
                                                                      "id-ID",
                                                                      {
                                                                          day: "numeric",
                                                                          month: "long",
                                                                          year: "numeric",
                                                                          hour: "2-digit",
                                                                          minute: "2-digit",
                                                                      }
                                                                  )
                                                                : "Unknown"}
                                                        </span>
                                                    </div>

                                                    <h3 className="font-medium text-gray-900 mb-2">
                                                        {data.title ||
                                                            "Notifikasi Stok Rendah"}
                                                    </h3>

                                                    <p className="text-sm text-gray-600 mb-3">
                                                        {data.message ||
                                                            "Tidak ada pesan"}
                                                    </p>

                                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                                        <span>
                                                            Produk:{" "}
                                                            <strong>
                                                                {data.product_name ||
                                                                    "Unknown"}
                                                            </strong>
                                                        </span>
                                                        <span>
                                                            SKU:{" "}
                                                            <strong>
                                                                {data.product_sku ||
                                                                    "Unknown"}
                                                            </strong>
                                                        </span>
                                                        <span>
                                                            Stok:{" "}
                                                            <strong className="text-red-600">
                                                                {data.current_stock ||
                                                                    0}
                                                            </strong>
                                                        </span>
                                                        <span>
                                                            ROP:{" "}
                                                            <strong>
                                                                {data.rop || 0}
                                                            </strong>
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 ml-4">
                                                    {data.action_url && (
                                                        <Button
                                                            asChild
                                                            variant="outline"
                                                            size="sm"
                                                        >
                                                            <Link
                                                                href={
                                                                    data.action_url
                                                                }
                                                            >
                                                                <Eye className="h-4 w-4 mr-1" />
                                                                Lihat
                                                            </Link>
                                                        </Button>
                                                    )}

                                                    {!notification.read_at && (
                                                        <Button
                                                            onClick={() =>
                                                                markAsRead(
                                                                    notification.id
                                                                )
                                                            }
                                                            variant="ghost"
                                                            size="sm"
                                                            title="Tandai sudah dibaca"
                                                        >
                                                            <CheckCheck className="h-4 w-4" />
                                                        </Button>
                                                    )}

                                                    <Button
                                                        onClick={() =>
                                                            deleteNotification(
                                                                notification.id
                                                            )
                                                        }
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-red-600 hover:text-red-700"
                                                        title="Hapus notifikasi"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
}
