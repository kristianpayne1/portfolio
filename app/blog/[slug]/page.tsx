import Link from "next/link";
import { notFound } from "next/navigation";
import { Heading, Text, Flex } from "@radix-ui/themes";
import { CustomMDX } from "app/components/mdx";
import { formatDate, getBlogPosts, getReadingTime } from "app/blog/utils";
import { baseUrl } from "app/sitemap";

export async function generateStaticParams() {
    const posts = getBlogPosts();

    return posts.map((post) => ({
        slug: post.slug,
    }));
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const post = getBlogPosts().find((post) => post.slug === slug);
    if (!post) {
        return;
    }

    const {
        title,
        publishedAt: publishedTime,
        summary: description,
        image,
    } = post.metadata;
    const ogImage = image
        ? image
        : `${baseUrl}/og?title=${encodeURIComponent(title)}`;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            type: "article",
            publishedTime,
            url: `${baseUrl}/blog/${post.slug}`,
            images: [
                {
                    url: ogImage,
                },
            ],
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: [ogImage],
        },
    };
}

export default async function Blog({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const post = getBlogPosts().find((post) => post.slug === slug);

    if (!post) {
        notFound();
    }

    return (
        <section>
            <script
                type="application/ld+json"
                suppressHydrationWarning
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "BlogPosting",
                        headline: post.metadata.title,
                        datePublished: post.metadata.publishedAt,
                        dateModified: post.metadata.publishedAt,
                        description: post.metadata.summary,
                        image: post.metadata.image
                            ? `${baseUrl}${post.metadata.image}`
                            : `/og?title=${encodeURIComponent(post.metadata.title)}`,
                        url: `${baseUrl}/blog/${post.slug}`,
                        author: {
                            "@type": "Person",
                            name: "My Portfolio",
                        },
                    }),
                }}
            />
            <Flex direction="column">
                <Link
                    href="/blog"
                    className="mb-12 inline-block w-fit text-white/40 transition hover:text-white/70"
                >
                    <Text size="2">← All posts</Text>
                </Link>
                <Text
                    size="1"
                    className="uppercase tracking-wider text-white/40"
                >
                    {formatDate(post.metadata.publishedAt)} ·{" "}
                    {getReadingTime(post.content)}
                </Text>
                <Heading
                    as="h1"
                    size={{ initial: "8", sm: "9" }}
                    weight="medium"
                    className="title mt-3 tracking-tight text-white/95"
                >
                    {post.metadata.title}
                </Heading>
                <Text as="p" size="3" className="mt-6 text-white/60">
                    {post.metadata.summary}
                </Text>
                <div className="mt-12 mb-10 border-t border-white/10" />
                <article className="prose max-w-2xl">
                    <CustomMDX source={post.content} />
                </article>
                <div className="mt-16 border-t border-white/10" />
                <Link
                    href="/blog"
                    className="mt-10 inline-block w-fit text-white/40 transition hover:text-white/70"
                >
                    <Text size="2">← All posts</Text>
                </Link>
            </Flex>
        </section>
    );
}
