import { Link } from "react-router-dom";
import { useState } from "react";

import AuthLayout from "./components/AuthLayout";
import AuthInput from "./components/AuthInput";
import AuthButton from "./components/AuthButton";

import "./css/ForgotPassword.css";

import {
    getApiErrorCode,
    getApiErrorMessage,
    useAuthActions,
} from "../utils/useAuthActions";


export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const { forgotPassword } = useAuthActions();
    const [emailError, setEmailError] = useState("");
    const [successMessage, setSuccessMessage] =
        useState("");

    async function handleSubmit(
        event: React.FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        setEmailError("");
        setSuccessMessage("");

        if (!email.trim()) {
            setEmailError(
                "Please enter your email address."
            );
            return;
        }

        if (!email.includes("@")) {
            setEmailError(
                "Please enter a valid email address."
            );
            return;
        }

       try {
            const response = await forgotPassword(email);

            setSuccessMessage(
                response.detail || "We've sent a password reset link to your email."
            );
        } catch (error) {
            const code = getApiErrorCode(error);

            if (code === "use_google_login") {
                setEmailError(
                    "This account uses Google. Please continue with Google."
                );
                return;
            }

            setEmailError(
                getApiErrorMessage(error, "Could not send reset link.")
            );
        }
    }

    return (
        <AuthLayout>
            <div className="forgot-password-header">
                <h1>Forgot password?</h1>

                <p>
                    Enter your email and we&apos;ll send you
                    a password reset link.
                </p>
            </div>

            <form
                className="forgot-password-form"
                onSubmit={handleSubmit}
            >
                <AuthInput
                    label="Email address"
                    type="email"
                    placeholder="hello@app.com"
                    value={email}
                    error={emailError}
                    onChange={(event) => {
                        setEmail(event.target.value);

                        setEmailError("");
                        setSuccessMessage("");
                    }}
                />

            <div className="forgot-password-message-slot">
                {successMessage && (
                    <p className="forgot-password-success">
                        {successMessage}
                    </p>
                )}
            </div>

                <AuthButton type="submit">
                    Send reset link
                </AuthButton>
            </form>

            <p className="forgot-password-login-text">
                Remember your password?{" "}
                <Link to="/login">Sign in</Link>
            </p>
        </AuthLayout>
    );
}