"use client";

import dynamic from "next/dynamic";

const HeroCanvas = dynamic(
    () => import("./hero-canvas").then((m) => m.HeroCanvas),
    { ssr: false }
);

export function HeroCanvasDynamic() {
    return <HeroCanvas />;
}
