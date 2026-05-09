import { useNavigate } from "react-router-dom";

import googleLogo from "../../../../assets/AuthPages/GoogleLogo.png";

import "../css/layout/GoogleButton.css";

export default function GoogleButton() {
    const navigate = useNavigate();

    function handleGoogleLogin() {

        // TODO: Google OAuth API call here.

        navigate("/dashboard");
    }

    return (
        <button
            type="button"
            className="google-button"
            onClick={handleGoogleLogin}
        >
            <img
                src={googleLogo}
                alt="Google"
                className="google-button-icon"
            />

            <span>
                Continue with Google
            </span>
        </button>
    );
}