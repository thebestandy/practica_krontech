import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./components/main/home/Home";
import Dashboard from "./components/main/dashboard/Dashboard";
import "./App.css";
import Enterprise from "./components/main/enterprise/Enterprise";
import About from "./components/main/about/About";
import Beliefs from "./components/main/beliefs/Beliefs";
import Login from "./components/main/accounts/Login";
import Register from "./components/main/accounts/Register";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/enterprise" element={<Enterprise />} />
                <Route path="/about" element={<About />} />
                <Route path="/beliefs" element={<Beliefs />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
