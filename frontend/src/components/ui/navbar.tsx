import { cn } from "./lib/utils";
import { IconMenu2, IconX } from "@tabler/icons-react";
import {
    motion,
    AnimatePresence,
    useScroll,
    useMotionValueEvent,
} from "motion/react";
import logo from "../../assets/Logos/White and Black Modern Initial Logo (1).png";
import React, { useRef, useState } from "react";

export const Navbar = ({ children, className }: any) => {
    const ref = useRef<HTMLDivElement>(null);
    const { scrollY } = useScroll({
        target: ref,
        offset: ["start start", "end start"],
    });

    const [visible, setVisible] = useState(false);

    useMotionValueEvent(scrollY, "change", (latest) => {
        if (latest > 0) {
            setVisible(true);
        } else {
            setVisible(false);
        }
    });

    return (
        <motion.div
            ref={ref}
            className={cn("fixed inset-x-0 top-5 z-50 w-full", className)}
        >
            {React.Children.map(children, (child) =>
                React.isValidElement(child)
                    ? React.cloneElement(
                          child as React.ReactElement<{ visible?: boolean }>,
                          { visible },
                      )
                    : child,
            )}
        </motion.div>
    );
};

export const NavBody = ({ children, className, visible, isDesktop }: any) => {
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
                "relative mx-auto flex w-full items-center justify-between rounded-sm px-6 py-3",
                visible && "bg-secondary-highlight-950/80",
                isDesktop ? "" : "hidden",
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
                    className="relative px-4 py-2 dark:text-neutral-300 text-primary-foreground transition-all ease-in-out duration-100"
                >
                    {hovered === idx && (
                        <motion.div
                            layoutId="hovered"
                            className="absolute inset-0 rounded-md dark:bg-neutral-800 bg-highlight/10"
                        />
                    )}
                    <span className="relative z-10">{item.name}</span>
                </a>
            ))}
        </div>
    );
};

export const MobileNav = ({ children, className, visible, isDesktop }: any) => {
    return (
        <motion.div
            animate={{
                backdropFilter: visible ? "blur(10px)" : "none",
                boxShadow: visible
                    ? "0 0 24px rgba(34, 42, 53, 0.06), 0 1px 1px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(34, 42, 53, 0.04), 0 0 4px rgba(34, 42, 53, 0.08), 0 16px 68px rgba(47, 48, 55, 0.05), 0 1px 0 rgba(255, 255, 255, 0.1) inset"
                    : "none",
                y: visible ? 20 : 0,
            }}
            className={cn(
                "relative mx-auto w-full max-w-[calc(100vw-2rem)] flex-col items-center justify-between px-2 py-2",
                className,
                isDesktop ? "hidden" : "flex",
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
        <span className="font-medium text-highlight">
            <img src={logo} alt="Logo" className="w-10 h-10 object-contain" />
        </span>
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
