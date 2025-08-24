// components/ModeToggleMenuItem.jsx
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { Switch } from "@/components/ui/switch";

export const ModeToggle = ({ isCollapsed }) => {
    const { theme, setTheme } = useTheme();
    const isDark = theme === "dark";

    const toggleTheme = () => {
        setTheme(isDark ? "light" : "dark");
    };

    return (
        <SidebarMenuItem>
            <SidebarMenuButton
                asChild
                className="hover:bg-indigo-700 hover:text-white"
            >
                <div
                    onClick={!isCollapsed ? undefined : toggleTheme}
                    className="flex items-center gap-2 w-full"
                >
                    {isDark ? (
                        <Moon className="h-4 w-4" />
                    ) : (
                        <Sun className="h-4 w-4" />
                    )}
                    {!isCollapsed && (
                        <>
                            <span className="text-sm">Mode Gelap</span>
                            <div className="ml-auto">
                                <Switch
                                    checked={isDark}
                                    onCheckedChange={toggleTheme}
                                />
                            </div>
                        </>
                    )}
                </div>
            </SidebarMenuButton>
        </SidebarMenuItem>
    );
};
