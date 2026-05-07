import { redirect, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import {
    Navbar,
    NavBody,
    NavbarButton,
    NavbarLogo,
    NavItems,
    MobileNav,
    MobileNavHeader,
    MobileNavMenu,
    MobileNavToggle,
} from "../../ui/navbar";

export default function FinalNavbar() {
    const navItems = [
        {
            name: "Home",
            link: "/",
        },

        {
            name: "Enterprise",
            link: "/enterprise",
        },

        {
            name: "Our Beliefs",
            link: "/beliefs",
        },

        {
            name: "About us",
            link: "/about",
        },
    ];

    let navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isDesktop, setIsDesktop] = useState(false);
    const navRef = useRef(null);

    useEffect(() => {
        function handleResize() {
            console.log("width " + window.innerWidth);
            setIsDesktop(window.innerWidth > 760);
            console.log("resized: " + isDesktop);
        }

        window.addEventListener("resize", handleResize);

        handleResize();
    }, []);

    return (
        <div className="relative z-1000">
            <Navbar ref={navRef}>
                <NavBody isDesktop={isDesktop}>
                    <NavbarLogo />
                    <NavItems items={navItems} />
                    <div className="flex items-center gap-4">
                        <button
                            className="inset-0 z-21 h-9 w-30 border duration-100 bg-highlight/10 dark:bg-neutral-800 text-sm 
                            transition-all ease-in hover:cursor-pointer hover:border-secondary-highlight/10 hover:bg-transparent 
                            text-secondary-highlight hover:text-highlight"
                            onClick={(event: any) => navigate("/dashboard")}
                        >
                            Dashboard
                        </button>
                    </div>
                </NavBody>
                <MobileNav isDesktop={isDesktop}>
                    <MobileNavHeader>
                        <NavbarLogo />
                        <MobileNavToggle
                            isOpen={isMobileMenuOpen}
                            onClick={() =>
                                setIsMobileMenuOpen(!isMobileMenuOpen)
                            }
                        />
                    </MobileNavHeader>

                    <MobileNavMenu
                        isOpen={isMobileMenuOpen}
                        onClose={() => setIsMobileMenuOpen(false)}
                    >
                        {navItems.map((item, idx) => (
                            <a
                                key={`mobile-link-${idx}`}
                                href={item.link}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="relative text-neutral-300"
                            >
                                <span className="block">{item.name}</span>
                            </a>
                        ))}
                        <div className="flex w-full flex-col gap-4">
                            <NavbarButton
                                onClick={() => setIsMobileMenuOpen(false)}
                                variant="primary"
                                className="w-full"
                            >
                                Dashboard
                            </NavbarButton>
                        </div>
                    </MobileNavMenu>
                </MobileNav>
            </Navbar>
        </div>
    );
}
