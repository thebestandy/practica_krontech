import { cn } from "./lib/utils";
import { IconMenu2, IconX } from "@tabler/icons-react";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "motion/react";
import { useTheme } from "../theme-provider";
import logoYellow from "../../assets/Logos/Yellow.png";
import logoTurquoise from "../../assets/Logos/Turquoise.png";
import logoPurple from "../../assets/Logos/Purple.png";
import React, { useState, useRef, forwardRef } from "react";

export const Navbar = forwardRef<HTMLDivElement, any>(
    ({ children, className, isMobileOpen }, ref) => {
        const { scrollY } = useScroll();
        const [scrolled, setScrolled] = useState(false);

        useMotionValueEvent(scrollY, "change", (latest) => {
            setScrolled(latest > 10);
        });

        const isVisible = scrolled || isMobileOpen;

        return (
            <>
                <div style={{
                    position: "fixed", 
                    top: "-30%", 
                    left: "50%", 
                    transform: "translateX(-50%)",
                    width: "900px", 
                    height: "600px",
                    background: "radial-gradient(ellipse, var(--glow) 0%, transparent 70%)",
                    pointerEvents: "none", 
                    zIndex: 0,
                }} />
                
                <motion.div
                    ref={ref}
                    className={cn("fixed inset-x-0 top-0 z-50 w-full", className)}
                    animate={{
                        backgroundColor: isVisible ? "rgba(var(--secondary-highlight-rgb), 0.3)" : "transparent",
                        backdropFilter: isVisible ? "blur(12px)" : "none",
                        width: isVisible ? "96%" : "100%",
                        left: isVisible ? "2%" : "0%",
                        top: isVisible ? "15px" : "0px",
                        borderRadius: !isVisible ? "0px" : isMobileOpen ? "10px 10px 0px 0px" : "10px",
                        boxShadow: !isVisible ? "none" : isMobileOpen
                            ? "-8px -8px 20px rgba(0,0,0,0.25), 8px -8px 20px rgba(0,0,0,0.25), 0 -6px 16px rgba(0,0,0,0.2)"
                            : "0 6px 20px rgba(0,0,0,0.35)",
                    }}
                    transition={{ type: "spring", stiffness: 200, damping: 30 }}
                >
                    {React.Children.map(children, (child) =>
                        React.isValidElement(child)
                            ? React.cloneElement(child as any, { visible: isVisible })
                            : child
                    )}
                </motion.div>
            </>
        );
    }
);
Navbar.displayName = "Navbar";

export const NavBody = ({ children, className, isDesktop }: any) => (
    <div className={cn(
        "relative mx-auto flex w-full items-center justify-between px-8 py-4",
        !isDesktop && "hidden",
        className,
    )}>
        {children}
    </div>
);

export const MobileNav = ({ children, className, isDesktop }: any) => (
    <div className={cn(
        "flex w-full flex-col px-6 py-4",
        isDesktop ? "hidden" : "flex",
        className,
    )}>
        {children}
    </div>
);

export const MobileNavHeader = ({ children, className }: any) => (
    <div className={cn("flex w-full items-center justify-between", className)}>{children}</div>
);

export const MobileNavMenu = ({ children, isOpen, topOffset }: any) => (
    <AnimatePresence>
        {isOpen && (
            <motion.div
                initial={{ opacity: 0, scaleY: 0.97, originY: 0 }}
                animate={{ opacity: 1, scaleY: 1 }}
                exit={{ opacity: 0, scaleY: 0.97 }}
                transition={{ type: "spring", stiffness: 280, damping: 30 }}
                className="fixed z-40 flex flex-col"
                style={{
                    top: topOffset ?? 72,
                    left: "2%",
                    right: "2%",
                    bottom: "2vw",
                    borderRadius: "0 0 10px 10px",
                    backgroundColor: "rgba(var(--secondary-highlight-rgb), 0.3)",
                    backdropFilter: "blur(12px)",
                    boxShadow: "0 -4px 10px rgba(0,0,0,0.15), 0 10px 30px rgba(0,0,0,0.3)",
                    padding: "12px 24px 24px",
                }}
            >
                {children}
            </motion.div>
        )}
    </AnimatePresence>
);

export const NavItems = ({ items, className }: any) => {
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
    const originRef = useRef<Record<number, "left" | "right">>({});

    const handleMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>, idx: number) => {
        const rect = e.currentTarget.getBoundingClientRect();
        originRef.current[idx] = e.clientX < rect.left + rect.width / 2 ? "left" : "right";
        setHoveredIdx(idx);
    };

    return (
        <div
            className={cn("flex flex-1 items-center justify-center gap-12", className)}
            onMouseLeave={() => setHoveredIdx(null)}
        >
            {items.map((item: any, idx: number) => {
                const origin = originRef.current[idx] ?? "left";
                return (
                    <a
                        key={idx}
                        href={item.link}
                        onMouseEnter={(e) => handleMouseEnter(e, idx)}
                        className="relative text-xl font-semibold text-foreground hover:text-highlight transition-colors duration-200 py-1"
                    >
                        {item.name}
                        <motion.span
                            className="absolute bottom-0 left-0 h-[2px] w-full bg-highlight rounded-full"
                            initial={false}
                            animate={{
                                scaleX: hoveredIdx === idx ? 1 : 0,
                                opacity: hoveredIdx === idx ? 1 : 0,
                            }}
                            transition={{ type: "spring", stiffness: 380, damping: 28 }}
                            style={{ transformOrigin: origin }}
                        />
                    </a>
                );
            })}
        </div>
    );
};

export const MobileNavToggle = ({ isOpen, onClick }: any) => (
    <button onClick={onClick} className="text-foreground p-2 relative">
        {isOpen ? <IconX size={28} /> : <IconMenu2 size={28} />}
    </button>
);

export const NavbarLogo = () => {
    const { theme } = useTheme();
    const logoMap: Record<string, string> = { yellow: logoYellow, purple: logoPurple, turquoise: logoTurquoise };
    return (
        <a href="/" className="flex items-center relative">
            <img src={logoMap[theme] || logoPurple} alt="Logo" className="w-10 h-10 object-contain" />
        </a>
    );
};