import "./global.css";
import type { Metadata } from "next";
import { Navbar } from "./components/nav";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Footer from "./components/footer";
import { baseUrl } from "./sitemap";
import { Theme } from "@radix-ui/themes";

import "@radix-ui/themes/styles.css";

export const metadata: Metadata = {
    metadataBase: new URL(baseUrl),
    title: {
        default: "Kristian Payne | Home",
        template: "Kristian Payne | %s",
    },
    description: "This is my portfolio.",
    openGraph: {
        title: "My Portfolio",
        description: "This is my portfolio.",
        url: baseUrl,
        siteName: "My Portfolio",
        locale: "en_US",
        type: "website",
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
        },
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
                <Theme accentColor="blue" radius="large" appearance="dark">
                    <main className="bg-[radial-gradient(900px_420px_at_18%_-10%,rgba(59,130,246,0.35),rgba(15,23,42,0.05)),linear-gradient(180deg,#0f172a_0%,#020617_55%,#000_100%)] flex-auto min-w-0 flex flex-col px-2 bg-black sm:px-10 lg:px-40 h-screen">
                        <Navbar />
                        {children}
                        <Footer />
                        <Analytics />
                        <SpeedInsights />
                    </main>
                </Theme>
            </body>
        </html>
    );
}
