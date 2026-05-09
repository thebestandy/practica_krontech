import "../css/layout/AuthDivider.css";

export default function AuthDivider() {
    return (
        <div className="auth-divider">
            <span className="auth-divider-line" />

            <p className="auth-divider-text">
                or
            </p>

            <span className="auth-divider-line" />
        </div>
    );
}