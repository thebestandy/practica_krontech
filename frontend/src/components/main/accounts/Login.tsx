import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import AuthLayout from "./components/AuthLayout";
import AuthInput from "./components/AuthInput";
import AuthButton from "./components/AuthButton";
import GoogleButton from "./components/GoogleButton";
import AuthDivider from "./components/AuthDivider";

import "./css/Login.css";
import {
    getApiErrorCode,
    getApiErrorEmail,
    getApiErrorMessage,
    useAuthActions,
} from "../utils/useAuthActions";


export default function Login() {
    const navigate = useNavigate();
    const { login } = useAuthActions();
    const [showPassword, setShowPassword] = useState(false);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [emailError, setEmailError] = useState("");
    const [passwordError, setPasswordError] = useState("");

    function handleEmailStep() {
        setEmailError("");

        if (!email.trim()) {
            setEmailError("Please enter your email address.");
            return;
        }

        if (!email.includes("@")) {
            setEmailError("Please enter a valid email address.");
            return;
        }

        setShowPassword(true);
    }

    async function handlePasswordStep() {
        setPasswordError("");

        if (!password.trim()) {
            setPasswordError("Please enter your password.");
            return;
        }

        try {
            await login({
                email,
                password,
            });

            navigate("/dashboard");
        } catch (error) {
            const code = getApiErrorCode(error);

            if (code === "registration_pending") {
                navigate("/check-email", {
                    state: {
                        email: getApiErrorEmail(error) || email,
                    },
                });
                return;
            }

            if (code === "use_google_login") {
                setPasswordError(
                    "This account uses Google. Please continue with Google."
                );
                return;
            }

            setPasswordError(
                getApiErrorMessage(error, "Email or password is incorrect.")
            );
        }
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (showPassword) {
            await handlePasswordStep();
            return;
        }

        handleEmailStep();
    }

    
    

    return (
        <AuthLayout>
            <div className="login-header">
                <h1>Sign in</h1>
                <p>Welcome back! Please sign in to continue.</p>
            </div>

            <GoogleButton />

            <AuthDivider />

            <form className="login-form" onSubmit={handleSubmit}>
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

                {showPassword && (
                    <div className="login-password-section">
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

                        <Link
                            to="/forgot-password"
                            className="login-forgot-link"
                        >
                            Forgot password?
                        </Link>
                    </div>
                )}

                <AuthButton type="submit">
                    {showPassword ? "Sign in" : "Continue"}
                </AuthButton>
            </form>

            <p className="login-register-text">
                Don&apos;t have an account? <Link to="/register">Sign up</Link>
            </p>
        </AuthLayout>
    );
}

