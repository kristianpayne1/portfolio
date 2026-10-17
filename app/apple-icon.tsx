import { ImageResponse } from "next/og";

// The iPhone Home Screen icon: 💬 on the site's background colour (iOS needs
// a solid background). Same Noto emoji design as the tab icon in icon.tsx.

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#111113",
                    fontSize: 110,
                }}
            >
                💬
            </div>
        ),
        { ...size, emoji: "noto" }
    );
}
