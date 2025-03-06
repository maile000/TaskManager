import React, { useState, useEffect } from "react";
import axios from "axios";
import CreateTeamModal from "../Component/CreatTeamModal";
import TeamList from "../Component/TeamList";
import JoinTeamModal from "../Component/JoinTeamModal"; // Neue Komponente für das Beitreten

function Team() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [teams, setTeams] = useState([]);
  const userId = JSON.parse(localStorage.getItem("user")).id; // Benutzer-ID aus dem LocalStorage

  // Teams laden
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("http://localhost:5000/teams", {
          params: { userId }, 
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
  }, [userId]);

  const handleCreateTeam = (newTeam) => {
    setTeams([...teams, newTeam]); // Neues Team zur Liste hinzufügen
  };

  return (
    <div>
      <h1>Team Management</h1>
      <button onClick={() => setIsCreateModalOpen(true)}>Team erstellen</button>
      <button onClick={() => setIsJoinModalOpen(true)}>Team beitreten</button>

      <TeamList teams={teams} setTeams={setTeams} />

      {isCreateModalOpen && (
        <CreateTeamModal
          onClose={() => setIsCreateModalOpen(false)}
          onCreate={handleCreateTeam}
        />
      )}

      {isJoinModalOpen && (
        <JoinTeamModal
          onClose={() => setIsJoinModalOpen(false)}
          onJoin={() => {
            setIsJoinModalOpen(false);
            
          }}
        />
      )}
    </div>
  );
}

export default Team;