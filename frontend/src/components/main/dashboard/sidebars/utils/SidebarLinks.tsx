import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect, useRef } from "react";
import { cn } from "../../../../ui/lib/utils";

interface SubProject {
    id: string;
    label: string;
    onClick: () => void;
    isActive?: boolean;
}

interface linkEntry {
    title: string;
    icon?: React.ElementType;
    link?: string;
    onClick?: () => void;
    subprojects?: SubProject[];
}

// hard coded some colors cuz fuck it we ball aint got time for ts
export const SidebarLinks = ({ data }: { data: linkEntry[] }) => {
    const [hovered, setHovered] = useState<number | null>(null);

    const [expandedFolders, setExpandedFolders] = useState<number[]>([]);

    const [isCompact, setIsCompact] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new ResizeObserver((entries) => {
            for (let entry of entries) {
                setIsCompact(entry.contentRect.width < 100);
            }
        });

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => observer.disconnect();
    }, []);

    const toggleFolder = (idx: number) => {
        setExpandedFolders((prev) =>
            prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx],
        );
    };

    return (
        <motion.div
            ref={containerRef}
            onMouseLeave={() => setHovered(null)}
            className={cn(
                "relative inset-0 flex-1 flex-col gap-1 text-sm font-medium text-primary transition duration-200 lg:flex",
            )}
        >
            {data.map((item, idx) => {
                const Icon = item.icon;
                const isFolder =
                    item.subprojects && item.subprojects.length > 0;
                const isOpen = expandedFolders.includes(idx);

                return (
                    <div
                        key={`link-container-${idx}`}
                        className="flex flex-col"
                    >
                        <a
                            onMouseEnter={() => setHovered(idx)}
                            onClick={() => {
                                if (isFolder) {
                                    toggleFolder(idx);
                                } else if (item.onClick) {
                                    item.onClick();
                                } else if (item.link) {
                                    console.log("navigate to", item.link);
                                }
                            }}
                            className={cn(
                                "relative flex flex-row gap-3 hover:cursor-pointer items-center px-4 py-2 transition delay-100 duration-100 ease-in hover:text-highlight",
                                isCompact ? "justify-center" : "justify-start",
                            )}
                        >
                            {hovered === idx && (
                                <motion.div
                                    layoutId="hovered"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 h-full w-full rounded-md bg-neutral-800/30"
                                />
                            )}

                            {Icon && (
                                <Icon className="relative z-20 size-4 shrink-0" />
                            )}

                            <span
                                className={cn(
                                    isCompact
                                        ? "hidden"
                                        : "relative z-20 whitespace-nowrap overflow-hidden text-ellipsis flex-1 flex justify-between items-center",
                                )}
                            >
                                {item.title}

                                {isFolder && (
                                    <svg
                                        className={cn(
                                            "size-4 opacity-50 transition-transform duration-200",
                                            isOpen ? "rotate-180" : "",
                                        )}
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M19 9l-7 7-7-7"
                                        />
                                    </svg>
                                )}
                            </span>
                        </a>

                        {isFolder && !isCompact && (
                            <AnimatePresence initial={false}>
                                {isOpen && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{
                                            duration: 0.2,
                                            ease: "easeInOut",
                                        }}
                                        className="overflow-hidden"
                                    >
                                        <div className="flex flex-col ml-[2.25rem] mt-1 gap-1 border-l border-neutral-800 pl-3">
                                            {item.subprojects!.map(
                                                (sub, subIdx) => (
                                                    <a
                                                        key={`sub-${idx}-${sub.id}`}
                                                        onClick={sub.onClick}
                                                        className={cn(
                                                            "hover:cursor-pointer block py-1.5 transition-colors duration-150",
                                                            sub.isActive
                                                                ? "text-highlight font-semibold"
                                                                : "text-neutral-400 hover:text-highlight",
                                                        )}
                                                    >
                                                        {sub.label}
                                                    </a>
                                                ),
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        )}
                    </div>
                );
            })}
        </motion.div>
    );
};
