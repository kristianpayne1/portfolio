import { Flex, Heading, Text, Box } from "@radix-ui/themes";
import Hero from "./components/home/hero";
import ProjectReel from "./components/home/project-reel";

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
            <Flex direction="column" gap="8">
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
                    <ProjectReel />
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
