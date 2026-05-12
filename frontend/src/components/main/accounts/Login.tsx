import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import AuthLayout from "./components/AuthLayout";
import AuthInput from "./components/AuthInput";
import AuthButton from "./components/AuthButton";
import GoogleButton from "./components/GoogleButton";
import AuthDivider from "./components/AuthDivider";

import "./css/Login.css";
import { useAuth } from "../utils/authProvider";

const MOCK_EMAIL = "test@scraps.com";
const MOCK_PASSWORD = "123456";

export default function Login() {
    const navigate = useNavigate();

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

        // TODO: API call for existing email.
        if (email !== MOCK_EMAIL) {
            setEmailError("We couldn't find an account with this email.");
            return;
        }

        setShowPassword(true);
    }

    function handlePasswordStep() {
        setPasswordError("");

        if (!password.trim()) {
            setPasswordError("Please enter your password.");
            return;
        }

        // TODO: API call for login.
        if (password !== MOCK_PASSWORD) {
            setPasswordError("The password you entered is incorrect.");
            return;
        }

        navigate("/dashboard");
    }

    function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (showPassword) {
            handlePasswordStep();
            return;
        }

        handleEmailStep();
    }

    // Alr baieti am facut auth provider-ul, un mic exemplu de login:
    const { login } = useAuth();

    const handleLogin = async (e) => {
        e.preventDefault();

        const response = await fetch("http://localhost:8000/api/login/", {
            method: "POST",
            headers: {
                /* headere si asa */
            },
            body: JSON.stringify({ email, password }),
        });

        if (response.ok) {
            const data = await response.json();
            login(data.user, data.access, data.refresh);
        } else {
            console.log("mna");
        }
    };

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

