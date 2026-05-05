import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./components/main/home/Home";
import Dashboard from "./components/main/dashboard/Dashboard";
import "./App.css";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
