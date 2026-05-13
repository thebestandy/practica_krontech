import { useNavigate } from "react-router-dom";
import { api, useAuth } from "../utils/authProvider";
import { useEffect, useRef } from "react"; // Import useRef

export default function Logout() {
    const { logoutLocal } = useAuth();
    const navigate = useNavigate();

    const lOut = useRef(false);

    useEffect(() => {
        if (lOut.current) return;

        lOut.current = true;

        const performLogout = async () => {
            try {
                const refresh = localStorage.getItem("refresh");
                if (refresh) {
                    await api.post("/auth/logout/", { refresh });
                }
            } catch (error) {
                console.log("plm");
            } finally {
                logoutLocal();
                navigate("/", { replace: true });
            }
        };

        performLogout();
    }, [logoutLocal, navigate]);

    return (
        <div className="h-screen w-full grid place-items-center text-highlight">
            log usr out..
        </div>
    );
}
