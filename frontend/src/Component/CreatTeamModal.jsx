import React, { useState } from "react";
import axios from "axios";
import "./StyleComp/Modal.css";

const CreateTeamModal = ({ onClose, onCreate }) => {
  const [teamName, setTeamName] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const userId = JSON.parse(localStorage.getItem("user")).id;

      const response = await axios.post(
        "http://localhost:5000/api/create-team",
        { userId, teamName },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      onCreate(response.data);
      onClose();
    } catch (error) {
      console.error("Fehler beim Erstellen des Teams:", error);
    }
  };

  return (
    <div className="modalOverlay">
      <div className="modalContent">
        <div className="modalClose">      
          <button onClick={onClose} className="close-btn"></button>
        </div>
        <h2>Team erstellen</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="Teamname"
            required
            className="input-modal"
          />
          <div className="modal-button-div">
            <button type="submit" className="button">Erstellen</button>
            <button type="button" onClick={onClose} className="secondary-button">
              Abbrechen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTeamModal;