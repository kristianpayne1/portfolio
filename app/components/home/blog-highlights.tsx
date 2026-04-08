import Link from "next/link";
import { getBlogPosts, formatDate } from "app/blog/utils";

export default function BlogHighlights() {
    const posts = getBlogPosts()
        .sort(
            (a, b) =>
                new Date(b.metadata.publishedAt).getTime() -
                new Date(a.metadata.publishedAt).getTime()
        )
        .slice(0, 3);

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
                <Link
                    key={post.slug}
                    href={`/blog/${post.slug}`}
className="group flex flex-col rounded-lg border border-white/10 bg-white/5 p-6 transition hover:border-white/20 hover:bg-white/10"
                >
                    <p className="text-xs text-white/40">
                        {formatDate(post.metadata.publishedAt)}
                    </p>
                    <p className="mt-1 text-sm font-medium text-white/80">
                        {post.metadata.title}
                    </p>
                    <p className="mt-2 line-clamp-5 text-xs text-white/50">
                        {post.metadata.summary}
                    </p>
                </Link>
            ))}
        </div>
    );
}
