// Shared with the compose page on the upload server, so both look the same.
import "../feed-service/src/theme.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
    metadataBase: new URL("https://kristianpayne.dev"),
    title: "Kristian Payne",
    // Keep the feed out of search engines (robots.ts disallows crawling too).
    robots: {
        index: false,
        follow: false,
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body>
                <main>{children}</main>
            </body>
        </html>
    );
}
