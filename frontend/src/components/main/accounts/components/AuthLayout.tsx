import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../../../theme-provider";


import logoDark from "../../../../assets/Logos/Yellow.png";     
import logoTurquoise from "../../../../assets/Logos/Turquoise.png"; 
import logoPurple from "../../../../assets/Logos/Purple.png";

import "../css/layout/AuthLayout.css";

interface AuthLayoutProps {
    children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
    
    const { theme } = useTheme();

    const logoMap: Record<string, string> = {
        dark: logoDark,
        purple: logoPurple,
        turquoise: logoTurquoise,
    };

    const currentLogo = logoMap[theme] ?? logoDark;

    return (
        <main className="auth-layout">
            <section className="auth-layout-left">
                <Link to="/" className="auth-layout-logo-link">
                    <img
                        src={currentLogo}
                        alt="ESCRAPS"
                        className="auth-layout-logo"
                    />
                </Link>
            </section>

            <section className="auth-layout-right">
                <div className="auth-layout-card">{children}</div>
            </section>
        </main>
    );
}

