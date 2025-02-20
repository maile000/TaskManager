import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Style/LogReg.css";

function Register({ setUser }) {
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
        const res = await axios.post("http://localhost:5000/register", formData);

        if (res && res.data) {
            alert("✅ Erfolgreich registriert! Jetzt einloggen.");
        } else {
            throw new Error("Ungültige Serverantwort");
        }
    } catch (error) {
        console.error("❌ Registrierungs-Fehler:", error);

        if (error.response) {
            console.error("📌 Fehlerdetails:", error.response.data);
            alert(error.response.data.error || "Fehler bei der Registrierung.");
        } else {
            alert("❌ Netzwerkfehler oder Server nicht erreichbar.");
        }
    }
};

  return (
    <div className="log-reg">
      <div className="log-block">
        <form onSubmit={handleSubmit}>
          <input type="text" name="name" placeholder="Username" onChange={handleChange} required />
          <input type="email" name="email" placeholder="Email" onChange={handleChange} required />
          <input type="password" name="password" placeholder="Passwort" onChange={handleChange} required />
          <button className="button" type="submit">Registrieren</button>
        </form>
        <p>You have an account? <a href="/login">Login here</a>.</p>
      </div>
    </div>
   
  );
}

export default Register;
