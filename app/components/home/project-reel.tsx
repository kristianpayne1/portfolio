"use client";

import Marquee from "react-fast-marquee";
import Image from "next/image";
import Link from "next/link";

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
        <div className="relative left-1/2 -translate-x-1/2">
            <Marquee
                pauseOnHover
                speed={40}
                gradient
                gradientColor="#000000"
                gradientWidth={120}
            >
                {projects.map((project) => (
                    <Link
                        key={project.href}
                        href={project.href}
                        className="mx-[15px] block"
                    >
                        <div className="flex flex-col gap-3 ">
                            <div className="mt-1 relative h-[150px] w-[240px] overflow-hidden rounded-[8px] border border-white/10 transition-all duration-300 hover:ring-2 hover:ring-white/50">
                                <Image
                                    src={project.image}
                                    alt={project.title}
                                    fill
                                    className="object-cover transition-transform duration-300 hover:scale-[1.05]"
                                />
                            </div>
                            <p className="text-sm text-white">
                                {project.title}
                            </p>
                        </div>
                    </Link>
                ))}
            </Marquee>
        </div>
    );
}
