import { Heading, Flex } from "@radix-ui/themes";

export const metadata = {
    title: "Contact",
    description: "Get in touch with me.",
};

export default function ContactPage() {
    return (
        <section>
            <Flex direction="column" gap="6">
                <Heading as="h1" className="text-white/80">
                    Contact
                </Heading>
                <p className="text-neutral-400">Coming soon.</p>
            </Flex>
        </section>
    );
}
