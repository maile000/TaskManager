import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "./App.css";
import Login from "./Component/Login";
import Register from "./Component/Register";
import Navbar from "./Component/Nav";
import Landing from "./Pages/Landing";
import Board from "./Pages/Board";
import Home from "./Pages/Home";
import Team from "./Pages/Team";
import TeamPage from "./Pages/TeamPages";

function App() {
    const [user, setUser] = useState(false);
    const [loading, setLoading] = useState(true);

    // Funktion zum Überprüfen, ob der Token abgelaufen ist (Voraussetzung: JWT-Format)
    const isTokenExpired = (token) => {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.exp < Date.now() / 1000;
        } catch (error) {
            return true;
        }
    };

    const checkToken = () => {
        const token = localStorage.getItem("token");
        if (token && !isTokenExpired(token)) {
            setUser(true);
        } else {
            localStorage.removeItem("token");
            setUser(false);
        }
    };

    useEffect(() => {
        // Direkt beim Laden den Token prüfen
        checkToken();
        setLoading(false);

        // Optional: Regelmäßige Überprüfung alle 60 Sekunden
        const interval = setInterval(() => {
            checkToken();
        }, 60000);

        return () => clearInterval(interval);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("token");
        setUser(false);
    };

    if (loading) {
        return <h1>Loading...</h1>;
    }

    return (
        <Router>
            <Navbar user={user} onLogout={handleLogout} />
            <Routes>
                <Route path="/" element={user ? <Home /> : <Landing />} />
                <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login setUser={setUser} />} />
                <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register setUser={setUser} />} />
                <Route path="/team/:teamId/dashboard" element={user ? <Board /> : <Navigate to="/login" />} />
                <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
                <Route path="/team/:teamId" element={user ? <TeamPage /> : <Navigate to="/login" />} />
                <Route path="/team" element={user ? <Team /> : <Navigate to="/login" />} />
            </Routes>
        </Router>
    );
}

function Profile() {
    return <h1>Dein Profil</h1>;
}

export default App;
