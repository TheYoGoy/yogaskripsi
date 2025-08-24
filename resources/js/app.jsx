// resources/js/app.jsx
import "./bootstrap";
import "../css/app.css";

import { createRoot } from "react-dom/client";
import { createInertiaApp } from "@inertiajs/react";
import { resolvePageComponent } from "laravel-vite-plugin/inertia-helpers";
import { Toaster } from "@/Components/ui/toaster"; // Impor AppToaster

const appName = import.meta.env.VITE_APP_NAME || "Laravel";

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob("./Pages/**/*.jsx")
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);
        root.render(
            <>
                <App {...props} />
                <Toaster /> {/* Tambahkan Toaster di sini */}
            </>
        );
    },
    progress: {
        color: "#4B5563",
    },
});
