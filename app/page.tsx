import React from "react";
import { Flex, Heading, Button, Link } from "@radix-ui/themes";
import Hero from "./components/home/hero";
import ProjectReel from "./components/home/project-reel";
import BlogHighlights from "./components/home/blog-highlights";
import {
    SiHtml5,
    SiReact,
    SiNextdotjs,
    SiNodedotjs,
    SiTypescript,
    SiRust,
    SiPython,
    SiThreedotjs,
} from "react-icons/si";
import { IconType } from "react-icons";

const technologies: { name: string; icon: IconType; color: string }[] = [
    { name: "HTML / JS", icon: SiHtml5, color: "#e34f26" },
    { name: "React", icon: SiReact, color: "#61dafb" },
    { name: "Next.js", icon: SiNextdotjs, color: "#ffffff" },
    { name: "Node", icon: SiNodedotjs, color: "#339933" },
    { name: "TypeScript", icon: SiTypescript, color: "#3178c6" },
    { name: "Rust", icon: SiRust, color: "#ce422b" },
    { name: "Python", icon: SiPython, color: "#3776ab" },
    { name: "Three.js", icon: SiThreedotjs, color: "#ffffff" },
];

export default function Home() {
    return (
        <section>
            <Flex direction="column" gap="12rem">
                <Hero />
                <div>
                    <Flex align="end" justify="between" className="mb-4">
                        <Heading as="h2" className="text-white/80">
                            Highlights
                        </Heading>
                        <Button size="2" variant="ghost" asChild>
                            <Link href="/projects" color="gray">
                                View All Projects →
                            </Link>
                        </Button>
                    </Flex>
                    <ProjectReel />
                </div>
                <div>
                    <Heading as="h2" className="text-white/80">
                        Technologies
                    </Heading>
                    <div className="mt-6 grid grid-cols-4 gap-8 lg:grid-cols-8">
                        {technologies.map((tech) => (
                            <div
                                key={tech.name}
                                className="group flex flex-col items-center gap-2"
                                style={
                                    {
                                        "--brand": tech.color,
                                    } as React.CSSProperties
                                }
                            >
                                <tech.icon
                                    size={64}
                                    className="text-white/70 transition-colors duration-300 group-hover:text-(--brand)"
                                />
                                <span className="text-xs text-white/50">
                                    {tech.name}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
                <div>
                    <Flex align="end" justify="between" className="mb-4">
                        <Heading as="h2" className="text-white/80">
                            Latest Posts
                        </Heading>
                        <Button size="2" variant="ghost" asChild>
                            <Link href="/blog" color="gray">
                                View All Posts →
                            </Link>
                        </Button>
                    </Flex>
                    <BlogHighlights />
                </div>
            </Flex>
        </section>
    );
}
