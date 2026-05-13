import React, { useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "../../theme-provider";

import AuthLayout from "./components/AuthLayout";
import AuthButton from "./components/AuthButton";

import mailIconYellow from "../../../assets/AuthPages/YellowMailIcon.png";     
import mailIconPurple from "../../../assets/AuthPages/PurpleMailIcon.png";
import mailIconTurquoise from "../../../assets/AuthPages/TurquoiseMailIcon.png"; 

import "./css/CheckEmail.css";
import {
    getApiErrorMessage,
    useAuthActions,
} from "../utils/useAuthActions";
const CODE_LENGTH = 6;


export default function CheckEmail() {
    const { theme } = useTheme();

    const mailIconMap: Record<string, string> = {
        yellow: mailIconYellow,
        purple: mailIconPurple,
        turquoise: mailIconTurquoise,
    };

    const currentMailIcon = mailIconMap[theme] ?? mailIconYellow;

    const navigate = useNavigate();
    const location = useLocation();
    const { verifyEmail, resendVerificationCode } = useAuthActions();
    const email = location.state?.email || "";

    const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

    const [code, setCode] = useState<string[]>(
        Array(CODE_LENGTH).fill("")
    );
    const [codeError, setCodeError] = useState("");
    const [resendMessage, setResendMessage] = useState("");

    if (!email) {
        navigate("/register");
        return null;
    }
        
    function handleCodeChange(value: string, index: number) {
        const cleanValue = value
            .replace(/[^a-zA-Z0-9]/g, "")
            .slice(0, 1)
            .toUpperCase();

        const updatedCode = [...code];
        updatedCode[index] = cleanValue;

        setCode(updatedCode);
        setCodeError("");
        setResendMessage("");

        if (cleanValue && index < CODE_LENGTH - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    }

    function handleKeyDown(
        event: React.KeyboardEvent<HTMLInputElement>,
        index: number
    ) {
        if (
            event.key === "Backspace" &&
            !code[index] &&
            index > 0
        ) {
            inputRefs.current[index - 1]?.focus();
        }
    }

    function handlePaste(
        event: React.ClipboardEvent<HTMLInputElement>
    ) {
        event.preventDefault();

        const pastedCode = event.clipboardData
            .getData("text")
            .replace(/[^a-zA-Z0-9]/g, "")
            .toUpperCase()
            .slice(0, CODE_LENGTH)
            .split("");

        const updatedCode = Array(CODE_LENGTH).fill("");

        pastedCode.forEach((character, index) => {
            updatedCode[index] = character;
        });

        setCode(updatedCode);
        setCodeError("");
        setResendMessage("");

        const nextIndex = Math.min(
            pastedCode.length,
            CODE_LENGTH - 1
        );

        inputRefs.current[nextIndex]?.focus();
    }

    async function handleResendCode() {
        setCode(Array(CODE_LENGTH).fill(""));
        setCodeError("");
        setResendMessage("");

        try {
            const response = await resendVerificationCode(email);

            setResendMessage(
                response.detail || "A new confirmation code has been sent."
            );
        } catch (error) {
            setCodeError(
                getApiErrorMessage(error, "Could not resend confirmation code.")
            );
        }
    }

   async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const confirmationCode = code.join("");

        if (confirmationCode.length !== CODE_LENGTH) {
            setCodeError("Please enter the confirmation code.");
            return;
        }

        try {
            await verifyEmail({
                email,
                code: confirmationCode,
            });

            navigate("/dashboard");
        } catch (error) {
            setCodeError(
                getApiErrorMessage(error, "The confirmation code is incorrect.")
            );
        }
    }

    return (
        <AuthLayout>
            <form
                className="check-email-form"
                onSubmit={handleSubmit}
            >
                <div className="check-email-header">
                    <img
                        src={currentMailIcon}
                        alt="Check Email"
                        className="check-email-image"
                    />

                    <h1>Check your email</h1>

                    <p>
                        We&apos;ve sent a confirmation code to
                        <br />
                        <span>{email}</span>
                    </p>

                    <small>
                        Enter the 6-character code below to
                        verify your account.
                    </small>
                </div>

                <div className="check-email-code-group">
                    <div className="check-email-code-boxes">
                        {code.map((character, index) => (
                            <React.Fragment key={index}>
                                {index === 3 && (
                                    <span className="check-email-code-separator">
                                        —
                                    </span>
                                )}

                                <input
                                    ref={(element) => {
                                        inputRefs.current[index] =
                                            element;
                                    }}
                                    type="text"
                                    inputMode="text"
                                    maxLength={1}
                                    value={character}
                                    onChange={(event) =>
                                        handleCodeChange(
                                            event.target.value,
                                            index
                                        )
                                    }
                                    onKeyDown={(event) =>
                                        handleKeyDown(
                                            event,
                                            index
                                        )
                                    }
                                    onPaste={handlePaste}
                                    className={`check-email-code-box ${
                                        codeError
                                            ? "check-email-code-box-error"
                                            : ""
                                    }`}
                                />
                            </React.Fragment>
                        ))}
                    </div>

                    <div className="check-email-message-slot">
                        {codeError && (
                            <p className="check-email-error">
                                {codeError}
                            </p>
                        )}

                        {!codeError && resendMessage && (
                            <p className="check-email-success">
                                {resendMessage}
                            </p>
                        )}
                    </div>
                </div>

                <AuthButton type="submit">
                    Confirm account
                </AuthButton>

                <p className="check-email-resend">
                    Didn&apos;t receive the code?{" "}
                    <button
                        type="button"
                        onClick={handleResendCode}
                    >
                        Resend code
                    </button>
                </p>
            </form>
        </AuthLayout>
    );
}