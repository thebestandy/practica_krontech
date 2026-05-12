import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import googleLogo from "../../../../assets/AuthPages/GoogleLogo.png";

import "../css/layout/GoogleButton.css";

import {
    getApiErrorMessage,
    useAuthActions,
} from "../../utils/useAuthActions";

export default function GoogleButton() {
    const navigate = useNavigate();
    const { loginWithGoogle } = useAuthActions();
    const [error, setError] = useState("");
    const googleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            setError("");

            try {
                await loginWithGoogle(tokenResponse.access_token);
                navigate("/dashboard");
            } catch (error) {
                setError(
                    getApiErrorMessage(error, "Could not sign in with Google.")
                );
            }
        },
        onError: () => {
            setError("Google sign in was cancelled or failed.");
        },
    });

    return (
        <>
            <button
                type="button"
                className="google-button"
                onClick={() => googleLogin()}
            >
                <img
                    src={googleLogo}
                    alt="Google"
                    className="google-button-icon"
                />

                <span>
                    Continue with Google
                </span>
            </button>

            {error && (
                <p className="auth-google-error">
                    {error}
                </p>
            )}
        </>
    );
}