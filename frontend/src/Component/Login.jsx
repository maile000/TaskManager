import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import "./StyleComp/LogReg.css";
import LogReg from "./../Assets/black.jpg";

function Login({ setUser }) {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("📌 Login-Daten:", formData);
    try {
      const res = await axios.post("http://localhost:5000/login", formData);
      console.log("📌 Server-Antwort:", res.data); 

      if (res && res.data && res.data.token && res.data.user) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        setUser(true);
        navigate("/");
      } else {
        throw new Error("Ungültige Serverantwort");
      }
    } catch (error) {
      console.error("❌ Login-Fehler:", error);
      alert(error.response?.data?.error || "Fehler beim Login. Bitte versuche es erneut.");
    }
  };

  return (
    <div className="log-reg" style={{ backgroundImage: `url(${LogReg})` }}>
      <div className="log-block">
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            name="email"
            placeholder="Email"
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            onChange={handleChange}
            required
          />
          <button className="button" type="submit">
            Login
          </button>
          <p>
            Don't have an account yet? <Link to="/register">Sign up here</Link>.
          </p>
        </form>
      </div>
    </div>
  );
}

export default Login;