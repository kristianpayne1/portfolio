import Image from "next/image";
import Link from "next/link";
import { Heading, Flex, Button } from "@radix-ui/themes";
import { SiGithub } from "react-icons/si";
import { projects } from "app/projects/projects";

export const metadata = {
    title: "Projects",
    description: "A collection of projects I've worked on.",
};

export default function ProjectsPage() {
    return (
        <section>
            <Flex direction="column" gap="6">
                <Heading as="h1" className="sr-only">
                    Projects
                </Heading>
                <p className="text-neutral-400">
                    A mix of the things I have built. Mostly 3D web experiences,
                    plus some tools, games, and side projects I make in between.
                </p>
                <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
                    {projects.map((project) => (
                        <article
                            key={project.slug}
                            className="group flex flex-col  overflow-hidden rounded-lg border border-white/10 bg-white/5 transition hover:border-white/20 hover:bg-white/10"
                        >
                            <Link
                                href={project.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="relative block aspect-[16/9] overflow-hidden"
                            >
                                <Image
                                    src={project.image}
                                    alt={project.title}
                                    fill
                                    sizes="(min-width: 640px) 50vw, 100vw"
                                    className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                                />
                                {project.wip && (
                                    <span className="absolute top-3 left-3 uppercase rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[10px] text-amber-400/80">
                                        Work in progress
                                    </span>
                                )}
                            </Link>
                            <Flex
                                direction="column"
                                justify="between"
                                className="flex-1 p-6"
                            >
                                <Flex direction="column">
                                    <Link
                                        href={project.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-base font-medium text-white/80 transition hover:text-white"
                                    >
                                        {project.title}
                                    </Link>
                                    <p className="mt-2 text-sm text-white/50 line-clamp-3">
                                        {project.description}
                                    </p>
                                </Flex>
                                <Flex direction="column">
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        {project.tags.map((tag) => (
                                            <span
                                                key={tag}
                                                className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-white/60"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="mt-5 flex items-center justify-between">
                                        <Button
                                            size="2"
                                            variant="ghost"
                                            color="gray"
                                            asChild
                                        >
                                            <Link
                                                href={project.href}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                Live demo →
                                            </Link>
                                        </Button>
                                        <Link
                                            href={project.repo}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            aria-label={`${project.title} on GitHub`}
                                            className="text-white/50 transition hover:text-white"
                                        >
                                            <SiGithub size={18} />
                                        </Link>
                                    </div>
                                </Flex>
                            </Flex>
                        </article>
                    ))}
                </div>
            </Flex>
        </section>
    );
}
