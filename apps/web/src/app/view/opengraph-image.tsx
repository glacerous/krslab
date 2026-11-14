import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "KRSlab";
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
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#fafaf9",
                    backgroundImage: "radial-gradient(#d4d4d0 1.5px, transparent 1.5px)",
                    backgroundSize: "32px 32px",
                    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
                }}
            >
                <div
                    style={{
                        position: "relative",
                        display: "flex",
                        width: "560px",
                        height: "200px"
                    }}
                >
                    {/* Exact 4x coordinates matching BrandLogo.tsx (viewBox 10 4 140 50) */}
                    <span
                        style={{
                            position: "absolute",
                            left: "16px",
                            top: "40px",
                            fontSize: "108px",
                            fontWeight: 700,
                            letterSpacing: "-5px",
                            color: "#141413",
                            lineHeight: 1
                        }}
                    >
                        KRS
                    </span>
                    <span
                        style={{
                            position: "absolute",
                            left: "264px",
                            top: "44px",
                            fontSize: "104px",
                            fontWeight: 400,
                            letterSpacing: "-3px",
                            color: "#141413",
                            lineHeight: 1
                        }}
                    >
                        lab
                    </span>

                    <svg
                        width="560"
                        height="200"
                        viewBox="10 4 140 50"
                        fill="none"
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0
                        }}
                    >
                        <path
                            d="M15 45.5C23 44.2 31 46.4 40 45.1C48 44 56 46 65 44.8"
                            stroke="#F59E0B"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeDasharray="4.5 3.5"
                        />
                        <path
                            d="M75 14C64 18 65 36 75 42C88 49 117 46 124 33C130 21 116 10 95 11C75 12 66 25 72 37C78 47 110 48 123 37C128 32 130 24 124 17"
                            stroke="#5B82A6"
                            strokeWidth="1.65"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                        <path
                            d="M137 8C137 12.5 137 12.5 141.5 12.5C137 12.5 137 12.5 137 17C137 12.5 137 12.5 132.5 12.5C137 12.5 137 12.5 137 8Z"
                            stroke="#F59E0B"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </div>
            </div>
        ),
        { ...size }
    );
}
