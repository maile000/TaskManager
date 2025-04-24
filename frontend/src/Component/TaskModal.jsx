import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "./StyleComp/TaskCard.css";

const TaskModal = ({ isOpen, onClose, task, refreshTaskList }) => {
  const { teamId } = useParams();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("To Do");
  const [assignedTo, setAssignedTo] = useState("");
  const [teamMembers, setTeamMembers] = useState([]);
  const [priority_flag, setFlag] = useState("");
  const [deadline, setDeadline] = useState("");


  const pointsByStatus = {
    "Planning": 100,
    "To Do": 200,
    "In Progress": 300,
    "Done": 500,
    "Archived": 0
  };

  useEffect(() => {
    if (task) {
      setTitle(task.title || "");
      setDescription(task.description || "");
      setStatus(task.status || "To Do");
      setAssignedTo(task.assigned_to || "");
      setFlag(task.priority_flag || "Low");
      setDeadline(task.deadline ? task.deadline.split("T")[0] : "");
    }
  }, [task]);

  useEffect(() => {
    if (!teamId) return;
    const fetchMembers = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`http://localhost:5000/api/teams/${teamId}/members`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTeamMembers(response.data);
      } catch (error) {
        console.error("❌ Fehler beim Laden der Teammitglieder:", error);
      }
    };
    fetchMembers();
  }, [teamId]);

  if (!isOpen || !task) {
    return null;
  }

  const handleSaveChanges = async () => {
    try {
      const token = localStorage.getItem("token");

      const updatedTask = {
        title,
        description,
        status,
        assigned_to: assignedTo,
        points: pointsByStatus[status] || 0,
        priority_flag,
        deadline,
      };

      await axios.put(
        `http://localhost:5000/api/teams/${teamId}/tasks/${task.id}`,
        updatedTask,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("✅ Task erfolgreich aktualisiert!");

      await refreshTaskList();
      setIsEditing(false);
      onClose();
    } catch (error) {
      console.error("❌ Fehler beim Aktualisieren der Task:", error);
    }
  };

  return (
    <div className="overlayStyleCard" onClick={onClose}>
      <div className="modalStyleCard" onClick={(e) => e.stopPropagation()}>
        <div className="row task-head">
          <h2>Task</h2>
          <button onClick={() => setIsEditing(!isEditing)} className="button">
            ✏️ Bearbeiten
          </button>
        </div>

        <label><strong>Titel:</strong></label>
        {isEditing ? (
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
        ) : (
          <p>{title}</p>
        )}

        <label><strong>Beschreibung:</strong></label>
        {isEditing ? (
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        ) : (
          <p>{description}</p>
        )}

        <label><strong>Status:</strong></label>
        {isEditing ? (
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="Planning">Planning</option>
            <option value="To Do">To Do</option>
            <option value="In Progress">In Progress</option>
            <option value="Done">Done</option>
            <option value="Archived">Archived</option>
          </select>
        ) : (
          <p>{status}</p>
        )}

        <label><strong>flag:</strong></label>
        {isEditing ? (
          <select value={priority_flag} onChange={(e) => setFlag(e.target.value)}>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
        ) : (
          <div style={{ display: "flex", alignItems: "center" }}>
            <span
              className={`flag-indicator flag-${priority_flag.toLowerCase()}`}
              data-flag={priority_flag}
            />
            <span>{priority_flag}</span>
          </div>
        )}

        <label><strong>Assigned To:</strong></label>
        {isEditing ? (
          <select value={assignedTo || ""} onChange={(e) => setAssignedTo(e.target.value)}>
            <option value="">-- Nicht zugewiesen --</option>
            {teamMembers.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
        ) : (
          <p>
            {
              teamMembers.find((m) => m.id === task.assigned_to)?.name
              || "Nicht zugewiesen"
            }
          </p>
        )}
        <label><strong>Deadline:</strong></label>
          {isEditing ? (
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          ) : (
            <p>{deadline ? new Date(deadline).toLocaleDateString() : "Keine Deadline"}</p>
          )}
        <p><strong>Erstellt am:</strong> {new Date(task.created_at).toLocaleString()}</p>
        <p><strong>Punkte (automatisch):</strong> {pointsByStatus[status]}</p>

        {isEditing && (
          <button onClick={handleSaveChanges} className="saveButtonStyleCard">Speichern</button>
        )}

        <button onClick={onClose} className="button">Schließen</button>
      </div>
    </div>
  );
};

export default TaskModal;
