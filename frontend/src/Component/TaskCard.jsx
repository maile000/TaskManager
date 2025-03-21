import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import "./StyleComp/TaskCard.css";

function TaskCard({ task, onTaskClick , activeTaskId}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: `task-${task.id}`,
  });

  const style = {
    transform: transform ? CSS.Transform.toString(transform) : "none",
    transition: transition || "transform 0.2s ease-in-out",
    opacity: activeTaskId === task.id.toString() ? 0 : 1, 
  };

  return (
    <div ref={setNodeRef} {...attributes}  style={style} className="task-card">
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
