import { ImageResponse } from "next/og";

// The browser tab icon: the 💬 emoji. Drawn with the openly licensed Noto
// emoji design (fetched when the site builds), so it looks the same on every
// device instead of depending on each device's emoji font.

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 28,
                }}
            >
                💬
            </div>
        ),
        { ...size, emoji: "noto" }
    );
}
