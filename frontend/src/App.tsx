import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./components/main/home/Home";
import Dashboard from "./components/main/dashboard/Dashboard";
import "./App.css";
import Enterprise from "./components/main/enterprise/Enterprise";
import About from "./components/main/about/About";
import Beliefs from "./components/main/beliefs/Beliefs";
import Login from "./components/main/accounts/Login";
import Register from "./components/main/accounts/Register";
import ForgotPassword from "./components/main/accounts/ForgotPassword";
import CheckEmail from "./components/main/accounts/CheckEmail";
import ResetPassword from "./components/main/accounts/ResetPassword";
import ProtectedRoute from "./components/main/utils/ProtectedRoute";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                />
                <Route path="/enterprise" element={<Enterprise />} />
                <Route path="/about" element={<About />} />
                <Route path="/beliefs" element={<Beliefs />} />
                <Route path="/login" element={<Login />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password/:uid/:token" element={<ResetPassword />} />
                <Route path="/register" element={<Register />} />
                <Route path="/check-email" element={<CheckEmail />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
