import { cn } from "./lib/utils";
import { IconMenu2, IconX } from "@tabler/icons-react";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "motion/react";
import { useTheme } from "../theme-provider";

import logoYellow from "../../assets/Logos/Yellow.png";
import logoTurquoise from "../../assets/Logos/Turquoise.png";
import logoPurple from "../../assets/Logos/Purple.png";
import React, { useState, forwardRef } from "react";

// Single source of truth for mobile surface appearance.
// Both MobileNav (header) and MobileNavMenu (panel) use these — guaranteed identical.
const MOBILE_BG = "color-mix(in srgb, var(--secondary-highlight) 55%, transparent)";
const MOBILE_BLUR = "blur(10px)";

// ─── Navbar wrapper ────────────────────────────────────────────────────────────
export const Navbar = forwardRef<HTMLDivElement, any>(
    ({ children, className, isMobileOpen }, ref) => {
        const { scrollY } = useScroll();
        const [scrolled, setScrolled] = useState(false);

        useMotionValueEvent(scrollY, "change", (latest) => {
            setScrolled(latest > 0);
        });

        const visible = scrolled || isMobileOpen;

        return (
            <>
                {/* Global glow */}
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

                {/* Outer wrapper: pill geometry + background when menu open */}
                <motion.div
                    ref={ref}
                    className={cn("fixed inset-x-0 top-0 z-50 w-full", className)}
                    animate={{
                        width: visible ? "96%" : "100%",
                        left: visible ? "2%" : "0%",
                        top: visible ? "15px" : "0px",
                        borderRadius: visible
                            ? isMobileOpen ? "10px 10px 0px 0px" : "10px"
                            : "0px",
                        backgroundColor: isMobileOpen ? MOBILE_BG : "transparent",
                        backdropFilter: isMobileOpen ? MOBILE_BLUR : "none",
                    }}
                    transition={{ type: "spring", stiffness: 200, damping: 30 }}
                >
                    {React.Children.map(children, (child) =>
                        React.isValidElement(child)
                            ? React.cloneElement(child as any, { visible, isMobileOpen })
                            : child
                    )}
                </motion.div>
            </>
        );
    }
);
Navbar.displayName = "Navbar";

// ─── NavBody (DESKTOP) ────────────────────────────────────────────────────────
// Untouched from working version — animates width/blur/shadow/bg on scroll.
export const NavBody = ({ children, className, visible, isDesktop }: any) => (
    <motion.div
        animate={{
            backdropFilter: visible ? "blur(10px)" : "none",
            boxShadow: visible ? "0 0 24px rgba(0,0,0,0.2)" : "none",
            width: visible ? "80%" : "100%",
            y: visible ? 20 : 0,
        }}
        transition={{ type: "spring", stiffness: 200, damping: 50 }}
        style={{
            backgroundColor: visible
                ? "color-mix(in srgb, var(--secondary-highlight) 30%, transparent)"
                : "transparent",
        }}
        className={cn(
            "relative mx-auto flex w-full items-center justify-between rounded-sm px-6 py-3",
            !isDesktop && "hidden",
            className,
        )}
    >
        {children}
    </motion.div>
);

// ─── NavItems (DESKTOP) ───────────────────────────────────────────────────────
export const NavItems = ({ items, className, onItemClick }: any) => {
    const [hovered, setHovered] = useState<number | null>(null);

    return (
        <div
            onMouseLeave={() => setHovered(null)}
            className={cn("flex flex-1 items-center justify-center gap-2 text-sm font-medium", className)}
        >
            {items.map((item: any, idx: number) => (
                <a
                    key={idx}
                    href={item.link}
                    onClick={onItemClick}
                    onMouseEnter={() => setHovered(idx)}
                    className="relative px-4 py-2 text-lg font-semibold text-primary-foreground dark:text-neutral-300 hover:text-foreground/80 transition-colors duration-100"
                >
                    {hovered === idx && (
                        <motion.div
                            layoutId="hovered"
                            className="absolute inset-0 rounded-md bg-highlight/10 dark:bg-neutral-800"
                        />
                    )}
                    <span className="relative z-10">{item.name}</span>
                </a>
            ))}
        </div>
    );
};

// ─── MobileNav ────────────────────────────────────────────────────────────────
// When menu is closed + scrolled: shows MOBILE_BG surface (pill navbar).
// When menu is open: goes transparent — MobileNavMenu directly below uses the
// same MOBILE_BG, so together they read as one seamless surface.
export const MobileNav = ({ children, className, isDesktop, visible, isMobileOpen }: any) => (
    <div
        style={{
            backgroundColor: visible && !isMobileOpen ? MOBILE_BG : "transparent",
            backdropFilter: visible && !isMobileOpen ? MOBILE_BLUR : "none",
            borderRadius: visible
                ? isMobileOpen ? "10px 10px 0 0" : "10px"
                : "0px",
            overflow: "hidden",
            borderBottom: isMobileOpen
                ? "1px solid color-mix(in srgb, var(--secondary-highlight) 40%, transparent)"
                : "none",
        }}
        className={cn(
            "flex w-full flex-col px-6 py-4",
            isDesktop ? "hidden" : "flex",
            className,
        )}
    >
        {children}
    </div>
);

export const MobileNavHeader = ({ children, className }: any) => (
    <div className={cn("flex w-full items-center justify-between", className)}>
        {children}
    </div>
);

// ─── MobileNavMenu ────────────────────────────────────────────────────────────
// Uses exact same MOBILE_BG + MOBILE_BLUR constants — no drift possible.
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
                    backgroundColor: MOBILE_BG,
                    backdropFilter: MOBILE_BLUR,
                    boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
                    padding: "12px 24px 24px",
                }}
            >
                {children}
            </motion.div>
        )}
    </AnimatePresence>
);

// ─── MobileNavToggle ──────────────────────────────────────────────────────────
export const MobileNavToggle = ({ isOpen, onClick }: any) => (
    <button onClick={onClick} className="text-foreground p-2">
        {isOpen ? <IconX size={28} /> : <IconMenu2 size={28} />}
    </button>
);

// ─── NavbarLogo ───────────────────────────────────────────────────────────────
export const NavbarLogo = () => {
    const { theme } = useTheme();
    const logoMap: Record<string, string> = {
        yellow: logoYellow,
        purple: logoPurple,
        turquoise: logoTurquoise,
    };

    return (
        <a href="/" className="flex items-center relative">
            <motion.img
                key={theme}
                src={logoMap[theme] ?? logoPurple}
                alt="Logo"
                className="w-10 h-10 object-contain"
                initial={{ opacity: 0, rotate: -15, scale: 0.8 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
            />
        </a>
    );
};