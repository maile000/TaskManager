import React from "react";

const InviteModal = ({ inviteCode, onClose }) => {
  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modalContent}>
        <h2>Einladungs-ID</h2>
        <p>Teile diese ID mit deinen Teammitgliedern:</p>
        <p style={styles.inviteCode}>{inviteCode}</p>
        <button onClick={onClose}>Schließen</button>
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
  inviteCode: {
    fontWeight: "bold",
    fontSize: "1.2em",
    color: "#007bff",
  },
};

export default InviteModal;