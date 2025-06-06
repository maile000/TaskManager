import React, { useState } from "react";
import axios from "axios";
import "./StyleComp/Modal.css";

const JoinTeamModal = ({ onClose, onJoin }) => {
  const [inviteCode, setInviteCode] = useState("");

  const handleJoinTeam = async () => {
    try {
      const token = localStorage.getItem("token");
      const userId = JSON.parse(localStorage.getItem("user")).id;

      const response = await axios.post(
        "http://localhost:5000/api/join-team",
        { userId, inviteCode },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Team beigetreten:", response.data);
      onJoin();
    } catch (error) {
      console.error("Fehler beim Beitreten zum Team:", error);
    }
  };

  return (
    <div className="modalOverlay">
      <div className="modalContent">
        <div className="modalClose">      
          <button onClick={onClose} className="close-btn"></button>
        </div>
        <h2>Team beitreten</h2>
        <input
          type="text"
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value)}
          placeholder="Einladungscode eingeben"
          className="input-modal"
        />
        <div className="modal-button-div">       
          <button onClick={handleJoinTeam} className="button">Beitreten</button>
          <button onClick={onClose} className="secondary-button" >Abbrechen</button>
        </div>
      </div>
    </div>
  );
};

export default JoinTeamModal;