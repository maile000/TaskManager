// Board.jsx
import React, { useState, useEffect } from "react";
import "./Style/Board.css";
import Sidebar from "../Component/SideBar";
import AddTask from "../Component/CreatTaskModal";
import { useParams } from "react-router-dom";
import axios from "axios";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import TaskCard from "../Component/TaskCard";

// Definieren Sie die verfügbaren Status als Ausgangsreihenfolge der Columns.
const statuses = ["To Do", "Planning", "In Progress", "Done"];

// Column-Komponente rendert alle TaskCards für einen bestimmten Status.
function Column({ status, tasks }) {
  const style = {
    padding: "16px",
    minHeight: "300px",
    flex: 1,
    margin: "8px",
    border: "1px dashed #ccc",
  };

  return (
    <div style={style}>
      <h3>{status}</h3>
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} />
      ))}
    </div>
  );
}

// DraggableColumn macht die gesamte Spalte per Drag & Drop verschiebbar.
function DraggableColumn({ status, tasks }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: status, // Die Column-ID entspricht dem Statusnamen.
  });

  const style = {
    transform: transform ? CSS.Transform.toString(transform) : undefined,
    transition,
    flex: 1,
    margin: "8px",
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Column status={status} tasks={tasks} />
    </div>
  );
}

function Board() {
  const { teamId } = useParams();
  const [isCreateTaskOpen, setCreateTaskOpen] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [columnOrder, setColumnOrder] = useState(statuses);
  const userId = JSON.parse(localStorage.getItem("user")).id;

  // Laden der Tasks aus dem Backend.
  useEffect(() => {
    const fetchTask = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`http://localhost:5000/teams/${teamId}/tasks`, {
          params: { userId },
          headers: { Authorization: `Bearer ${token}` },
        });
        setTasks(response.data);
      } catch (error) {
        console.error("Fehler beim Laden der Tasks:", error);
      }
    };
    if (teamId) {
      fetchTask();
    }
  }, [userId, teamId]);

  const handleCreateTask = (newTask) => {
    setTasks([...tasks, newTask]);
  };

  // Unterscheidung im onDragEnd-Handler:
  // - Falls ein Column-Item (Status) gezogen wurde, wird die Reihenfolge der Columns aktualisiert.
  // - Falls eine TaskCard gezogen wurde (ID im Format "task-<id>"), wird der Task-Status geändert.
  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over) return;

    if (columnOrder.includes(active.id)) {
      // Column drag
      if (active.id !== over.id) {
        const oldIndex = columnOrder.indexOf(active.id);
        const newIndex = columnOrder.indexOf(over.id);
        const newOrder = arrayMove(columnOrder, oldIndex, newIndex);
        setColumnOrder(newOrder);
      }
    } else {
      // Task drag (IDs sind im Format "task-<id>")
      const activeTaskId = active.id.replace("task-", "");
      const newStatus = over.id; // Erwartet wird, dass das Ziel die Column-ID (Status) ist.
      if (newStatus && activeTaskId) {
        const updatedTasks = tasks.map((task) => {
          if (task.id.toString() === activeTaskId) {
            return { ...task, status: newStatus };
          }
          return task;
        });
        setTasks(updatedTasks);
        try {
          const token = localStorage.getItem("token");
          await axios.put(
            `http://localhost:5000/tasks/${activeTaskId}/status`,
            { newStatus },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        } catch (error) {
          console.error("Fehler beim Aktualisieren des Task-Status:", error);
        }
      }
    }
  };

  // Gruppieren Sie die Tasks nach Status gemäß der aktuellen Spaltenreihenfolge.
  const tasksByStatus = columnOrder.reduce((acc, status) => {
    acc[status] = tasks.filter((task) => task.status === status);
    return acc;
  }, {});

  return (
    <div className="board-background">
      <Sidebar defaultOpen={false} />
      <div>
        <button onClick={() => setCreateTaskOpen(true)} className="button">
          Task erstellen
        </button>
        {isCreateTaskOpen && (
          <AddTask onClose={() => setCreateTaskOpen(false)} onCreate={handleCreateTask} />
        )}
        <DndContext onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
          <SortableContext items={columnOrder} strategy={horizontalListSortingStrategy}>
            <div className="board-box" style={{ display: "flex" }}>
              {columnOrder.map((status) => (
                <DraggableColumn
                  key={status}
                  status={status}
                  tasks={tasksByStatus[status] || []}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}

export default Board;
