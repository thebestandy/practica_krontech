import { cn } from "./lib/utils";
import { IconMenu2, IconX } from "@tabler/icons-react";
import {
    motion,
    AnimatePresence,
    useScroll,
    useMotionValueEvent,
} from "motion/react";

import React, { useRef, useState } from "react";

export const Navbar = ({ children, className }: any) => {
    const ref = useRef<HTMLDivElement>(null);
    const { scrollY } = useScroll({
        target: ref,
        offset: ["start start", "end start"],
    });

    const [visible, setVisible] = useState(false);

    useMotionValueEvent(scrollY, "change", (latest) => {
        setVisible(latest > 100);
    });

    return (
        <motion.div
            ref={ref}
            className={cn("fixed inset-x-0 top-5 z-50 w-full", className)}
        >
            {React.Children.map(children, (child) =>
                React.isValidElement(child)
                    ? React.cloneElement(child as any, { visible })
                    : child,
            )}
        </motion.div>
    );
};

export const NavBody = ({ children, className, visible }: any) => {
    return (
        <motion.div
            animate={{
                backdropFilter: visible ? "blur(10px)" : "none",
                boxShadow: visible ? "0 0 24px rgba(0,0,0,0.2)" : "none",
                width: visible ? "80%" : "100%",
                y: visible ? 20 : 0,
            }}
            transition={{
                type: "spring",
                stiffness: 200,
                damping: 50,
            }}
            className={cn(
                "relative mx-auto flex w-full max-w-7xl items-center justify-between rounded-sm px-6 py-3",
                visible && "bg-neutral-950/80",
                className,
            )}
        >
            {children}
        </motion.div>
    );
};

export const NavItems = ({ items, className, onItemClick }: any) => {
    const [hovered, setHovered] = useState<number | null>(null);

    return (
        <div
            onMouseLeave={() => setHovered(null)}
            className={cn(
                "flex flex-1 items-center justify-center gap-2 text-sm font-medium text-zinc-400",
                className,
            )}
        >
            {items.map((item: any, idx: number) => (
                <a
                    key={idx}
                    href={item.link}
                    onClick={onItemClick}
                    onMouseEnter={() => setHovered(idx)}
                    className="relative px-4 py-2 text-neutral-300 hover:text-blue-400"
                >
                    {hovered === idx && (
                        <motion.div
                            layoutId="hovered"
                            className="absolute inset-0 rounded-md bg-neutral-800"
                        />
                    )}
                    <span className="relative z-10">{item.name}</span>
                </a>
            ))}
        </div>
    );
};

export const MobileNav = ({ children, className, visible }: any) => {
    return (
        <motion.div
            animate={{
                backdropFilter: visible ? "blur(10px)" : "none",
                y: visible ? 20 : 0,
            }}
            className={cn(
                "relative mx-auto flex w-full max-w-[calc(100vw-2rem)] flex-col items-center justify-between px-2 py-2 lg:hidden",
                visible && "bg-neutral-950/80",
                className,
            )}
        >
            {children}
        </motion.div>
    );
};

export const MobileNavHeader = ({ children, className }: any) => (
    <div className={cn("flex w-full items-center justify-between", className)}>
        {children}
    </div>
);

export const MobileNavMenu = ({ children, isOpen }: any) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-x-0 top-16 z-50 flex flex-col gap-4 rounded-lg bg-neutral-950 px-4 py-8"
                >
                    {children}
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export const MobileNavToggle = ({ isOpen, onClick }: any) =>
    isOpen ? (
        <IconX className="text-white" onClick={onClick} />
    ) : (
        <IconMenu2 className="text-white" onClick={onClick} />
    );

export const NavbarLogo = () => (
    <a className="flex items-center px-2 py-1 text-white">
        <span className="font-medium"></span>
    </a>
);

export const NavbarButton = ({
    href,
    as: Tag = "a",
    children,
    className,
    variant = "primary",
    ...props
}: any) => {
    const base =
        "px-4 py-2 rounded-md text-sm font-bold transition hover:-translate-y-0.5";

    const variants: any = {
        primary: "bg-white text-black",
        secondary: "bg-transparent text-white",
        dark: "bg-black text-white",
        gradient: "bg-gradient-to-b from-blue-500 to-blue-700 text-white",
    };

    return (
        <Tag
            href={href}
            className={cn(base, variants[variant], className)}
            {...props}
        >
            {children}
        </Tag>
    );
};
