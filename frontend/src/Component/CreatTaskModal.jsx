import axios from "axios";
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import "./StyleComp/Modal.css";

const CreatTaskModal = ({ onClose, onCreate }) => {
  const { teamId } = useParams();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [members, setMembers] = useState([]);
  const [priority_flag, setFlag] = useState("Low");
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [newProjectName, setNewProjectName] = useState("");
  const [showNewProjectInput, setShowNewProjectInput] = useState(false);

  // Teammitglieder laden
  useEffect(() => {
    const fetchMembers = async () => {
      const token = localStorage.getItem("token");
      try {
        const response = await axios.get(
          `http://localhost:5000/api/teams/${teamId}/members`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setMembers(response.data);
      } catch (error) {
        console.error("Fehler beim Laden der Mitglieder:", error);
      }
    };
    fetchMembers();
  }, [teamId]);

  // Projekte des Teams laden
  useEffect(() => {
    const fetchProjects = async () => {
      const token = localStorage.getItem("token");
      try {
        const response = await axios.get(
          `http://localhost:5000/api/teams/${teamId}/projects`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setProjects(response.data);
      } catch (error) {
        console.error("Fehler beim Laden der Projekte:", error);
      }
    };
    fetchProjects();
  }, [teamId]);

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return; 
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `http://localhost:5000/api/teams/${teamId}/projects`,
        { name: newProjectName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProjects([...projects, response.data]);
      setSelectedProjectId(response.data.id);
      setNewProjectName("");
      setShowNewProjectInput(false);
    } catch (error) {
      console.error("Fehler beim Erstellen des Projekts:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    if (new Date(deadline) < new Date()) {
      alert("Die Deadline darf nicht in der Vergangenheit liegen!");
      return;
    }

    try {
      const response = await axios.post(
        `http://localhost:5000/api/teams/${teamId}/tasks`,
        {
          title,
          description,
          deadline,
          assignedTo: assignedTo || null,
          priority_flag: priority_flag || "Low",
          project_id: selectedProjectId || null,
          status: "Planning",
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onCreate(response.data.task);
      onClose();
    } catch (error) {
      console.error("Fehler beim Erstellen der Task:", error);
    }
  };

  return (
    <div className="modalOverlay">
      <div className="modalContent">
        <div className="modalClose">
          <button onClick={onClose} className="close-btn"></button>
        </div>
        <div>
          <h2>Task erstellen</h2>
          <form onSubmit={handleSubmit} className="modalForm">
            <input
              type="text"
              placeholder="Titel"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <textarea
              placeholder="Beschreibung"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
            <label>Priorität</label>
            <select
              value={priority_flag}
              onChange={(e) => setFlag(e.target.value)}
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>

            {/* Projekte-Dropdown */}
            <div className="form-group">
              <label>Projekt (optional)</label>
              {projects.length > 0 ? (
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                >
                  <option value="">Kein Projekt</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              ) : (
                <p>Keine Projekte vorhanden.</p>
              )}

              {/* Button für neues Projekt (nur anzeigen, wenn kein Projekt erstellt wird) */}
              {!showNewProjectInput && (
                <button
                  type="button"
                  onClick={() => setShowNewProjectInput(true)}
                  className="button"
                >
                  Neues Projekt erstellen
                </button>
              )}

              {/* Eingabefeld für neues Projekt */}
              {showNewProjectInput && (
                <div className="new-project-input">
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="Projektname"
                    required
                  />
                  <button
                    type="button"
                    onClick={handleCreateProject}
                    className="button"
                  >
                    Hinzufügen
                  </button>
                </div>
              )}
            </div>

            <label>Zuweisen an:</label>
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
            >
              <option value="">Niemand</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
            <button type="submit" className="button">
              Task erstellen
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreatTaskModal;