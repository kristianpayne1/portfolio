import { Flex, Heading, Text, Button, Link, Box } from "@radix-ui/themes";
import { HeroCanvas } from "./hero-canvas";

export default function Hero() {
    return (
        <Flex className="mt-10 flex-col gap-10 lg:flex-row lg:items-center" justify="center">
            <Box className="max-w-xl z-1">
                <Heading
                    as="h1"
                    size="8"
                    className="text-white mt-4 text-4xl font-bold leading-tight sm:text-5xl text-center"
                >
                    Software Engineer
                </Heading>
                <Text
                    as="p"
                    className="text-center mt-4 text-base leading-relaxed text-white/70"
                >
                    I build modern web experiences with a focus on UI and 3D.
                </Text>
                <Flex
                    gap="4"
                    className="mt-6"
                    wrap="wrap"
                    align="center"
                    justify="center"
                >
                    <Button size="3" variant="soft" asChild>
                        <Link href="/projects" color="gray">
                            View Projects →
                        </Link>
                    </Button>
                    <Button size="3" variant="ghost" asChild>
                        <Link href="/contact" color="gray">
                            Contact Me
                        </Link>
                    </Button>
                </Flex>
            </Box>
            <HeroCanvas />
        </Flex>
    );
}
