import Link from "next/link";
import { Box, Button, Flex, Heading, Text } from "@radix-ui/themes";
import Hero from "./components/home/hero";

const highlights = [
    {
        title: "Project Name",
        tone: "from-sky-500/40 via-slate-900/10 to-slate-900/10",
    },
    {
        title: "Project Name",
        tone: "from-amber-400/40 via-slate-900/10 to-slate-900/10",
    },
    {
        title: "Project Name",
        tone: "from-cyan-400/40 via-slate-900/10 to-slate-900/10",
    },
    {
        title: "Project Name",
        tone: "from-violet-500/40 via-slate-900/10 to-slate-900/10",
    },
    {
        title: "Project Name",
        tone: "from-emerald-400/40 via-slate-900/10 to-slate-900/10",
    },
];

const technologies = [
    "HTML / JS",
    "React",
    "Next.js",
    "Node",
    "Swift",
    "Rust",
    "Python",
];

export default function Home() {
    return (
        <section>
            <Flex direction="column" gap="8" className="relative">
                <Hero />
                <div className="mt-4">
                    <Flex align="end" justify="between" className="mb-4">
                        <Heading as="h2" size="4" className="text-white/80">
                            Highlights
                        </Heading>
                        <Text as="p" className="text-sm text-white/60">
                            View All Projects →
                        </Text>
                    </Flex>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                        {highlights.map((item, index) => (
                            <Box
                                key={`${item.title}-${index}`}
                                className={`h-36 rounded-2xl border border-white/10 bg-gradient-to-br ${item.tone} p-4 shadow-[0_20px_50px_rgba(2,6,23,0.55)]`}
                            >
                                <div className="flex h-full flex-col justify-end">
                                    <Text
                                        as="p"
                                        className="text-sm text-white/80"
                                    >
                                        {item.title}
                                    </Text>
                                </div>
                            </Box>
                        ))}
                    </div>
                </div>

                <div className="mt-12">
                    <Heading as="h2" size="4" className="text-white/80">
                        Technologies
                    </Heading>
                    <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-7">
                        {technologies.map((tech) => (
                            <Box
                                key={tech}
                                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-6 text-center text-sm text-white/70"
                            >
                                {tech}
                            </Box>
                        ))}
                    </div>
                </div>
            </Flex>
        </section>
    );
}
