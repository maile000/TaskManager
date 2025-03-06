import React, { useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom"; // Für die Links zu den Team-Routen

const TeamList = ({ teams, setTeams }) => {
  // teams und setTeams werden als Props übergeben, um die Liste zu aktualisieren

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("http://localhost:5000/teams", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setTeams(response.data); 
      } catch (error) {
        console.error("Fehler beim Laden der Teams:", error);
      }
    };

    fetchTeams();
  }, [setTeams]); 

  return (
    <div>
      <h2>Meine Teams</h2>
      <ul>
        {teams.map((team) => (
          <li key={team.id}>
            <Link to={`/team/${team.id}`}>{team.name}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TeamList;