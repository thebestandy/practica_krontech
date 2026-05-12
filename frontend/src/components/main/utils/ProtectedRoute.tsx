import { Navigate } from "react-router-dom";
import { useAuth } from "./authProvider";

export default function ProtectedRoute({
    children,
}: {
    children: React.ReactNode;
}) {
    const { isAuthenticated } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return children;
}