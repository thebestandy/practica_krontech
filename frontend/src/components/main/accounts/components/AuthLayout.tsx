import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import scrapsLogo from "../../../../assets/Logos/White and Black Modern Initial Logo (2).png";

import "../css/layout/AuthLayout.css";

interface AuthLayoutProps {
    children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
    return (
        <main className="auth-layout">
            <section className="auth-layout-left">
                <Link to="/" className="auth-layout-logo-link">
                    <img
                        src={scrapsLogo}
                        alt="SCRAPS"
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

