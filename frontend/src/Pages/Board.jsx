import React, { useState, useEffect } from "react";
import "./Style/Board.css";
import Sidebar from "../Component/SideBar";
import AddTask from "../Component/CreatTaskModal";
import { useParams } from "react-router-dom";
import axios from "axios";
import { DndContext, closestCorners, useDroppable, DragOverlay } from "@dnd-kit/core";
import {SortableContext, useSortable, verticalListSortingStrategy} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import TaskCard from "../Component/TaskCard";
import TaskModal from "../Component/TaskModal";

const statuses = ["Planning", "To Do", "In Progress", "Done"];

function Board() {
  const { teamId } = useParams();
  const [isCreateTaskOpen, setCreateTaskOpen] = useState(false);
  const [columns, setColumns] = useState(statuses.map((status) => ({ id: status, title: status, tasks: [] })));
  const [selectedTask, setSelectedTask] = useState(null);
  const userId = JSON.parse(localStorage.getItem("user"))?.id;
  const [activeTask, setActiveTask] = useState(null);
  const [activeTaskId, setActiveTaskId] = useState(null);


  useEffect(() => {
    fetchTasks();
  }, [teamId]);

  const fetchTasks = async () => {
    if (!teamId) return;

    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`http://localhost:5000/teams/${teamId}/tasks`, {
        params: { userId },
        headers: { Authorization: `Bearer ${token}` },
      });

      const groupedTasks = statuses.map((status) => ({
        id: status,
        title: status,
        tasks: response.data.filter((task) => task.status === status),
      }));

      setColumns(groupedTasks);
      console.log("✅ Geladene Tasks:", response.data);
    } catch (error) {
      console.error("❌ Fehler beim Laden der Tasks:", error);
    }
  };

  const handleCreateTask = (newTask) => {
    setColumns((prev) =>
      prev.map((col) => (col.id === newTask.status ? { ...col, tasks: [...col.tasks, newTask] } : col))
    );
  };
  
  const handleDragStart = (event) => {
    const { active } = event;
    const activeId = active.id.replace("task-", "");

    setActiveTaskId(activeId);

    const task = columns.flatMap((col) => col.tasks).find((t) => t.id.toString() === activeId);
    if (task) {
        setActiveTask(task);
    }
};

const handleDragEnd = async (event) => {
  setActiveTaskId(null); // 🔹 Task wieder sichtbar machen
  setActiveTask(null); // 🔹 Overlay entfernen

  const { active, over } = event;
  if (!over) return;

  const activeId = active.id.replace("task-", "");
  let overContainer = over.id;

  // 🔹 Falls `over.id` eine Task ist, die Spalte suchen
  if (overContainer.startsWith("task-")) {
      const taskId = overContainer.replace("task-", "");
      const foundColumn = columns.find((col) => col.tasks.some((task) => task.id.toString() === taskId));
      if (foundColumn) {
          overContainer = foundColumn.id;
      } else {
          console.error("❌ Fehler: Task konnte keiner Spalte zugeordnet werden.");
          return;
      }
  }

  console.log("🔄 Task wird verschoben:", { activeId, neuerStatus: overContainer });

  const oldColumn = columns.find((col) => col.tasks.some((task) => task.id.toString() === activeId));
  if (!oldColumn) return;

  // ✅ Wenn die Task in derselben Spalte bleibt → Zurück animieren
  if (oldColumn.id === overContainer) {
      console.log("🔙 Task bleibt in der gleichen Spalte. Transformiere zurück.");
      return;
  }

  // ✅ Wenn die Task in eine neue Spalte geht → Speichern und bewegen
  setColumns((prev) =>
      prev.map((col) =>
          col.tasks.some((task) => task.id.toString() === activeId)
              ? { ...col, tasks: col.tasks.filter((task) => task.id.toString() !== activeId) }
              : col.id === overContainer
              ? { ...col, tasks: [...col.tasks, { ...prev.flatMap(c => c.tasks).find(t => t.id.toString() === activeId), status: overContainer }] }
              : col
      )
  );

  // ✅ API-Call zum Speichern des neuen Status
  try {
      const token = localStorage.getItem("token");
      console.log(`📡 Sende API-Update für Task ID: ${activeId}, Neuer Status: ${overContainer}`);
      
      await axios.put(
          `http://localhost:5000/tasks/${activeId}/status`,
          { status: overContainer }, 
          { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("✅ Task-Status erfolgreich aktualisiert");
  } catch (error) {
      console.error("❌ Fehler beim Aktualisieren des Task-Status:", error.response ? error.response.data : error);
  }
};

  return (
    <div className="board-background">
      <Sidebar defaultOpen={false} />
      <div>
        <button onClick={() => setCreateTaskOpen(true)} className="button task-btn">
          Task erstellen
        </button>
        {isCreateTaskOpen && (
          <AddTask onClose={() => setCreateTaskOpen(false)} onCreate={handleCreateTask} />
        )}

        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} collisionDetection={closestCorners}>
          <SortableContext items={columns.map((col) => col.id)}>
            <div className="board-box" style={{ display: "flex" }}>
              {columns.map((column) => (
                <Column key={column.id} column={column} onTaskClick={setSelectedTask} />
              ))}
            </div>
          </SortableContext>
          <DragOverlay>
            {activeTask ? <TaskCard task={activeTask} /> : null}
          </DragOverlay>

        </DndContext>
      </div>

      <TaskModal isOpen={!!selectedTask} onClose={() => setSelectedTask(null)} task={selectedTask} refreshTaskList={fetchTasks} />
    </div>
  );
}

function Column({ column, onTaskClick, activeTaskId }) {
  const { setNodeRef } = useDroppable({ id: column.id });
  const { attributes, listeners, setNodeRef: setDragRef, transform, transition } = useSortable({
    id: column.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  return (
    <div ref={setNodeRef} style={style} className="column-div">
      <div ref={setDragRef} {...attributes} {...listeners} className="column-title row">
        <div>{column.title}</div>
        <div>☰ </div>
      </div>
      <SortableContext items={column.tasks.map((item) => `task-${item.id}`)} strategy={verticalListSortingStrategy}>
        {column.tasks.map((task) => (
          <TaskCard key={task.id} task={task} onTaskClick={onTaskClick} activeTaskId={activeTaskId}/>
        ))}
      </SortableContext>
    </div>
  );
}

export default Board;
