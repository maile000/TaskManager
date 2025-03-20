import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "./StyleComp/TaskCard.css";

const TaskModal = ({ isOpen, onClose, task, refreshTaskList }) => {
  // Hooks MÜSSEN immer aufgerufen werden, unabhängig vom isOpen-Status
  const { teamId } = useParams();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("To Do");
  const [assignedTo, setAssignedTo] = useState("");

  // Setzt die Task-Daten, sobald `task` sich ändert
  useEffect(() => {
    if (task) {
      setTitle(task.title || "");
      setDescription(task.description || "");
      setStatus(task.status || "To Do");
      setAssignedTo(task.assigned_to || "");
    }
  }, [task]);

  if (!isOpen || !task) {
    return null; // Return kommt erst nach den Hook-Aufrufen
  }

  const handleSaveChanges = async () => {
    try {
      const token = localStorage.getItem("token");
      const updatedTask = { title, description, status, assigned_to: assignedTo };

      await axios.put(
        `http://localhost:5000/teams/${teamId}/tasks/${task.id}`,
        updatedTask,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("✅ Task erfolgreich aktualisiert!");

      refreshTaskList();
      setIsEditing(false);
      onClose();
    } catch (error) {
      console.error("❌ Fehler beim Aktualisieren der Task:", error);
    }
  };

  return (
    <div className="overlayStyleCard">
      <div className="modalStyleCard">
        <h2>Task</h2>

        <button onClick={() => setIsEditing(!isEditing)} className="editButtonStyleCard">
          ✏️ Bearbeiten
        </button>

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
            <option value="To Do">To Do</option>
            <option value="Planning">Planning</option>
            <option value="In Progress">In Progress</option>
            <option value="Done">Done</option>
            <option value="Archived">Archived</option>
          </select>
        ) : (
          <p>{status}</p>
        )}

        <label><strong>Assigned To:</strong></label>
        {isEditing ? (
          <input type="text" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} />
        ) : (
          <p>{assignedTo}</p>
        )}

        {isEditing && (
          <button onClick={handleSaveChanges} className="saveButtonStyleCard">💾 Speichern</button>
        )}
        
        <button onClick={onClose} className="closedButtonStyleCard">Schließen</button>
      </div>
    </div>
  );
};

export default TaskModal;
