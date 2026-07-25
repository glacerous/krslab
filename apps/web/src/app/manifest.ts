import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "KRSlab - UPNYK Academic Schedule Optimizer",
        short_name: "KRSlab",
        description: "Optimize your university academic schedule (KRS) instantly. Auto-resolve class conflicts and design your weekly layout.",
        start_url: "/",
        display: "standalone",
        background_color: "#0a0a0a",
        theme_color: "#84cc16",
        icons: [
            {
                src: "/favicon.ico",
                sizes: "any",
                type: "image/x-icon",
            },
            {
                src: "/og-image.png",
                sizes: "1200x630",
                type: "image/png",
            }
        ],
    };
}
