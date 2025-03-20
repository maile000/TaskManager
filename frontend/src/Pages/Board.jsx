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

const statuses = [ "Planning","To Do", "In Progress", "Done"];

function Column({ tasks, refreshTaskList }) {
  
  return (
    <div className="column-style">
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} refreshTaskList={refreshTaskList} />
      ))}
    </div>
  );
}

function DraggableColumn({ status, tasks, refreshTaskList }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: status,
  });

  const style = {
    transform: transform ? CSS.Transform.toString(transform) : undefined,
    transition,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    backdropFilter: "blur(12px) saturate(180%)",
    WebkitBackdropFilter: "blur(12px) saturate(180%)",
    borderRadius: "15px",
    flex: 1,
    margin: "8px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    border: "1px solid rgba(255, 255, 255, 0.3)", 
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div {...attributes} {...listeners} 
        style={{ cursor: "grab", fontWeight: "bold", display:"flex", justifyContent:"center", alignItem:"center", fontSize:"24px" }}>
        {status}
      </div>
      <Column status={status} tasks={tasks} refreshTaskList={refreshTaskList} />
    </div>
  );
}

function Board() {
  const { teamId } = useParams();
  const [isCreateTaskOpen, setCreateTaskOpen] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [columnOrder, setColumnOrder] = useState(statuses);
  const userId = JSON.parse(localStorage.getItem("user"))?.id;

  const fetchTasks = async () => {
    if (!teamId) return;

    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`http://localhost:5000/teams/${teamId}/tasks`, {
        params: { userId },
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks(response.data);
      console.log("✅ Geladene Tasks:", response.data);
    } catch (error) {
      console.error("❌ Fehler beim Laden der Tasks:", error);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [teamId]);

  const handleCreateTask = (newTask) => {
    setTasks([...tasks, newTask]);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over) return;

    if (columnOrder.includes(active.id)) {
      if (active.id !== over.id) {
        const oldIndex = columnOrder.indexOf(active.id);
        const newIndex = columnOrder.indexOf(over.id);
        const newOrder = arrayMove(columnOrder, oldIndex, newIndex);
        setColumnOrder(newOrder);

        try {
          const token = localStorage.getItem("token");
          await axios.put(
            `http://localhost:5000/teams/${teamId}/column-order`,
            { columnOrder: newOrder },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          console.log("✅ Spaltenreihenfolge erfolgreich aktualisiert:", newOrder);
        } catch (error) {
          console.error("❌ Fehler beim Speichern der Spaltenreihenfolge:", error);
        }
      }
    } else {
      const activeTaskId = active.id.replace("task-", "");
      const newStatus = over.id;

      console.log("🔄 Task-DnD:", { activeTaskId, newStatus });

      if (!columnOrder.includes(newStatus)) {
        console.error("❌ Fehler: Ungültiger Status", newStatus);
        return;
      }

      const updatedTasks = tasks.map((task) =>
        task.id.toString() === activeTaskId ? { ...task, status: newStatus } : task
      );
      setTasks(updatedTasks);

      try {
        const token = localStorage.getItem("token");
        await axios.put(
          `http://localhost:5000/tasks/${activeTaskId}/status`,
          { status: newStatus },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log("✅ Task-Status erfolgreich aktualisiert:", newStatus);
        fetchTasks();
      } catch (error) {
        console.error("❌ Fehler beim Aktualisieren des Task-Status:", error);
      }
    }
  };

  const tasksByStatus = columnOrder.reduce((acc, status) => {
    acc[status] = tasks.filter((task) => task.status === status);
    return acc;
  }, {});

  console.log("✅ Tasks nach Status gruppiert:", tasksByStatus);

  return (
    <div className="board-background">
      <Sidebar defaultOpen={false} />
      <div>
        <button onClick={() => setCreateTaskOpen(true)} className="button task-btn">
          Task erstellen
        </button>
        {isCreateTaskOpen && (
          <AddTask 
            onClose={() => setCreateTaskOpen(false)} 
            onCreate={handleCreateTask} 
          />
        )}
        <DndContext onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
          <SortableContext items={columnOrder} strategy={horizontalListSortingStrategy}>
            <div className="board-box" style={{ display: "flex" }}>
              {columnOrder.map((status) => (
                <DraggableColumn
                  key={status}
                  status={status}
                  tasks={tasksByStatus[status] || []}
                  refreshTaskList={fetchTasks}
                  className="drag-column"
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
