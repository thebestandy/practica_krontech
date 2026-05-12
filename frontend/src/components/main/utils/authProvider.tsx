import React, { createContext, useState, useEffect, useContext } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const API_URL = "http://localhost:8000/api";

    useEffect(() => {
        const initAuth = async () => {
            const accessToken = localStorage.getItem("access_token");

            if (accessToken) {
                try {
                    const response = await fetch(`${API_URL}/user/`, {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                        },
                    });

                    if (response.ok) {
                        const userData = await response.json();
                        setUser(userData);
                    } else {
                        localStorage.removeItem("access_token");
                        localStorage.removeItem("refresh_token");
                    }
                } catch (error) {
                    console.error("Failed to fetch user:", error);
                }
            }
            setLoading(false);
        };

        initAuth();
    }, []);

    const login = (userData, access, refresh) => {
        localStorage.setItem("access_token", access);
        localStorage.setItem("refresh_token", refresh);
        setUser(userData);
    };

    const logout = async () => {
        const refresh = localStorage.getItem("refresh_token");

        if (refresh) {
            try {
                await fetch(`${API_URL}/logout/`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ refresh }),
                });
            } catch (error) {
                console.error("Logout failed:", error);
            }
        }

        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        setUser(null);
    };

    const contextValue = {
        user,
        isAuthenticated: !!user,
        loading,
        login,
        logout,
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        console.warn("no way someone is reading this in the console");
    }
    return context;
};
