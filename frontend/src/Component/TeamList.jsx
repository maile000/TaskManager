import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import CreateTeamModal from "../Component/CreatTeamModal";

const TeamList = ({ teams, setTeams }) => {
  const navigate = useNavigate();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
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
  }, [setTeams, userId]);

  const handleCreateTeam = (newTeam) => {
    setTeams([...teams, newTeam]);
  };

  return (
    <div>
      <h1 style={{fontSize:"xxx-large", fontWeight:"bolder", textAlign:"center", color:"#F2E6EE"}}>Meine Teams</h1>
      <div className="teams-div">
        {teams.map((team) => (
          <div>
            <div key={team.id} >
              <button className="teams-block" onClick={() => navigate(`/team/${team.id}`)}>
                {team.name}
              </button>
            </div>
            
          </div>
        ))}
        <button className="teams-block" onClick={() => setIsCreateModalOpen(true)}>+</button>
        {isCreateModalOpen && (
          <CreateTeamModal
            onClose={() => setIsCreateModalOpen(false)}
            onCreate={handleCreateTeam}
          />
        )}

      </div>
    </div>
  );
};

export default TeamList;
