// The feed is personal: ask every crawler to stay out.
export default function robots() {
    return {
        rules: [
            {
                userAgent: "*",
                disallow: "/",
            },
        ],
    };
}
