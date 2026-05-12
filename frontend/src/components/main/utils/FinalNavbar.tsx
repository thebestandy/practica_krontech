import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import {
    Navbar,
    NavBody,
    NavbarLogo,
    NavItems,
    MobileNav,
    MobileNavHeader,
    MobileNavMenu,
    MobileNavToggle,
} from "../../ui/navbar";
import { useAuth } from "./authProvider";

export default function FinalNavbar() {
    const navItems = [
        { name: "Home", link: "/" },
        { name: "Enterprise", link: "/enterprise" },
        { name: "Our Beliefs", link: "/beliefs" },
        { name: "About Us", link: "/about" },
    ];

    const navigate = useNavigate();

    const { isAuthenticated } = useAuth();

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isDesktop, setIsDesktop] = useState(window.innerWidth > 760);

    const navbarRef = useRef<HTMLDivElement>(null);
    const [menuTop, setMenuTop] = useState<number>(72);

    const measureNavbar = () => {
        if (navbarRef.current) {
            const rect = navbarRef.current.getBoundingClientRect();
            setMenuTop(rect.bottom);
        }
    };

    useEffect(() => {
        if (isMobileMenuOpen) {
            const t = setTimeout(measureNavbar, 320);
            return () => clearTimeout(t);
        }
    }, [isMobileMenuOpen]);

    useEffect(() => {
        const handleResize = () => {
            const desktop = window.innerWidth > 760;
            setIsDesktop(desktop);
            if (desktop) setIsMobileMenuOpen(false);
            measureNavbar();
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const handleNavigation = (path: string) => {
        setIsMobileMenuOpen(false);
        navigate(path);
    };

    return (
        <div className="relative z-[1000]">

            <Navbar ref={navbarRef} isMobileOpen={isMobileMenuOpen}>

                <NavBody isDesktop={isDesktop}>
                    <NavbarLogo />
                    <NavItems items={navItems} />
                    <div className="flex items-center gap-4">
                        <button
                            className="h-11 w-36 cursor-pointer bg-foreground text-background font-semibold hover:bg-highlight hover:text-foreground transition-all duration-300 tracking-wide text-lg shadow-lg rounded-sm"
                            onClick={() => handleNavigation(isAuthenticated ? "/dashboard" : "/login")}
                        >
                            {isAuthenticated ? "Dashboard" : "Get Started"}
                        </button>
                    </div>
                </NavBody>

                <MobileNav isDesktop={isDesktop}>
                    <MobileNavHeader>
                        <NavbarLogo />
                        <MobileNavToggle
                            isOpen={isMobileMenuOpen}
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        />
                    </MobileNavHeader>
                </MobileNav>

            </Navbar>


            <MobileNavMenu isOpen={isMobileMenuOpen} topOffset={menuTop}>

                <div className="flex flex-col gap-1 flex-1">
                    {navItems.map((item, idx) => (
                        <a
                            key={`mobile-link-${idx}`}
                            href={item.link}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="w-full px-4 py-3 text-lg font-semibold text-primary-foreground dark:text-neutral-300 rounded-sm transition-all duration-200 ease-in-out hover:bg-foreground hover:text-background hover:cursor-pointer"
                            style={{
                                boxShadow: "0 3px 4px -2px rgba(0,0,0,0.12)",
                            }}
                        >
                            {item.name}
                        </a>
                    ))}
                </div>

                <div className="pt-4 mt-4 border-t border-white/10">
                    <button
                        className="w-full h-12 cursor-pointer bg-foreground text-background hover:bg-highlight hover:text-foreground transition-all duration-300 tracking-wide text-lg shadow-lg rounded-sm font-semibold"
                        onClick={() => handleNavigation(isAuthenticated ? "/dashboard" : "/login")}
                    >
                        {isAuthenticated ? "Dashboard" : "Get Started"}
                    </button>
                </div>

            </MobileNavMenu>

        </div>
    );
}