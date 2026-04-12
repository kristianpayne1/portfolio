import Link from "next/link";
import Image from "next/image";
import { MDXRemote } from "next-mdx-remote/rsc";
import { highlight } from "sugar-high";
import React from "react";

function Table({ data }) {
    const headers = data.headers.map((header, index) => (
        <th key={index}>{header}</th>
    ));
    const rows = data.rows.map((row, index) => (
        <tr key={index}>
            {row.map((cell, cellIndex) => (
                <td key={cellIndex}>{cell}</td>
            ))}
        </tr>
    ));

    return (
        <table>
            <thead>
                <tr>{headers}</tr>
            </thead>
            <tbody>{rows}</tbody>
        </table>
    );
}

function CustomLink(props) {
    const href = props.href;

    if (href.startsWith("/")) {
        return (
            <Link href={href} {...props}>
                {props.children}
            </Link>
        );
    }

    if (href.startsWith("#")) {
        return <a {...props} />;
    }

    return <a target="_blank" rel="noopener noreferrer" {...props} />;
}

function RoundedImage(props) {
    return <Image alt={props.alt} className="rounded-lg" {...props} />;
}

function SideFigure({ src, alt = "", caption, width = 400, height = 300 }) {
    return (
        <figure className="my-6 xl:float-right xl:clear-right xl:my-2 xl:ml-6 xl:-mr-96 xl:w-80">
            {src ? (
                <Image
                    src={src}
                    alt={alt}
                    width={width}
                    height={height}
                    className="h-auto w-full rounded-lg"
                />
            ) : (
                <div
                    className="flex items-center justify-center rounded-lg border border-white/10 bg-white/5 px-4 text-center text-xs text-white/30"
                    style={{ aspectRatio: `${width} / ${height}` }}
                >
                    {alt || "Figure placeholder"}
                </div>
            )}
            {caption && (
                <figcaption className="mt-2 text-xs text-white/40 italic">
                    {caption}
                </figcaption>
            )}
        </figure>
    );
}

function MarginNote({ children }) {
    return (
        <aside className="my-4 border-l-2 border-white/10 pl-3 text-sm text-white/50 italic xl:float-right xl:clear-right xl:my-2 xl:ml-6 xl:-mr-80 xl:w-64 xl:border-l xl:text-xs">
            {children}
        </aside>
    );
}

function PullQuote({ children }) {
    return (
        <blockquote className="my-6 border-l-2 border-white/30 pl-4 text-lg text-white/85 italic xl:float-right xl:clear-right xl:my-2 xl:ml-6 xl:-mr-96 xl:w-80 xl:border-l-4 xl:pl-5 xl:text-xl">
            {children}
        </blockquote>
    );
}

function Code({ children, ...props }) {
    const codeHTML = highlight(children);
    return <code dangerouslySetInnerHTML={{ __html: codeHTML }} {...props} />;
}

function slugify(str) {
    return str
        .toString()
        .toLowerCase()
        .trim() // Remove whitespace from both ends of a string
        .replace(/\s+/g, "-") // Replace spaces with -
        .replace(/&/g, "-and-") // Replace & with 'and'
        .replace(/[^\w\-]+/g, "") // Remove all non-word characters except for -
        .replace(/\-\-+/g, "-"); // Replace multiple - with single -
}

function createHeading(level) {
    const Heading = ({ children }) => {
        const slug = slugify(children);
        return React.createElement(
            `h${level}`,
            { id: slug },
            [
                React.createElement("a", {
                    href: `#${slug}`,
                    key: `link-${slug}`,
                    className: "anchor",
                }),
            ],
            children
        );
    };

    Heading.displayName = `Heading${level}`;

    return Heading;
}

const components = {
    h1: createHeading(1),
    h2: createHeading(2),
    h3: createHeading(3),
    h4: createHeading(4),
    h5: createHeading(5),
    h6: createHeading(6),
    Image: RoundedImage,
    SideFigure,
    MarginNote,
    PullQuote,
    a: CustomLink,
    code: Code,
    Table,
};

export function CustomMDX(props) {
    return (
        <MDXRemote
            {...props}
            components={{ ...components, ...(props.components || {}) }}
        />
    );
}
