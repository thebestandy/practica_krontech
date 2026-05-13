import { useNavigate } from "react-router-dom";
import { api, useAuth } from "../utils/authProvider";
import { useEffect, useRef, useState } from "react";

export default function Logout() {
    const { logoutLocal } = useAuth();
    const navigate = useNavigate();
    const lOut = useRef(false);
    const [isFading, setIsFading] = useState(false);

    useEffect(() => {
        if (lOut.current) return;
        lOut.current = true;

        const animationTimer = setTimeout(() => {
            setIsFading(true);
        }, 50);

        const performLogout = async () => {
            try {
                const refresh = localStorage.getItem("refresh");
                const apiCall = refresh
                    ? api.post("/auth/logout/", { refresh })
                    : Promise.resolve();

                await Promise.all([
                    apiCall.catch((error) => console.log("plm")),
                    new Promise((resolve) => setTimeout(resolve, 2000)),
                ]);
            } finally {
                logoutLocal();
                navigate("/", { replace: true });
            }
        };

        performLogout();

        return () => clearTimeout(animationTimer);
    }, [logoutLocal, navigate]);

    return (
        <div className="h-screen w-full grid place-items-center bg-transparent overflow-hidden">
            <div
                className={`flex flex-col items-center justify-center gap-6 transition-all duration-[2000ms] ease-in-out ${
                    isFading
                        ? "opacity-0 scale-95 blur-sm"
                        : "opacity-100 scale-100 blur-0"
                }`}
            >
                <div className="flex gap-[10px] h-32 items-center justify-center transition-all duration-[2000ms]">
                    <span className="w-[14px] h-[14px] bg-highlight/80 rounded-full animate-dots-bounce"></span>
                    <span
                        className="w-[14px] h-[14px] bg-highlight/80 rounded-full animate-dots-bounce"
                        style={{ animationDelay: "0.2s" }}
                    ></span>
                    <span
                        className="w-[14px] h-[14px] bg-highlight/80 rounded-full animate-dots-bounce"
                        style={{ animationDelay: "0.4s" }}
                    ></span>
                </div>

                <div className="text-center space-y-2">
                    <h2 className="text-xl font-medium text-highlight tracking-widest animate-pulse">
                        Te dam afara lmao
                    </h2>
                    <p className="text-sm text-foreground opacity-70">
                        La revedere
                    </p>
                </div>
            </div>
        </div>
    );
}
