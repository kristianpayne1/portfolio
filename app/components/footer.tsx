import { FaRss, FaGithub, FaLinkedin } from "react-icons/fa";

export default function Footer() {
    return (
        <footer className="mt-16 mb-4 flex justify-between">
            <ul className="font-sm mt-8 flex flex-col space-x-0 space-y-2 text-neutral-400 md:flex-row md:space-x-4 md:space-y-0">
                <li>
                    <a
                        className="flex items-center transition-all hover:text-neutral-800 dark:hover:text-neutral-100"
                        rel="noopener noreferrer"
                        target="_blank"
                        href="/rss"
                    >
                        <FaRss size={14} />
                        <p className="ml-2 h-7">rss</p>
                    </a>
                </li>
                <li>
                    <a
                        className="flex items-center transition-all hover:text-neutral-800 dark:hover:text-neutral-100"
                        rel="noopener noreferrer"
                        target="_blank"
                        href="https://github.com/kristianpayne1"
                    >
                        <FaGithub size={14} />
                        <p className="ml-2 h-7">github</p>
                    </a>
                </li>
                <li>
                    <a
                        className="flex items-center transition-all hover:text-neutral-800 dark:hover:text-neutral-100"
                        rel="noopener noreferrer"
                        target="_blank"
                        href="https://www.linkedin.com/in/kristian-payne-015698166/"
                    >
                        <FaLinkedin size={14} />
                        <p className="ml-2 h-7">linkedin</p>
                    </a>
                </li>
            </ul>
            <p className="mt-8 text-neutral-400">
                © {new Date().getFullYear()} MIT Licensed
            </p>
        </footer>
    );
}
