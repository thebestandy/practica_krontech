import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useState } from "react";

import AuthLayout from "./components/AuthLayout";
import AuthInput from "./components/AuthInput";
import AuthButton from "./components/AuthButton";

import "./css/ResetPassword.css";

export default function ResetPassword() {
    const navigate = useNavigate();

    const [searchParams] = useSearchParams();

    const token = searchParams.get("token");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] =
        useState("");

    const [passwordError, setPasswordError] =
        useState("");

    const [confirmPasswordError, setConfirmPasswordError] =
        useState("");

    const [successMessage, setSuccessMessage] =
        useState("");

    if (!token) {
        return (
            <AuthLayout>
                <div className="reset-password-invalid">
                    <h1>Invalid reset link</h1>

                    <p>
                        This password reset link is invalid
                        or has expired.
                    </p>

                    <Link to="/forgot-password">
                        <AuthButton>
                            Request new link
                        </AuthButton>
                    </Link>
                </div>
            </AuthLayout>
        );
    }

    function handleSubmit(
        event: React.FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        setPasswordError("");
        setConfirmPasswordError("");
        setSuccessMessage("");

        if (!password.trim()) {
            setPasswordError(
                "Please enter your new password."
            );
            return;
        }

        if (password.length < 6) {
            setPasswordError(
                "Password must contain at least 6 characters."
            );
            return;
        }

        if (!confirmPassword.trim()) {
            setConfirmPasswordError(
                "Please confirm your password."
            );
            return;
        }

        if (password !== confirmPassword) {
            setConfirmPasswordError(
                "Passwords do not match."
            );
            return;
        }

        // TODO: API call for reset token validation.

        // TODO: API call for password reset.

        setSuccessMessage(
            "Password updated successfully."
        );

        setTimeout(() => {
            navigate("/login");
        }, 1200);
    }

    return (
        <AuthLayout>
            <div className="reset-password-header">
                <h1>Reset password</h1>

                <p>
                    Enter your new password below to
                    complete the reset process.
                </p>
            </div>

            <form
                className="reset-password-form"
                onSubmit={handleSubmit}
            >
                <AuthInput
                    label="New password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    error={passwordError}
                    onChange={(event) => {
                        setPassword(event.target.value);

                        setPasswordError("");
                        setSuccessMessage("");
                    }}
                />

                <AuthInput
                    label="Confirm password"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    error={confirmPasswordError}
                    onChange={(event) => {
                        setConfirmPassword(
                            event.target.value
                        );

                        setConfirmPasswordError("");
                        setSuccessMessage("");
                    }}
                />

                <div className="reset-password-message-slot">
                    {successMessage && (
                        <p className="reset-password-success">
                            {successMessage}
                        </p>
                    )}
                </div>

                <AuthButton type="submit">
                    Reset password
                </AuthButton>
            </form>

            <p className="reset-password-login-text">
                Back to{" "}
                <Link to="/login">Sign in</Link>
            </p>
        </AuthLayout>
    );
}