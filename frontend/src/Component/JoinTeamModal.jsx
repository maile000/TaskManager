import React, { useState } from "react";
import axios from "axios";

const JoinTeamModal = ({ onClose, onJoin }) => {
  const [inviteCode, setInviteCode] = useState("");

  const handleJoinTeam = async () => {
    try {
      const token = localStorage.getItem("token");
      const userId = JSON.parse(localStorage.getItem("user")).id;

      const response = await axios.post(
        "http://localhost:5000/join-team",
        { userId, inviteCode },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Team beigetreten:", response.data);
      onJoin(); // Schließe das Modal und aktualisiere die Teams
    } catch (error) {
      console.error("Fehler beim Beitreten zum Team:", error);
    }
  };

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modalContent}>
        <h2>Team beitreten</h2>
        <input
          type="text"
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value)}
          placeholder="Einladungscode eingeben"
        />
        <button onClick={handleJoinTeam}>Beitreten</button>
        <button onClick={onClose}>Abbrechen</button>
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
    textAlign: "center",
  },
};

export default JoinTeamModal;