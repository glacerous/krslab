import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "KRSlab - University KRS & Schedule Planner",
        short_name: "KRSlab",
        description: "Optimize your university academic schedule (KRS) instantly. Auto-resolve class conflicts and design your weekly layout.",
        start_url: "/",
        display: "standalone",
        background_color: "#141413",
        theme_color: "#141413",
        icons: [
            {
                src: "/icon.svg",
                sizes: "any",
                type: "image/svg+xml",
            },
            {
                src: "/og-image.png",
                sizes: "1200x630",
                type: "image/png",
            }
        ],
    };
}
