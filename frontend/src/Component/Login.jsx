import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import "./StyleComp/LogReg.css";
import LogReg from "./../Assets/black.webp";

function Login({ setUser }) {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/api/login", formData);
  
      if (res?.data?.user) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        setUser(res.data.user);
        navigate("/");
      }
    } catch (error) {
      console.error("Login-Fehler:", error);
      alert(error.response?.data?.error || "Login fehlgeschlagen");
    }
  };

  return (
    <div className="log-reg" style={{ backgroundImage: `url(${LogReg})` }}>
      {/* Login Formular */}
      <div className="log-block" >

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
            Noch kein Account? <Link to="/register">hier anmelden</Link>.
          </p>
        </form>
      </div>
    </div>
  );
}

export default Login;