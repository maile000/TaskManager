import axios from "axios";
import React, { useState,useEffect } from "react";
import { useParams } from "react-router-dom";
import "./StyleComp/Modal.css";

const CreatTaskModal = ({ onClose, onCreate }) => {
  const { teamId } = useParams();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [members, setMembers] = useState([]); 
  const [priority_flag, setFlag] = useState("");

  useEffect(() => {
    const fetchMembers = async () => {
      const token = localStorage.getItem("token");
      try {
        const response = await axios.get(`http://localhost:5000/api/teams/${teamId}/members`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMembers(response.data);
      } catch (error) {
        console.error("Fehler beim Laden der Mitglieder:", error);
      }
    };
    fetchMembers();
  }, [teamId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    if (new Date(deadline) < new Date()) {
      alert("Die Deadline darf nicht in der Vergangenheit liegen!");
      return;
    }

    try {
      const response = await axios.post(
        `http://localhost:5000/api/teams/${teamId}/tasks`,
        {
          title,
          description,
          deadline,
          assignedTo: assignedTo || null, 
          priority_flag: "Low" || null,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      onCreate(response.data.task);
      onClose();
    } catch (error) {
      console.error("Fehler beim Erstellen der Task:", error);
    }
  };

  return (
    <div className="modalOverlay">
      <div className="modalContent">
        <div className="modalClose">      
          <button onClick={onClose} className="close-btn"></button>
        </div>
        <div >
          <h2>Task erstellen</h2>
          <form onSubmit={handleSubmit} className="modalForm">
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
             <label>Flag</label>
            <select value={priority_flag} onChange={(e) => setFlag(e.target.value)}>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
            <label>Zuweisen an:</label>
            <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}>
              <option value="">Niemand</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
            <button type="submit" className="button">
              Erstellen
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreatTaskModal;
