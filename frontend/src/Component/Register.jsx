import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./StyleComp/LogReg.css";
import LogReg from "./../Assets/glas1.png";


function Register({ setUser }) {
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    try {
      // 1. Registrierung
      const res = await axios.post("http://localhost:5000/api/register", formData);
      
      if (!res?.data?.token) {
        // 2. Automatischer Login nach Registrierung
        const loginRes = await axios.post("http://localhost:5000/api/login", {
          email: formData.email,
          password: formData.password
        });
        
        if (loginRes?.data?.token) {
          localStorage.setItem("token", loginRes.data.token);
          localStorage.setItem("user", JSON.stringify(loginRes.data.user));
          setUser(loginRes.data.user);
          navigate("/");
        }
      } else {
        // Falls der Register-Endpoint bereits den Token zurückgibt
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        setUser(res.data.user);
        navigate("/");
      }
    } catch (error) {
      console.error("Registrierungsfehler:", error);
      alert(error.response?.data?.error || "Registrierung fehlgeschlagen");
    }
  };

  return (
    <div className="log-reg" style={{ backgroundImage: `url(${LogReg})` }}>
      <div className="log-block column">
        <form onSubmit={handleSubmit} >
          <input
            type="text"
            name="name"
            placeholder="Username"
            onChange={handleChange}
            required
          />
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
            placeholder="Passwort"
            onChange={handleChange}
            required
          />
          <button className="button" type="submit">
            Registrieren
          </button>
        </form>
        <p>
          Du hast ein Account? <a href="/login">Login hier</a>.
        </p>
      </div>
    </div>
  );
}

export default Register;