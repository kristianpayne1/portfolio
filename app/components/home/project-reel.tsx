"use client";

import Image from "next/image";
import Link from "next/link";
import Marquee from "app/components/marquee";

const projects = [
    {
        title: "ThreeJS | Chess",
        image: "/projects/chess.png",
        href: "https://kristianpayne1.github.io/threejs-chess/",
    },
    {
        title: "ThreeJS | Forest Road",
        image: "/projects/landscape.png",
        href: "https://kristianpayne1.github.io/threejs-forest-road/",
    },
    {
        title: "ThreeJS | Pirate Ship",
        image: "/projects/boat.png",
        href: "https://kristianpayne1.github.io/threejs-pirate-ship/",
    },
    {
        title: "ThreeJS | Space Ship",
        image: "/projects/space.png",
        href: "https://kristianpayne1.github.io/threejs-space-ship/",
    },
    {
        title: "ThreeJS | Basketball",
        image: "/projects/basketball.png",
        href: "https://kristianpayne1.github.io/threejs-basketball/",
    },
];

export default function ProjectReel() {
    return (
        <Marquee className="left-1/2 -translate-x-1/2 py-1">
            {projects.map((project) => (
                <Link
                    key={project.href}
                    href={project.href}
                    className="mx-[15px] block shrink-0"
                >
                    <div className="flex flex-col gap-3">
                        <div className="mt-1 relative h-[150px] w-[240px] overflow-hidden rounded-lg border border-black transition-all duration-300 hover:ring-2 hover:ring-white/50">
                            <Image
                                src={project.image}
                                alt={project.title}
                                fill
                                sizes="240px"
                                className="object-cover transition-transform duration-300 hover:scale-[1.05]"
                            />
                        </div>
                        <p className="text-sm text-white">{project.title}</p>
                    </div>
                </Link>
            ))}
        </Marquee>
    );
}
