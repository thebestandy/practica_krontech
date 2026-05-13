import { Link, useNavigate, useParams } from "react-router-dom";
import { useState } from "react";

import AuthLayout from "./components/AuthLayout";
import AuthInput from "./components/AuthInput";
import AuthButton from "./components/AuthButton";

import "./css/ResetPassword.css";
import {
    getApiErrorMessage,
    useAuthActions,
} from "../utils/useAuthActions";


export default function ResetPassword() {
    const navigate = useNavigate();

    const { uid, token } = useParams();

    const { resetPassword } = useAuthActions();

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] =
        useState("");

    const [passwordError, setPasswordError] =
        useState("");

    const [confirmPasswordError, setConfirmPasswordError] =
        useState("");

    const [successMessage, setSuccessMessage] =
        useState("");

    if (!uid || !token) {
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

    async function handleSubmit(
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

        try {
            const response = await resetPassword({
                uid,
                token,
                password,
                confirmPassword,
            });

            setSuccessMessage(
                response.detail || "Password updated successfully."
            );

            setTimeout(() => {
                navigate("/login");
            }, 1200);
          }catch (error) {
            setConfirmPasswordError(
                getApiErrorMessage(error, "Could not reset password.")
            );
        }
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