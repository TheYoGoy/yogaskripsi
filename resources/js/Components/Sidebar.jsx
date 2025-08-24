import { useEffect, useState } from "react";
import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarFooter,
    SidebarRail,
} from "@/Components/ui/sidebar";
import { Separator } from "@/Components/ui/separator";
import { ApplicationMenu } from "@/Components/sidebar/ApplicationMenu";
import { TransactionMenu } from "@/Components/sidebar/TransactionMenu";
import { SupportMenu } from "@/Components/sidebar/SupportMenu";
import { ManagementMenu } from "@/Components/sidebar/ManagementMenu";
import { NavUser } from "@/Components/nav-user";
import { TeamSwitcher } from "@/Components/TeamSwitcher";

const SidebarComponent = ({ auth, settings }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Debug logs
    useEffect(() => {
        console.log("=== SIDEBAR DEBUG INFO ===");
        console.log("Full auth object:", auth);
        console.log("User object:", auth?.user);
        console.log("User roles array:", auth?.user?.roles);
        console.log("User role_name:", auth?.user?.role_name);
        console.log("User role (direct):", auth?.user?.role);
        console.log("Is collapsed:", isCollapsed);
        console.log("Settings:", settings);
        console.log("========================");
    }, [auth, isCollapsed]);

    // Enhanced role detection
    const getUserRole = (user) => {
        if (!user) {
            console.error("No user object provided");
            return "staff"; // Force fallback instead of null
        }

        console.log("getUserRole - checking methods:");

        // Method 1: Try roles array (Spatie Permission format)
        if (user.roles && Array.isArray(user.roles) && user.roles.length > 0) {
            const role = user.roles[0];
            const roleName = typeof role === "object" ? role.name : role;
            console.log("Method 1 (roles array):", roleName);
            return roleName;
        }

        // Method 2: Try role_name property
        if (user.role_name) {
            console.log("Method 2 (role_name):", user.role_name);
            return user.role_name;
        }

        // Method 3: Try direct role property
        if (user.role) {
            console.log("Method 3 (direct role):", user.role);
            return user.role;
        }

        // Method 4: Use boolean flags as fallback
        if (user.is_admin) {
            console.log("Method 4 (boolean flags): admin");
            return "admin";
        }
        if (user.is_manager) {
            console.log("Method 4 (boolean flags): manager");
            return "manager";
        }
        if (user.is_staff) {
            console.log("Method 4 (boolean flags): staff");
            return "staff";
        }

        console.warn("Could not determine user role, defaulting to 'staff'");
        console.log(
            "All methods failed, available user properties:",
            Object.keys(user)
        );
        return "staff";
    };

    // Kondisi loading yang lebih longgar - hanya jika benar-benar tidak ada auth
    if (!auth) {
        console.log("No auth object, showing loading...");
        return (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                    <p>Loading sidebar...</p>
                </div>
            </div>
        );
    }

    // Jika tidak ada user, render sidebar dengan role default
    const userRole = getUserRole(auth?.user);
    const finalUserRole = userRole || "staff";

    // Additional debug info
    useEffect(() => {
        console.log("=== FINAL ROLE DETECTION ===");
        console.log("Detected user role:", userRole);
        console.log("Will render sidebar with role:", finalUserRole);
        console.log("============================");
    }, [userRole]);

    console.log("Rendering sidebar with final role:", finalUserRole);

    return (
        <Sidebar collapsible="icon" className="border-none">
            <SidebarHeader>
                <TeamSwitcher settings={settings} />
            </SidebarHeader>
            <Separator className="mb-2" />
            <SidebarContent>
                <ApplicationMenu
                    userRole={finalUserRole}
                    isCollapsed={isCollapsed}
                />
                <TransactionMenu
                    userRole={finalUserRole}
                    isCollapsed={isCollapsed}
                />
                <SupportMenu
                    userRole={finalUserRole}
                    isCollapsed={isCollapsed}
                />
            </SidebarContent>
            <ManagementMenu
                userRole={finalUserRole}
                isCollapsed={isCollapsed}
            />
            <Separator className="mb-2" />
            <SidebarFooter>
                <NavUser user={auth?.user} />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
};

export default SidebarComponent;
