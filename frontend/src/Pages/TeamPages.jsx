import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import InviteModal from "../Component/InviteModal";
import Sidebar  from "../Component/SideBar";
import "./Style/TeamPages.css";

function TeamPage() {
  const { teamId } = useParams();
  const [team, setTeam] = useState(null);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  // Team-Details laden
  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`http://localhost:5000/teams/${teamId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setTeam(response.data);
      } catch (error) {
        console.error("Fehler beim Laden des Teams:", error);
      }
    };

    fetchTeam();
  }, [teamId]);

  if (!team) {
    return <div>Lade Team...</div>;
  }

  return (
    <div className="teampage">
      <Sidebar/>
      <div className="team-uebersicht-div">
        <h1>{team.name}</h1>
        <div>
          <button className="button" onClick={() => setIsInviteModalOpen(true)}>
            Mitglieder hinzufügen</button>
          {isInviteModalOpen && (
            <InviteModal
              inviteCode={team.invite_code}
              onClose={() => setIsInviteModalOpen(false)}
            />
          )}
        </div>
        <div>
        {team.members && team.members.length > 0 ? (
          <div className="team-members">
            <h2>Teammitglieder</h2>
            <ul>
              {team.members.map((member) => (
                <li key={member.id}>
                  {member.name} - {member.role}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p>Keine Mitglieder gefunden.</p>
        )}
        </div>
      </div>
    </div>
  );
}

export default TeamPage;