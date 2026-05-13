import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import AuthLayout from "./components/AuthLayout";
import AuthInput from "./components/AuthInput";
import AuthButton from "./components/AuthButton";
import GoogleButton from "./components/GoogleButton";
import AuthDivider from "./components/AuthDivider";

import "./css/Register.css";
import {
    getApiErrorCode,
    getApiErrorMessage,
    useAuthActions,
} from "../utils/useAuthActions";




export default function Register() {
    const navigate = useNavigate();
    const { register } = useAuthActions();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [accountType, setAccountType] = useState<"personal" | "business">(
    "personal"
    );

    const [emailError, setEmailError] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [confirmPasswordError, setConfirmPasswordError] = useState("");

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setEmailError("");
        setPasswordError("");
        setConfirmPasswordError("");

        if (!email.trim()) {
            setEmailError("Please enter your email address.");
            return;
        }

        if (!email.includes("@")) {
            setEmailError("Please enter a valid email address.");
            return;
        }

        
        if (!password.trim()) {
            setPasswordError("Please enter your password.");
            return;
        }

        if (password.length < 6) {
            setPasswordError("Password must be at least 6 characters.");
            return;
        }

        if (!confirmPassword.trim()) {
            setConfirmPasswordError("Please confirm your password.");
            return;
        }

        if (password !== confirmPassword) {
            setConfirmPasswordError("Passwords do not match.");
            return;
        }

        try {
            const response = await register({
                email,
                password,
                confirmPassword,
                accountType,
            });

            navigate("/check-email", {
                state: {
                    email: response.email,
                },
            });
        } catch (error) {
            const code = getApiErrorCode(error);

            if (code === "google_account_exists") {
                setEmailError(
                    "This email is already connected with Google. Please continue with Google."
                );
                return;
            }

            setEmailError(
                getApiErrorMessage(error, "Could not create account.")
            );
        }
    }

    return (
        <AuthLayout>
            <div className="register-header">
                <h1>Create account</h1>
                <p>Start organizing your work smarter today.</p>
            </div>

            <GoogleButton />

            <AuthDivider />

            <form className="register-form" onSubmit={handleSubmit}>
                <AuthInput
                    label="Email address"
                    type="email"
                    placeholder="example@mail.com"
                    value={email}
                    error={emailError}
                    onChange={(event) => {
                        setEmail(event.target.value);
                        setEmailError("");
                    }}
                />

                <AuthInput
                    label="Password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    error={passwordError}
                    onChange={(event) => {
                        setPassword(event.target.value);
                        setPasswordError("");
                    }}
                />

                <AuthInput
                    label="Confirm password"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    error={confirmPasswordError}
                    onChange={(event) => {
                        setConfirmPassword(event.target.value);
                        setConfirmPasswordError("");
                    }}
                />

                <div className="register-account-type">
                    <p>Account type</p>

                    <div className="register-account-type-options">
                        <button
                            type="button"
                            className={`register-account-type-option ${
                                accountType === "personal" ? "active" : ""
                            }`}
                            onClick={() => setAccountType("personal")}
                        >
                            Personal
                        </button>

                        <button
                            type="button"
                            className={`register-account-type-option ${
                                accountType === "business" ? "active" : ""
                            }`}
                            onClick={() => setAccountType("business")}
                        >
                            Company
                        </button>
                    </div>
                </div>

                <AuthButton type="submit">Create account</AuthButton>
            </form>

            <p className="register-login-text">
                Already have an account? <Link to="/login">Sign in</Link>
            </p>
        </AuthLayout>
    );
}