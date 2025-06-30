import React, { useState, useEffect, forwardRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "./StyleComp/TaskCard.css";

const TaskModal = forwardRef(({ isOpen, onClose, task, refreshTaskList, openComment , ...props }, ref)  => {
  const { teamId } = useParams();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("To Do");
  const [assignedTo, setAssignedTo] = useState("");
  const [teamMembers, setTeamMembers] = useState([]);
  const [priority_flag, setFlag] = useState("");
  const [deadline, setDeadline] = useState("");
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState("");
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [errorProjects, setErrorProjects] = useState(null);
  const [showNewProjectInput, setShowNewProjectInput] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");

  useEffect(() => {
    if (!isOpen || !task) return;
    setTitle(task.title || "");
    setDescription(task.description || "");
    setStatus(task.status || "To Do");
    setAssignedTo(task.assigned_to || "");
    setFlag(task.priority_flag || "Low");
    setDeadline(task.deadline ? task.deadline.split("T")[0] : "");
    setProjectId(task.project_id ? String(task.project_id) : "");
  }, [isOpen, task]);
  
  useEffect(() => {
    const fetchMembers = async () => {
      if (!teamId) return;
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`http://localhost:5000/api/teams/${teamId}/members`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTeamMembers(response.data);
      } catch (error) {
        console.error("❌ Fehler beim Laden der Teammitglieder:", error);
      }
    };
    fetchMembers();
  }, [teamId]);

  const fetchTeamProjects = async () => {
   setLoadingProjects(true);
     try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
          `http://localhost:5000/api/teams/${teamId}/projects`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setProjects(res.data);
        setErrorProjects(null);
      } catch (err) {
          console.error("Error fetching projects:", err);
          setErrorProjects("Projekte konnten nicht geladen werden");
      } finally {
        setLoadingProjects(false);
      }
  };
  
  useEffect(() => {
    if (isOpen) {
      fetchTeamProjects();
    }
  }, [isOpen, teamId]);
  
  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    try {
      const token = localStorage.getItem("token");
      await axios.post(
           `http://localhost:5000/api/teams/${teamId}/projects`,            { name: newProjectName },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setNewProjectName("");
        setShowNewProjectInput(false);
        fetchTeamProjects();
      } catch (err) {
        console.error("Error creating project:", err);
      }
  };

  const handleSaveChanges = async () => {
      try {
        const token = localStorage.getItem("token");
    
        const updatedTask = {
          title,
          description,
          status,
          assigned_to: assignedTo,
          priority_flag,
          deadline,
          project_id: projectId ? Number(projectId) : null,
        };
    
        await axios.put(
          `http://localhost:5000/api/teams/${teamId}/tasks/${task.id}`,
          updatedTask,
          { headers: { Authorization: `Bearer ${token}` } }
        );
    
        console.log("✅ Task erfolgreich aktualisiert!");
    
        await refreshTaskList();
        
        setIsEditing(false);
        onClose();
      } catch (error) {
        console.error("❌ Fehler beim Aktualisieren der Task:", error);
      }
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        "Soll diese Task wirklich gelöscht werden? Dieser Vorgang kann nicht rückgängig gemacht werden."
      )
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `http://localhost:5000/api/teams/${teamId}/tasks/${task.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("🗑️ Task erfolgreich gelöscht!");
      await refreshTaskList();
      onClose();
    } catch (error) {
      console.error("❌ Fehler beim Löschen der Task:", error);
      alert("Löschen der Task fehlgeschlagen.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="overlayStyleCard" onClick={onClose}>
      <div className="modalStyleCard" onClick={(e) => e.stopPropagation()}>
        <div className="task-head row">
            {isEditing ? (
                <div>
                   <label><strong>Titel:</strong></label>
                  <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
              ) : (
                <h1>{title}</h1>
              )}
            <div className="modalClose">
              <button onClick={() => setIsEditing(!isEditing)} className="button">
              ✏️ Bearbeiten
              </button> 
              <button onClick={onClose} className="close-btn"></button>
            </div>
        </div>
        <div className="task-inhalt">
          <label style={{ width: '100px' }}><strong>Beschreibung:</strong></label>
          {isEditing ? (
            <textarea 
              value={description} 
              onChange={(e) => setDescription(e.target.value)}
              style={{ whiteSpace: 'pre-wrap' }} />
          ) : (
            <p style={{ whiteSpace: 'pre-line' }}>{description}</p>
          )}
          <div className="label-task">
            <label style={{ width: '100px' }}><strong>Status:</strong></label>
          {isEditing ? (
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="Planning">Planning</option>
              <option value="To Do">To Do</option>
              <option value="In Progress">In Progress</option>
              <option value="Done">Done</option>
            </select>
          ) : (
            <p>{status}</p>
          )}
          </div>
          <div className="label-task">
            <label style={{ width: '100px' }}><strong>flag:</strong></label>
            {isEditing ? (
              <select value={priority_flag} onChange={(e) => setFlag(e.target.value)}>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            ) : (
              <div style={{ display: "flex", alignItems: "center" }}>
                <span
                  className={`flag-indicator flag-${priority_flag.toLowerCase()}`}
                  data-flag={priority_flag}
                />
                <span>{priority_flag}</span>
              </div>
            )}
          </div>
          <div className="label-task">
            <label style={{ width: '100px' }}><strong>Assigned To:</strong></label>
            {isEditing ? (
              <select value={assignedTo || ""} onChange={(e) => setAssignedTo(e.target.value)}>
                <option value="">-- Nicht zugewiesen --</option>
                {teamMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            ) : (
              <p>
                {
                  teamMembers.find((m) => m.id === task.assigned_to)?.name
                  || "Nicht zugewiesen"
                }
              </p>
            )}
          </div>
          <div className="label-task">
            <label style={{ width: '100px' }}><strong>Projekt:</strong></label>
            
            {isEditing ? (
          <>
            {loadingProjects ? (
              <p>Lade Projekte…</p>
            ) : errorProjects ? (
              <p className="error">{errorProjects}</p>
            ) : (
              <select
                value={projectId}
                onChange={e => setProjectId(e.target.value)}
              >
                <option value="">-- Kein Projekt --</option>
                {projects.map(proj => (
                  <option key={proj.id} value={String(proj.id)}>
                    {proj.name}
                  </option>
                ))}
              </select>
            )}
            {showNewProjectInput ? (
              <div style={{ marginTop: '8px' }}>
                <input
                  type="text"
                  placeholder="Projektname"
                  value={newProjectName}
                  onChange={e => setNewProjectName(e.target.value)}
                />
                <button onClick={handleCreateProject}>Speichern</button>
                <button onClick={() => setShowNewProjectInput(false)}>
                  Abbrechen
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="secondary-button"
                onClick={() => setShowNewProjectInput(true)}
                style={{ marginLeft: '8px' }}
              >
                + Neues Projekt
              </button>
            )}
          </>
        ) : (
          <p>{task.project_name || "Kein Projekt zugewiesen"}</p>
        )}
            </div>
            <div className="label-task">
              <label style={{ width: '100px' }}><strong>Deadline:</strong></label>
                {isEditing ? (
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                  />
                ) : (
                  <p>{deadline ? new Date(deadline).toLocaleDateString() : "Keine Deadline"}</p>
                )}
              </div>
          <p contentEditable className="label-task">
            <strong style={{ width: '100px' }}> erstellt am:</strong> 
            {new Date(task.created_at).toLocaleString()}
          </p>
          <p className="label-task"> 
            <strong style={{ width: '100px' }}>Punkte:</strong>
            {task.points || 0}
          </p>
        </div>  
        {isEditing ? (
          <div className="modal-button-div">
            <button onClick={handleSaveChanges} className="saveButtonStyleCard">Speichern</button>
            <button
              onClick={handleDelete}
              className="secondary-button">
              Löschen
            </button>
          </div>
        ) : (
           <button className="button" onClick={openComment}>Kommentar</button>
        )}
      </div>
    </div>
  );
});

export default TaskModal;