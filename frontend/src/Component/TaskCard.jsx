import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import "./StyleComp/TaskCard.css";

function TaskCard({ task, onTaskClick , activeTaskId}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: `task-${task.id}`, // Task muss eine eindeutige ID haben
  });

  const style = {
    transform: transform ? CSS.Transform.toString(transform) : "none",
    transition: transition || "transform 0.2s ease-in-out",
    padding: "8px",
    margin: "4px 0",
    backgroundColor: "#0600AB",
    borderRadius: "15px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    cursor: "pointer",
    opacity: activeTaskId === task.id.toString() ? 0 : 1, 
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      {/* 🔹 Drag-Handle (nur hier werden die listeners angewendet) */}
      <div {...listeners} style={{ cursor: "grab", padding: "4px", fontSize: "20px" }}>
        ☰
      </div>

      <div
        onClick={() => onTaskClick && onTaskClick(task)}
        style={{ width: "100%", textAlign: "center", padding: "10px" }}
      >
        <strong style={{ color: "#F2E6EE" }}>{task.title}</strong>
      </div>
    </div>
  );
}

export default TaskCard;
