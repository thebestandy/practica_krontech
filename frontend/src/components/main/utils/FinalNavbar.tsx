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
            // console.log("width " + window.innerWidth);
            setIsDesktop(window.innerWidth > 760);
            // console.log("resized: " + isDesktop);
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
                            className="inset-0 z-21 h-11 w-36 hover:cursor-pointer bg-foreground text-background font-black hover:bg-highlight hover:text-foreground transition-all duration-300 uppercase tracking-[0.2em] text-sm shadow-lg rounded-md"
                            onClick={(event: any) => navigate("/dashboard")}
                        >
                            Dashboard
                        </button>

                       
                        {/* <button
                            className="relative z-10 block overflow-hidden px-6 py-3 text-white bg-transparent rounded-sm
                            border border-zinc-400 bg-white
               
                               before:content-[''] before:absolute before:-z-10 before:top-1/2 before:left-full 
                               before:-mt-[15px] before:ml-[1px] before:w-[30px] before:h-[30px] 
                               before:rounded-full before:bg-purple-300 
                               before:origin-[100%_50%] before:[transform:scale3d(1,2,1)] 
                               before:transition-[transform,opacity] before:duration-300 before:ease-[cubic-bezier(0.7,0,0.9,1)]
                               
                               hover:before:[transform:scale3d(9,9,1)] hover:cursor-pointer hover:text-zinc-500 transition-colors duration-400 ease-in"
                            onClick={(event: any) => navigate("/dashboard")}
                        >
                            Dashboard
                        </button> */}
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
