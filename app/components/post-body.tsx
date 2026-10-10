import Markdown, { type Components } from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";

// Plain HTML output, styled by theme.css. Raw HTML in a post is never
// rendered (react-markdown escapes it).

// Embedded media uses Markdown image syntax for every kind of file:
//   ![Optional caption](https://media.kristianpayne.dev/media/abc.mp4)
// The file extension decides whether it shows as a video, audio or image.
function EmbeddedMedia({ src, caption }: { src: string; caption: string }) {
    const extension = src.split(".").pop()?.toLowerCase();

    let media;
    if (extension === "mp4" || extension === "mov" || extension === "webm") {
        media = (
            <video
                src={src}
                muted
                loop
                playsInline
                controls
                preload="metadata"
            />
        );
    } else if (
        extension === "m4a" ||
        extension === "mp3" ||
        extension === "aac"
    ) {
        media = <audio src={src} controls preload="metadata" />;
    } else {
        // eslint-disable-next-line @next/next/no-img-element
        media = <img src={src} alt={caption} loading="lazy" />;
    }

    // Spans (styled as blocks) rather than <figure>, because Markdown puts
    // images inside a <p>, and a <figure> is not allowed there.
    return (
        <span className="embed">
            {media}
            {caption && <span className="caption">{caption}</span>}
        </span>
    );
}

const components: Components = {
    // Links in posts open in a new tab.
    a: ({ href, children }) => (
        <a href={href} target="_blank" rel="noopener noreferrer">
            {children}
        </a>
    ),
    img: ({ src, alt }) =>
        typeof src === "string" ? (
            <EmbeddedMedia src={src} caption={alt ?? ""} />
        ) : null,
};

export default function PostBody({ markdown }: { markdown: string }) {
    return (
        <Markdown
            // GFM: turns bare URLs into links, plus strikethrough and tables.
            // Breaks: a single newline becomes a line break, the way text
            // typed on a phone is expected to look.
            remarkPlugins={[remarkGfm, remarkBreaks]}
            components={components}
        >
            {markdown}
        </Markdown>
    );
}
