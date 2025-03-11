// TaskCard.jsx
import React, { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function TaskCard({ task }) {
  const [expanded, setExpanded] = useState(false);
  // Verwenden Sie useSortable, um die TaskCard dragbar zu machen.
  // Die ID wird als "task-<id>" gesetzt, um Kollisionen mit Column-IDs zu vermeiden.
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

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {/* Klickbarer Header zum Auf- und Zuklappen */}
      <div onClick={() => setExpanded(!expanded)} style={{ userSelect: "none" }}>
        <strong>{task.title}</strong>
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
