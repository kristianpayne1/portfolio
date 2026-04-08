import { Heading, Flex } from "@radix-ui/themes";

export const metadata = {
    title: "Projects",
    description: "A collection of projects I've worked on.",
};

export default function ProjectsPage() {
    return (
        <section>
            <Flex direction="column" gap="6">
                <Heading as="h1" className="text-white/80">
                    Projects
                </Heading>
                <p className="text-neutral-400">Coming soon.</p>
            </Flex>
        </section>
    );
}
