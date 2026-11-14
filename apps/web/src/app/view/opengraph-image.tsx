import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "KRSlab — Jadwal KRS";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    backgroundColor: "#fafaf9",
                    padding: "64px 72px",
                    fontFamily: "system-ui, -apple-system, sans-serif",
                    backgroundImage: "radial-gradient(#d4d4d0 1.5px, transparent 1.5px)",
                    backgroundSize: "28px 28px"
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
                    <div
                        style={{
                            width: "56px",
                            height: "56px",
                            borderRadius: "16px",
                            backgroundColor: "#141413",
                            color: "#ffffff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "28px",
                            fontWeight: 700
                        }}
                    >
                        K
                    </div>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontSize: "28px", fontWeight: 700, color: "#141413", letterSpacing: "-0.02em" }}>
                            KRSlab
                        </span>
                        <span style={{ fontSize: "16px", color: "#6e6e77" }}>
                            krslab.vercel.app
                        </span>
                    </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            fontSize: "20px",
                            fontWeight: 600,
                            color: "#5b82a6"
                        }}
                    >
                        <span>Jadwal Kuliah Mingguan</span>
                        <span>·</span>
                        <span>Anti Bentrok</span>
                    </div>
                    <div
                        style={{
                            fontSize: "58px",
                            fontWeight: 700,
                            color: "#141413",
                            lineHeight: 1.12,
                            letterSpacing: "-0.03em"
                        }}
                    >
                        Lihat & Salin Rencana KRS
                    </div>
                    <div style={{ fontSize: "26px", color: "#6e6e77", lineHeight: 1.4 }}>
                        Buka tautan ini untuk melihat jadwal lengkap atau menyalinnya ke ruang kerja kamu.
                    </div>
                </div>

                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        borderTop: "2px solid #e6e6e3",
                        paddingTop: "24px",
                        fontSize: "20px",
                        color: "#6e6e77"
                    }}
                >
                    <span>Susun KRS otomatis · BIMA / SIAKAD</span>
                    <span style={{ fontWeight: 600, color: "#141413" }}>Buka Jadwal →</span>
                </div>
            </div>
        ),
        { ...size }
    );
}
