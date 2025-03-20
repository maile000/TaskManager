import React, { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import axios from "axios";
import { useParams } from "react-router-dom";
import "./StyleComp/TaskCard.css";

const Modal = ({ isOpen, onClose, task, refreshTaskList }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [status, setStatus] = useState(task.status);
  const [assignedTo, setAssignedTo] = useState(task.assigned_to);
  const { teamId } = useParams();

  if (!isOpen) return null;

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

function TaskCard({ task, refreshTaskList }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: `task-${task.id}`,
  });


  const style = {
    transform: transform ? CSS.Transform.toString(transform) : undefined,
    transition,
    padding: "8px",
    margin: "4px 0",
    backgroundColor: "#0600AB",
    borderRadius: "15px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    cursor: "pointer",
  };

  return (
    <>
      <div ref={setNodeRef} style={style} {...attributes}>
        <div {...listeners} style={{ cursor: "grab", padding: "4px" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" onMouseDown={(event) => event.preventDefault()}>
            <circle cx="6" cy="10" r="1"></circle>
            <circle cx="6" cy="14" r="1"></circle>
            <circle cx="12" cy="10" r="1"></circle>
            <circle cx="12" cy="14" r="1"></circle>
            <circle cx="18" cy="10" r="1"></circle>
            <circle cx="18" cy="14" r="1"></circle>
          </svg>
        </div>

        <div
          onClick={(event) => {
            event.stopPropagation();
            setIsModalOpen(true);
          }}
          style={{ width: "100%", textAlign: "center", padding: "10px" }}
        >
          <strong style={{ color: "#F2E6EE" }}>{task.title}</strong>
        </div>
      </div>

      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          task={task}
          refreshTaskList={refreshTaskList}
        />
      )}
    </>
  );
}

export default TaskCard;
