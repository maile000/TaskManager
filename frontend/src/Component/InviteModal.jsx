import React from "react";
import "./StyleComp/Modal.css";

const InviteModal = ({ inviteCode, onClose }) => {
  return (
    <div className="modalOverlay">
      <div className="modalContent">
        <div className="modalClose">      
          <button onClick={onClose} className="close-btn"></button>
        </div>
        <h2>Einladungs-ID</h2>
        <p>Teile diese ID mit deinen Teammitgliedern:</p>
        <p className="inviteCode">{inviteCode}</p>
        <button onClick={onClose} className="button" >Schließen</button>
      </div>
    </div>
  );
};


export default InviteModal;