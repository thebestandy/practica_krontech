import React, {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import axios from "axios";

export const API_BASE_URL = "http://localhost:8000/api";

export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use((config) => {
    const access = localStorage.getItem("access");

    if (access) {
        config.headers.Authorization = `Bearer ${access}`;
    }

    return config;
});

type AuthUser = {
    id: number;
    name: string;
    username: string;
    email: string;
    account_type: "personal" | "business";
    auth_provider: "email" | "google";
};

type AuthContextValue = {
    user: AuthUser | null;
    loading: boolean;
    isAuthenticated: boolean;
    saveAuth: (access: string, refresh: string, user?: AuthUser | null) => void;
    logoutLocal: () => void;
    fetchUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [tokenVersion, setTokenVersion] = useState(0);

    function saveAuth(access: string, refresh: string, userData?: AuthUser | null) {
        localStorage.setItem("access", access);
        localStorage.setItem("refresh", refresh);

        if (userData) {
            setUser(userData);
        }

        setTokenVersion((current) => current + 1);
    }

    function logoutLocal() {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        setUser(null);
        setTokenVersion((current) => current + 1);
    }

    async function fetchUser() {
        const access = localStorage.getItem("access");

        if (!access) {
            setUser(null);
            return;
        }

        try {
            const response = await api.get<AuthUser>("/auth/user/");
            setUser(response.data);
        } catch {
            logoutLocal();
        }
    }

    useEffect(() => {
        async function initAuth() {
            await fetchUser();
            setLoading(false);
        }

        initAuth();
    }, []);

    const value = useMemo<AuthContextValue>(
        () => ({
            user,
            loading,
            isAuthenticated: Boolean(localStorage.getItem("access")),
            saveAuth,
            logoutLocal,
            fetchUser,
        }),
        [user, loading, tokenVersion]
    );

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth must be used inside AuthProvider");
    }

    return context;
}