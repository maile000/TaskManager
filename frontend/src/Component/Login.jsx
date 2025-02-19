import { useState } from "react";
import axios from "axios";
import "../Style/LogReg.css";

function Login({ setUser }) {
  const [formData, setFormData] = useState({ email: "", password: "" });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        const res = await axios.post("http://localhost:5000/login", formData);

        if (res && res.data && res.data.token) {
            localStorage.setItem("token", res.data.token);
            setUser(true);
        } else {
            throw new Error("Ungültige Serverantwort");
        }
    } catch (error) {
        console.error("Login-Fehler:", error);
        alert(error.response?.data?.error || "Fehler beim Login. Bitte versuche es erneut.");
    }
  };

  return (
    <div className="log-reg">
      <div className="log-block">
        <form onSubmit={handleSubmit}>
        <input type="email" name="email" placeholder="Email" onChange={handleChange} required />
        <input type="password" name="password" placeholder="password" onChange={handleChange} required />
        <button className="button" type="submit">Login</button>
        <p>Don't have an account yet? <a href="/register">Sign up here</a>.</p>
      </form>
      </div>
    </div>
  );
}

export default Login;
