import Markdown, { type Components } from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";

// Plain HTML output, styled by theme.css. Raw HTML in a post is never
// rendered (react-markdown escapes it).
const components: Components = {
    // Links in posts open in a new tab.
    a: ({ href, children }) => (
        <a href={href} target="_blank" rel="noopener noreferrer">
            {children}
        </a>
    ),
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
