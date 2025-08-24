import React from "react";
import {
    SidebarProvider,
    Sidebar,
    SidebarInset,
} from "@/Components/ui/sidebar";
import SidebarComponent from "@/Components/Sidebar";
import Upbar from "@/Components/Upbar";
import { usePage } from "@inertiajs/react";
import { ThemeProvider } from "@/Components/theme-provider";
import { Toaster } from "@/Components/ui/toaster";

export default function Layout({ children, title }) {
    const { auth, settings } = usePage().props;

    // Debug logging (hapus setelah fix)
    console.log("🏗️ Layout rendering...");
    console.log("Layout - Auth data:", auth);
    console.log("Layout - Settings data:", settings);

    return (
        <>
            <ThemeProvider>
                <SidebarProvider>
                    <SidebarComponent auth={auth} settings={settings} />
                    <SidebarInset>
                        <Upbar />
                        <main className="p-4">{children}</main>
                    </SidebarInset>
                </SidebarProvider>
                <Toaster />
            </ThemeProvider>
        </>
    );
}
