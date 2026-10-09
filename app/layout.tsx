import "./global.css";
import "@radix-ui/themes/styles.css";
import type { Metadata } from "next";
import { Container, Theme } from "@radix-ui/themes";

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
                <Theme appearance="dark">
                    <Container size="2" px="4" py="6">
                        {children}
                    </Container>
                </Theme>
            </body>
        </html>
    );
}
