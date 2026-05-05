import { redirect, useNavigate } from "react-router-dom";
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

    return (
        <div className="relative z-1000">
            <Navbar>
                <NavBody>
                    <NavbarLogo />
                    <NavItems items={navItems} />
                    <div className="flex items-center gap-4">
                        <button
                            className="inset-0 z-21 h-9 w-30 border duration-100 bg-neutral-800 text-sm transition-all ease-in hover:cursor-pointer hover:border-blue-500/40 hover:bg-transparent"
                            onClick={(event: any) => navigate("/dashboard")}
                        >
                            Dashboard
                        </button>
                    </div>
                </NavBody>
            </Navbar>
        </div>
    );
}
