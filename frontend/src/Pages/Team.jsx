import React, { useState, useEffect } from "react";
import axios from "axios";
import CreateTeamModal from "../Component/CreatTeamModal";
import TeamList from "../Component/TeamList";
import JoinTeamModal from "../Component/JoinTeamModal";
import "./Style/Team.css";
import GlasBackground from "../Assets/glas.jpg";

function Team() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [teams, setTeams] = useState([]);
  const userId = JSON.parse(localStorage.getItem("user")).id;

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("http://localhost:5000/api/teams", {
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
    setTeams([...teams, newTeam]);
  }

  return (
    <div className="team-managment-page" style={{ backgroundImage: `url(${GlasBackground}) ` }}>
      <div style={{margin:"80px"}}>
        <div className="column team-managment-div">
          <h1>Team Management</h1>
          <div className="row">
            <button className="button" onClick={() => setIsCreateModalOpen(true)}>Team erstellen</button>
            <button className="button" onClick={() => setIsJoinModalOpen(true)}>Team beitreten</button>
          </div>
        </div>
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
    </div>
  );
}

export default Team;