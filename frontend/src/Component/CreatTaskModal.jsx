import axios from "axios";
import React, { useState } from "react";
import { useParams } from "react-router-dom";
import "./StyleComp/Modal.css";

const CreatTaskModal = ({ onClose, onCreate }) => {
  const { teamId } = useParams();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    try {
      const response = await axios.post(
        `http://localhost:5000/teams/${teamId}/tasks`,
        {
          title,
          description,
          deadline,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      // Verwenden Sie onCreate anstelle von onTaskCreated
      onCreate(response.data.task);
      onClose();
    } catch (error) {
      console.error("Fehler beim Erstellen der Task:", error);
    }
  };

  return (
    <div className="modalOverlay">
      <div className="modalContent">
        <h2>Task erstellen</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Titel"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <textarea
            placeholder="Beschreibung"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <input
            type="datetime-local"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
          <button type="submit" className="button">
            Erstellen
          </button>
          <button onClick={onClose} className="button" type="button">
            Schließen
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreatTaskModal;
