import type { ReactNode } from "react";

import "../css/AuthButton.css";

interface AuthButtonProps {
    children: ReactNode;
    type?: "button" | "submit" | "reset";
    onClick?: () => void;
}

export default function AuthButton({
    children,
    type = "button",
    onClick,
}: AuthButtonProps) {
    return (
        <button
            type={type}
            className="auth-button"
            onClick={onClick}
        >
            {children}
        </button>
    );
}