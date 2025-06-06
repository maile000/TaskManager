import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./StyleComp/LogReg.css";
import LogReg from "./../Assets/black.jpg";


function Register({ setUser }) {
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post("http://localhost:5000/api/register", formData);

      if (res && res.data) {
        console.log("✅ Erfolgreich registriert:", res.data);
        const loginRes = await axios.post("http://localhost:5000/api/login", {
          email: formData.email,
          password: formData.password,
        });

        if (loginRes && loginRes.data && loginRes.data.token && loginRes.data.user) {
          localStorage.setItem("token", loginRes.data.token);
          localStorage.setItem("user", JSON.stringify(loginRes.data.user));

          setUser(loginRes.data.user);

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