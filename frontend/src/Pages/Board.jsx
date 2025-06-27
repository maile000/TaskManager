import React, { useState, useEffect, useRef } from "react";
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
import CommentModal from "../Component/CommentModal";
import TeamProgress from "../Component/TeamProgress";

const statuses = ["Planning", "To Do", "In Progress", "Done"];

function Board() {
  const { teamId } = useParams();
  const [isCreateTaskOpen, setCreateTaskOpen] = useState(false);
  const [columns, setColumns] = useState(statuses.map((status) => ({ id: status, title: status, tasks: [] })));
  const [selectedTask, setSelectedTask] = useState(null);
  const userId = JSON.parse(localStorage.getItem("user"))?.id;
  const [activeTask, setActiveTask] = useState(null);
  const [isCommentOpen, setCommentOpen] = useState(false);
  const taskModalRef = useRef(null);
  const commentModalRef = useRef(null);
  const initialFilters = {
    assignedTo: '',
    projectId: '',
    priority_flag: "",
    sortBy: 'created_at'
  };
  const [filters, setFilters] = useState(initialFilters);
  const [teamMembers, setTeamMembers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const toggle = () => setIsOpen(o => !o);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [projectRefreshTrigger, setProjectRefreshTrigger] = useState(0);

useEffect(() => {
  setPriorities([
    { value: "Low",      label: "Low" },
    { value: "Medium",   label: "Medium" },
    { value: "High",     label: "High" },
    { value: "Critical", label: "Critical" }
  ]);
}, []);


  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
    fetchTasks();
  };

  useEffect(() => {
    if (!teamId) return;
    const loadProjects = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`http://localhost:5000/api/teams/${teamId}/projects`,{ 
          headers: { Authorization: `Bearer ${token}` } 
        });
        setProjects(response.data);
      } catch (err) {
        console.error("Fehler beim Laden der Projekte:", err);
      }
    };
    loadProjects();
  }, [teamId, projectRefreshTrigger]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const isOutsideTask =
        taskModalRef.current && !taskModalRef.current.contains(event.target);
      const isOutsideComment =
        commentModalRef.current && !commentModalRef.current.contains(event.target);
  
      if (isOutsideTask && (!isCommentOpen || isOutsideComment)) {
        setSelectedTask(null);
        setCommentOpen(false);
      }
    };
  
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isCommentOpen]);
  
  
  useEffect(() => {
    fetchTasks();
  }, [teamId, filters]); 

  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`http://localhost:5000/api/teams/${teamId}/members`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTeamMembers(response.data);
      } catch (error) {
        console.error("Fehler beim Laden der Team-Mitglieder:", error);
      }
    };
  
    if (teamId) {
      fetchTeamMembers();
    }
  }, [teamId]);

  useEffect(() => {
    if (!teamId) return;
    const loadProjects = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`http://localhost:5000/api/teams/${teamId}/projects`,{ 
        headers: { Authorization: `Bearer ${token}` } 
      });
      setProjects(response.data);
      } catch (err) {
        console.error("Fehler beim Laden der Projekte:", err);
      }};
      loadProjects();
  }, [teamId]);

  const fetchTasks = async () => {
    if (!teamId) return;
    try {
      const token = localStorage.getItem("token");
      const params = {
        ...filters,
        userId
      };
  
      const response = await axios.get(`http://localhost:5000/api/teams/${teamId}/tasks`, {
        params: { ...filters, userId },
        headers: { Authorization: `Bearer ${token}` },
      });
  
      const groupedTasks = statuses.map((status) => ({
        id: status,
        title: status,
        tasks: response.data.map(task => ({
          ...task,
          project_name: projects.find(p => p.id === task.project_id)?.name || "Kein Projekt"
        })).filter((task) => task.status === status),
      }));
  
      setColumns(groupedTasks);
    } catch (error) {
      console.error("❌ Fehler beim Laden der Tasks:", error);
    }
  };

  const handleCreateTask = (newTask) => {
    setColumns((prev) =>
      prev.map((col) => (col.id === newTask.status ? { ...col, tasks: [...col.tasks, newTask] } : col))
    );
  };

  const handleCloseTaskModal = () => {
    setSelectedTask(null);
    setCommentOpen(false);
  };
  
  const handleCloseCommentModal = () => {
    setCommentOpen(false);
  };
  
  const handleDragStart = (event) => {
    const { active } = event;
    const activeId = active.id.replace("task-", "");
    const task = columns.flatMap((col) => col.tasks).find((t) => t.id.toString() === activeId);
    if (task) {
        setActiveTask(task);
  }
};

const handleDragEnd = async (event) => {
  const { active, over } = event;
  if (!over) return;

  const activeId = active.id.replace("task-", "");
  let overContainer = over.id;

  if (overContainer.startsWith("task-")) {
    const taskId = overContainer.replace("task-", "");
    const foundColumn = columns.find((col) => 
      col.tasks.some((task) => task.id.toString() === taskId)
    );
    overContainer = foundColumn?.id || columns[0].id;
  }

  const oldColumn = columns.find((col) => 
    col.tasks.some((task) => task.id.toString() === activeId)
  );

  if (!oldColumn || oldColumn.id === overContainer) {
    return;
  }

  try {
    const token = localStorage.getItem('token');
    
    // 1. Sende Statusupdate an den Server
    const response = await axios.put(
      `http://localhost:5000/api/tasks/${activeId}/status`,
      { status: overContainer },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const updatedTask = response.data.task;

    // 2. Aktualisiere das lokale State mit dem zurückgegebenen Task (inkl. aktualisierter Punkte)
    setColumns(prev => 
      prev.map(col => {
        if (col.id === oldColumn.id) {
          return { ...col, tasks: col.tasks.filter(t => t.id.toString() !== activeId) };
        }
        if (col.id === overContainer) {
          return { ...col, tasks: [...col.tasks, updatedTask] };
        }
        return col;
      })
    );
    setRefreshTrigger(prev => prev + 1);

    console.log("Task erfolgreich verschoben und Punkte aktualisiert");

  } catch (error) {
    console.error("Fehler beim Aktualisieren des Task-Status:", error);
    fetchTasks();
  }
};

  return (
    <div className="board-background">
      <Sidebar defaultOpen={false} />
      <div>
        <div className="column">
          <div className="row board-div-button">
            <button onClick={() => setCreateTaskOpen(true)} className="button task-btn">
              Task erstellen
            </button>
            {isCreateTaskOpen && (
                <AddTask 
                onClose={() => setCreateTaskOpen(false)} 
                onCreate={handleCreateTask} 
                refreshProjects={() => setProjectRefreshTrigger(prev => prev + 1)}
                />
            )}
              <div className="collapsible-wrapper">
                <button className="toggle-btn" onClick={toggle}>
                  {isOpen ? '◀  close' : '▶ Filter'}
                </button>
                <div className={`collapse-container${isOpen ? " open" : ""}`}>
                  {/* Zugewiesener Benutzer  */}
                  <select 
                    value={filters.assignedTo} 
                    onChange={(e) => handleFilterChange('assignedTo', e.target.value)}
                    className="filter-select"
                  >
                    <option value="">Alle Zuweisungen</option>
                      <option value="unassigned">Nicht zugewiesen</option>
                      {teamMembers.map(member => (
                        <option key={member.user_id || member.id} value={member.user_id || member.id}>
                          {member.name || member.username}
                        </option>
                      ))}
                  </select>

                  {/* Projekt Filter */}
                  <select
                    value={filters.projectId}
                    onChange={(e) => handleFilterChange('projectId', e.target.value)}
                    className="filter-select"
                  >
                    <option value="">Alle Projekte</option>
                    <option value="unassigned">Ohne Projekt</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>

                  {/* Prioritäts Filter */}
                  <select
                    value={filters.priority_flag}
                    onChange={e => handleFilterChange("priority_flag", e.target.value)}
                    className="filter-select"
                  >
                    <option value="">Alle Prioritäten</option>
                      {priorities.map(prio => (
                          <option key={prio.value} value={prio.value}>
                            {prio.label}
                          </option>
                        ))}
                  </select>

                  {/* Zurücksetzen */}
                  <button className="secondary-button reset-btn"
                    onClick={() => setFilters(initialFilters)}>
                      Filter zurücksetzen
                  </button>
                </div>
              </div>
            
            </div>
            <TeamProgress  
            refreshTrigger={refreshTrigger} 
            filters={filters} />
          </div>
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
        <TaskModal 
          key={selectedTask?.id || "new"}  
          ref={taskModalRef}
          isOpen={!!selectedTask} 
          onClose={handleCloseTaskModal}
          task={selectedTask} 
          refreshTaskList={fetchTasks} 
          openComment={() => setCommentOpen(true)} 
        />
        {isCommentOpen && selectedTask && (
          <CommentModal
            ref={commentModalRef}
            taskId={selectedTask.id}
            onClose={handleCloseCommentModal}
          />
        )}

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
      </div>
      <div className="column-body">
         <SortableContext items={column.tasks.map((item) => `task-${item.id}`)} strategy={verticalListSortingStrategy} >
        {column.tasks.map((task) => (
          <TaskCard key={task.id} task={task} onTaskClick={onTaskClick} activeTaskId={activeTaskId}/>
        ))}
      </SortableContext>
      </div>
    </div>
  );
}

export default Board;
