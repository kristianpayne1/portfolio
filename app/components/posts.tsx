import Link from "next/link";
import { Heading, Text, Flex } from "@radix-ui/themes";
import { formatDate, getBlogPosts, getReadingTime } from "app/blog/utils";

export function BlogPosts() {
    const allBlogs = getBlogPosts().sort(
        (a, b) =>
            new Date(b.metadata.publishedAt).getTime() -
            new Date(a.metadata.publishedAt).getTime()
    );

    return (
        <Flex direction="column">
            {allBlogs.map((post) => (
                <Link
                    key={post.slug}
                    href={`/blog/${post.slug}`}
                    className="group block border-b border-white/10 py-10 last:border-b-0"
                >
                    <Flex direction="column" gap="3">
                        <Text
                            size="1"
                            className="uppercase tracking-wider text-white/40"
                        >
                            {formatDate(post.metadata.publishedAt)} ·{" "}
                            {getReadingTime(post.content)}
                        </Text>
                        <Flex align="center" justify="between" gap="4">
                            <Heading
                                as="h2"
                                size={{ initial: "6", sm: "7" }}
                                weight="medium"
                                className="tracking-tight text-white/85 transition group-hover:text-white"
                            >
                                {post.metadata.title}
                            </Heading>
                            <Text
                                size="4"
                                className="shrink-0 text-white/30 transition group-hover:translate-x-0.5 group-hover:text-white/70"
                            >
                                →
                            </Text>
                        </Flex>
                        <Text
                            size="2"
                            className="line-clamp-2 max-w-2xl text-white/50"
                        >
                            {post.metadata.summary}
                        </Text>
                    </Flex>
                </Link>
            ))}
        </Flex>
    );
}
