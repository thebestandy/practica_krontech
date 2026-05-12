import axios from "axios";
import { api, useAuth } from "./authProvider";

type AccountType = "personal" | "business";

function getUsernameFromEmail(email: string) {
    return email
        .split("@")[0]
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "_");
}

export function getApiErrorMessage(error: unknown, fallback: string) {
    if (axios.isAxiosError(error)) {
        const data = error.response?.data as any;

        if (data?.detail) {
            return data.detail;
        }

        if (data?.non_field_errors?.[0]) {
            return data.non_field_errors[0];
        }

        const firstKey = data && typeof data === "object"
            ? Object.keys(data)[0]
            : null;

        if (firstKey && Array.isArray(data[firstKey])) {
            return data[firstKey][0];
        }

        if (error.response?.status === 500) {
            return "Server error. Please try again later.";
        }

        if (error.response?.status === 404) {
            return "Request not found.";
        }

        if (error.response?.status === 400) {
            return "Invalid request.";
        }
    }

    return fallback;
}

export function getApiErrorCode(error: unknown) {
    if (!axios.isAxiosError(error)) {
        return null;
    }

    const data = error.response?.data as any;

    return data?.code || null;
}

export function getApiErrorEmail(error: unknown) {
    if (!axios.isAxiosError(error)) {
        return null;
    }

    const data = error.response?.data as any;

    return data?.email || null;
}

export function useAuthActions() {
    const { saveAuth, logoutLocal, fetchUser } = useAuth();

    async function register(params: {
        email: string;
        password: string;
        confirmPassword: string;
        accountType: AccountType;
    }) {
        const username = getUsernameFromEmail(params.email);

        const response = await api.post("/auth/register/", {
            name: username,
            username,
            email: params.email,
            password: params.password,
            confirm_password: params.confirmPassword,
            account_type: params.accountType,
        });

        return response.data;
    }

    async function verifyEmail(params: { email: string; code: string }) {
        const response = await api.post("/auth/verify-email/", {
            email: params.email,
            code: params.code,
        });

        saveAuth(response.data.access, response.data.refresh, response.data.user);

        return response.data;
    }

    async function resendVerificationCode(email: string) {
        const response = await api.post("/auth/resend-verification-code/", {
            email,
        });

        return response.data;
    }

    async function login(params: { email: string; password: string }) {
        const response = await api.post("/auth/login/", {
            email: params.email,
            password: params.password,
        });

        saveAuth(response.data.access, response.data.refresh);
        await fetchUser();

        return response.data;
    }

    async function loginWithGoogle(token: string) {
        const response = await api.post("/auth/google/", {
            token,
        });

        saveAuth(response.data.access, response.data.refresh, response.data.user);

        return response.data;
    }
    async function forgotPassword(email: string) {
        const response = await api.post("/auth/forgot-password/", {
            email,
        });

        return response.data;
    }

    async function resetPassword(params: {
        uid: string;
        token: string;
        password: string;
        confirmPassword: string;
    }) {
        const response = await api.post("/auth/reset-password/", {
            uid: params.uid,
            token: params.token,
            password: params.password,
            confirm_password: params.confirmPassword,
        });

        return response.data;
    }

    async function logout() {
        const refresh = localStorage.getItem("refresh");

        if (refresh) {
            await api.post("/auth/logout/", { refresh }).catch(() => null);
        }

        logoutLocal();
    }

    return {
        register,
        verifyEmail,
        resendVerificationCode,
        login,
        loginWithGoogle,
        forgotPassword,
        resetPassword,
        logout,
    };
}