import Link from "next/link";

const navItems = {
    "/": {
        name: "Home",
    },
    "/projects": {
        name: "Projects",
    },
    "/blog": {
        name: "Blog",
    },
    "/contact": {
        name: "Contact",
    },
};

export function Navbar() {
    return (
        <aside className="mb-16 h-16 tracking-tight sticky top-6 z-50 w-full flex items-center justify-center">
            <div className="w-full flex justify-center">
                <nav
                    className="flex flex-row items-center relative px-0 pb-0 fade md:overflow-auto scroll-pr-6 md:relative"
                    id="nav"
                >
                    <div className="flex flex-row space-x-0 px-2">
                        {Object.entries(navItems).map(([path, { name }]) => {
                            return (
                                <Link
                                    key={path}
                                    href={path}
                                    className="text-white/70 transition-all hover:text-neutral-800 dark:hover:text-neutral-200 flex align-middle relative py-1 px-2 m-1"
                                >
                                    {name}
                                </Link>
                            );
                        })}
                    </div>
                </nav>
            </div>
        </aside>
    );
}
