import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Login from "./Component/Login";
import Register from "./Component/Register";

function App() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            setUser(true);
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("token");
        setUser(false);
    };

    return (
        <Router>
            <nav>
                {user ? (
                    <button onClick={handleLogout}>Logout</button>
                ) : (
                    <>
                        <a href="/">Login</a>
                        <a href="/register">Registrieren</a>
                    </>
                )}
            </nav>

            <Routes>
                <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Login setUser={setUser} />} />
                <Route path="/register" element={<Register setUser={setUser} />} />
                <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/" />} />
            </Routes>
        </Router>
    );
}

function Dashboard() {
    return (
        <div>
            <h1>Willkommen im Dashboard! 🎉</h1>
            <p>Hier siehst du deine Teams und Aufgaben.</p>
        </div>
    );
}

export default App;
