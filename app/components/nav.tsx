"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const navItems = {
    "/": { name: "Home" },
    "/projects": { name: "Projects" },
    "/blog": { name: "Blog" },
    "/contact": { name: "Contact" },
};

export function Navbar() {
    const pathname = usePathname();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <div className="tracking-tight fixed top-6 left-0 right-0 z-50 w-full flex items-center justify-center">
            <div
                className={`px-4 py-1 rounded-(--radius-1) transition-all duration-300 ${
                    scrolled
                        ? "bg-(--accent-a3) backdrop-blur-sm shadow-[0_0_0_1px_var(--accent-a4)]"
                        : "bg-transparent"
                }`}
            >
                <nav aria-label="Main navigation" className="flex flex-row">
                    {Object.entries(navItems).map(([path, { name }]) => {
                        const isActive =
                            path === "/"
                                ? pathname === "/"
                                : pathname.startsWith(path);
                        return (
                            <Link
                                key={path}
                                href={path}
                                aria-current={isActive ? "page" : undefined}
                                className={`transition-all flex items-center relative py-1 px-3 m-1 rounded-full text-sm ${
                                    isActive
                                        ? "text-white"
                                        : "text-white/70 hover:text-white/90"
                                }`}
                            >
                                {name}
                                {isActive && (
                                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-0.5 bg-white/70" />
                                )}
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </div>
    );
}
