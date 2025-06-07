import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import "./StyleComp/Sidebar.css";

const Sidebar = ({ defaultOpen = true }) => {
  const { teamId } = useParams();
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [teamName, setTeamName] = useState('');
  const [error, setError] = useState(null);

  const toggleSidebar = () => setIsOpen(!isOpen);

  useEffect(() => {
    if (!teamId) return;

    const fetchTeamName = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`http://localhost:5000/api/teams/${teamId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setTeamName(response.data.name);
      } catch (err) {
        setError("Fehler beim Laden des Teamnamens");
      }
    };

    fetchTeamName();
  }, [teamId]);

  return (
    <div className={`sidebar ${isOpen ? "open" : "collapsed"}`}>
      <button className="toggle-button" onClick={toggleSidebar}>
        {isOpen ? "<" : ">"}
      </button>
      
      {isOpen && (
        <div>
          <h3>{teamName}</h3>
          <nav className="sidebar-nav">
            <Link className="sidebar-link" to={`/team/${teamId}/dashboard`}>Board</Link>
            <Link className="sidebar-link" to={`/team/${teamId}/teamranking`}>Ranking</Link>
            <Link className="sidebar-link" to={`/team/${teamId}`}>Team</Link>
          </nav>
        </div>
      )}
      {error && <div className="error">{error}</div>}
    </div>
  );
};

export default Sidebar;
