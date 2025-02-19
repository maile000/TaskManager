import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "./App.css";
import Login from "./Component/Login";
import Register from "./Component/Register";
import Navbar from "./Component/Nav";  // ⬅️ Navbar importieren

function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true); // Verhindert Flackern beim Laden

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            setUser(true);
        }
        setLoading(false); // Sobald überprüft, setzen wir loading auf false
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("token");
        setUser(false);
    };

    if (loading) {
        return <h1>Loading...</h1>; // Verhindert Flackern beim Laden
    }

    return (
        <Router>
            <Navbar user={user} onLogout={handleLogout} />  {/* Navbar hier eingefügt */}
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login setUser={setUser} />} />
                <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register setUser={setUser} />} />
                <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />
                <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
            </Routes>
        </Router>
    );
}

function Home() {
    return <h1>🏠 Willkommen auf der Startseite</h1>;
}

function Dashboard() {
    return <h1>📋 Willkommen im Board!</h1>;
}

function Profile() {
    return <h1> Dein Profil</h1>;
}

export default App;
