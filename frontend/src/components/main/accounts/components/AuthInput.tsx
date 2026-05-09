import "../css/AuthInput.css";

interface AuthInputProps {
    label: string;
    type: string;
    placeholder: string;
    value?: string;
    error?: string;
    onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function AuthInput({
    label,
    type,
    placeholder,
    value,
    error,
    onChange,
}: AuthInputProps) {
    return (
        <div className="auth-input-wrapper">
            <label className="auth-input-label">
                {label}
            </label>

            <input
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                className={`auth-input ${error ? "auth-input-error" : ""}`}
            />

            {error && (
                <p className="auth-input-error-message">
                    {error}
                </p>
            )}
        </div>
    );
}