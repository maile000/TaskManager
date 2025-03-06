import React, { useState } from "react";
import axios from "axios";

const CreateTeamModal = ({ onClose, onCreate }) => {
  const [teamName, setTeamName] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const userId = JSON.parse(localStorage.getItem("user")).id; // Benutzer-ID aus dem LocalStorage

      const response = await axios.post(
        "http://localhost:5000/create-team",
        { userId, teamName },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      onCreate(response.data); // Team an die Elternkomponente übergeben
      onClose(); // Modal schließen
    } catch (error) {
      console.error("Fehler beim Erstellen des Teams:", error);
    }
  };

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modalContent}>
        <h2>Team erstellen</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="Teamname"
            required
          />
          <button type="submit">Erstellen</button>
          <button type="button" onClick={onClose}>
            Abbrechen
          </button>
        </form>
      </div>
    </div>
  );
};

const styles = {
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: "20px",
    borderRadius: "8px",
    width: "300px",
  },
};

export default CreateTeamModal;