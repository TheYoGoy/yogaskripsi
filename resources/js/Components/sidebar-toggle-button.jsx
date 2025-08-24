// resources/js/Components/sidebar-toggle-button.jsx
import { Menu } from "lucide-react";
import { useSidebar } from "@/Components/ui/sidebar";

export function SidebarToggleButton() {
    const { toggle } = useSidebar();

    return (
        <button
            onClick={toggle}
            className="p-2 rounded-md hover:bg-muted transition ml-auto"
        >
            <Menu className="w-5 h-5" />
        </button>
    );
}
