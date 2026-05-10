import React, { useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "../../theme-provider";

import AuthLayout from "./components/AuthLayout";
import AuthButton from "./components/AuthButton";

import mailIconDark from "../../../assets/AuthPages/MailIcon.png";     
import mailIconPurple from "../../../assets/AuthPages/MailIcon.png";
import mailIconTurquoise from "../../../assets/AuthPages/MailIcon.png"; 

import "./css/CheckEmail.css";

const CODE_LENGTH = 6;
const MOCK_CONFIRMATION_CODE = "A1B2C3";

export default function CheckEmail() {
    const { theme } = useTheme();

    const mailIconMap: Record<string, string> = {
        dark: mailIconDark,
        purple: mailIconPurple,
        turquoise: mailIconTurquoise,
    };

    const currentMailIcon = mailIconMap[theme] ?? mailIconDark;

    const navigate = useNavigate();
    const location = useLocation();

    const email = location.state?.email || "example@mail.com";

    const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

    const [code, setCode] = useState<string[]>(
        Array(CODE_LENGTH).fill("")
    );

    const [codeError, setCodeError] = useState("");
    const [resendMessage, setResendMessage] = useState("");

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

    function handleResendCode() {
        setCode(Array(CODE_LENGTH).fill(""));
        setCodeError("");

        // TODO: API call for resend confirmation code.
        setResendMessage(
            "A new confirmation code has been sent."
        );
    }

    function handleSubmit(
        event: React.FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        const confirmationCode = code.join("");

        if (confirmationCode.length !== CODE_LENGTH) {
            setCodeError(
                "Please enter the confirmation code."
            );
            return;
        }

        // TODO: API call for confirmation code verification.
        if (
            confirmationCode !== MOCK_CONFIRMATION_CODE
        ) {
            setCodeError(
                "The confirmation code is incorrect."
            );
            return;
        }

        navigate("/dashboard");
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