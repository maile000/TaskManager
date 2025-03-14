import React, { useState, useEffect } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import axios from "axios";
import { useParams } from "react-router-dom";

function TaskCard({ task }) {
  const [expanded, setExpanded] = useState(false);
  const { teamId } = useParams();
  const [taskDetails, setTaskDetails] = useState(task);
  
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: `task-${task.id}`,
  });

  const style = {
    transform: transform ? CSS.Transform.toString(transform) : undefined,
    transition,
    padding: "8px",
    margin: "4px 0",
    backgroundColor: "#fff",
    border: "1px solid #ccc",
    borderRadius: "4px",
    cursor: "grab",
  };

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`http://localhost:5000/teams/${teamId}/tasks`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("Geladene Tasks:", response.data); // Debugging
        setTaskDetails(response.data);
      } catch (error) {
        console.error("Fehler beim Laden der Tasks:", error);
      }
    };
    if (taskDetails) {
      fetchTask();
    }
  }, [taskDetails]);
  

  return (
    <div ref={setNodeRef} style={style} >
     <div {...listeners} {...attributes} style={{ cursor: "grab", padding: "4px" }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="6" cy="10" r="1"></circle>
          <circle cx="6" cy="14" r="1"></circle>
          <circle cx="12" cy="10" r="1"></circle>
          <circle cx="12" cy="14" r="1"></circle>
          <circle cx="18" cy="10" r="1"></circle>
          <circle cx="18" cy="14" r="1"></circle>
        </svg>
      </div>
      <div onClick={() => setExpanded(!expanded)} style={{ userSelect: "none" }}>
        <strong style={{color:"red"}}>{task.title}</strong>
      </div>
      {expanded && (
        <div style={{ marginTop: "8px" }}>
          <p>
            <strong>Beschreibung:</strong> {task.description}
          </p>
          <p>
            <strong>Points:</strong> {task.points}
          </p>
          <p>
            <strong>Zugewiesen an:</strong> {task.assigned_to}
          </p>
          <p>
            <strong>Erstellt am:</strong> {new Date(task.created_at).toLocaleString()}
          </p>
          {task.deadline && (
            <p>
              <strong>Deadline:</strong> {new Date(task.deadline).toLocaleString()}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default TaskCard;
