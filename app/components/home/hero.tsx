import { Flex, Heading, Text, Button, Link, Box } from "@radix-ui/themes";

export default function Hero() {
    return (
        <Flex className="mt-10 flex-col gap-10 lg:flex-row lg:items-center">
            <Box className="max-w-xl">
                <Heading
                    as="h1"
                    size="8"
                    className="text-white mt-4 text-4xl font-bold leading-tight sm:text-5xl"
                >
                    Software Engineer
                </Heading>
                <Text
                    as="p"
                    className="mt-4 max-w-md text-base leading-relaxed text-white/70"
                >
                    I build modern web experiences with a focus on UI and 3D.
                    Crafting product stories that feel cinematic, tactile, and
                    user-first.
                </Text>
                <Flex gap="4" className="mt-6" wrap="wrap" align="center">
                    <Button asChild size="3" variant="soft">
                        <Link href="/projects">View Projects →</Link>
                    </Button>
                    <Button asChild size="3" variant="ghost">
                        <Link href="/contact">Contact Me</Link>
                    </Button>
                </Flex>
            </Box>
        </Flex>
    );
}
