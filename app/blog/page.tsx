import { Heading, Flex, Text } from "@radix-ui/themes";
import { BlogPosts } from "app/components/posts";

export const metadata = {
    title: "Blog",
    description: "Read my blog.",
};

export default function Page() {
    return (
        <section>
            <Flex direction="column" gap="6">
                <Heading as="h1" className="sr-only">
                    Blog
                </Heading>
                <Text className="text-neutral-400">
                    Thoughts on tools, typing systems, and the small decisions
                    that shape how we write code.
                </Text>
                <BlogPosts />
            </Flex>
        </section>
    );
}
