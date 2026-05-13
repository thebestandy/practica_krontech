import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./css/themes.css";
import App from "./App.tsx";
import { ThemeProvider, useTheme} from "./components/theme-provider.tsx";
import { AuthProvider } from "./components/main/utils/authProvider.tsx";
import { GoogleOAuthProvider } from "@react-oauth/google";

import logoYellow from "./assets/Logos/Yellow.png";
import logoTurquoise from "./assets/Logos/Turquoise.png";
import logoPurple from "./assets/Logos/Purple.png";

function FaviconManager() {
    const { theme } = useTheme();

    useEffect(() => {
        const favicon = document.querySelector("link[rel='icon']") as HTMLLinkElement;
        if (!favicon) return;

        const faviconMap: Record<string, string> = {
            yellow: logoYellow,
            purple: logoPurple,
            turquoise: logoTurquoise,
        };

        favicon.href = faviconMap[theme] ?? logoPurple;
    }, [theme]);

    return null;
}

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
            <ThemeProvider>
                <FaviconManager />
                <AuthProvider>
                    <App />
                </AuthProvider>
            </ThemeProvider>
        </GoogleOAuthProvider>
    </StrictMode>
);
