"use client";

import Image from "next/image";
import Link from "next/link";
import Marquee from "app/components/marquee";
import { projects } from "app/projects/projects";

export default function ProjectReel() {
    return (
        <Marquee className="left-1/2 -translate-x-1/2 py-1" showArrows>
            {projects.map((project) => (
                <Link
                    key={project.slug}
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
