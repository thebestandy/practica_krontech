import { motion } from "motion/react";
import { useState, useEffect, useRef } from "react";
import { cn } from "../../../../ui/lib/utils";

interface linkEntry {
    icon: React.ElementType;
    title: string;
    link: string;
}

// I should genuinely change the effect because it looks horrid
export const SidebarLinks = ({ data }: { data: linkEntry[] }) => {
    const [hovered, setHovered] = useState<number | null>(null);

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

                return (
                    <a
                        onMouseEnter={() => setHovered(idx)}
                        onClick={() => console.log("nothing atm")} // sth with item.link
                        className={cn(
                            "relative flex flex-row gap-3 hover:cursor-pointer items-center px-4 py-2 transition delay-100 duration-100 ease-in hover:text-highlight",
                            isCompact ? "justify-center" : "justify-start",
                        )}
                        key={`link-${idx}`}
                    >
                        {hovered === idx && (
                            <motion.div
                                layoutId="hovered"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 h-full w-full rounded-md bg-neutral-800/30" // motion
                            />
                        )}
                        <Icon className="relative z-20 size-4 shrink-0" />
                        <span
                            className={cn(
                                isCompact
                                    ? "hidden"
                                    : "relative z-20 whitespace-nowrap overflow-hidden text-ellipsis",
                            )}
                        >
                            {item.title}
                        </span>
                    </a>
                );
            })}
        </motion.div>
    );
};
