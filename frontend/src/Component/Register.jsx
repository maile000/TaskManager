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
      // Registrierungsanfrage senden
      const res = await axios.post("http://localhost:5000/register", formData);

      if (res && res.data) {
        console.log("✅ Erfolgreich registriert:", res.data);

        // Automatisch einloggen nach erfolgreicher Registrierung
        const loginRes = await axios.post("http://localhost:5000/login", {
          email: formData.email,
          password: formData.password,
        });

        if (loginRes && loginRes.data && loginRes.data.token && loginRes.data.user) {
          // Token und Benutzerdaten im LocalStorage speichern
          localStorage.setItem("token", loginRes.data.token);
          localStorage.setItem("user", JSON.stringify(loginRes.data.user));

          // Benutzerzustand aktualisieren
          setUser(loginRes.data.user);

          // Zur Startseite navigieren
          navigate("/");
          console.log("🔑 Automatisch eingeloggt:", loginRes.data.user);
        } else {
          throw new Error("Automatischer Login fehlgeschlagen");
        }
      } else {
        throw new Error("Ungültige Serverantwort");
      }
    } catch (error) {
      console.error("❌ Registrierungs-Fehler:", error);

      if (error.response) {
        console.error("📌 Fehlerdetails:", error.response.data);
      } else {
        console.error("❌ Netzwerkfehler oder Server nicht erreichbar.");
      }
    }
  };

  return (
    <div className="log-reg">
      <div className="log-block">
        <form onSubmit={handleSubmit}>
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
          You have an account? <a href="/login">Login here</a>.
        </p>
      </div>
    </div>
  );
}

export default Register;