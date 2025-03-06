import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import InviteModal from "../Component/InviteModal"; // Modal für den Einladungscode

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
    <div>
      <h1>{team.name}</h1>
      <p>Einladungscode: {team.invite_code}</p>

      <button onClick={() => setIsInviteModalOpen(true)}>Mitglieder hinzufügen</button>

      {/* Modal für den Einladungscode */}
      {isInviteModalOpen && (
        <InviteModal
          inviteCode={team.invite_code}
          onClose={() => setIsInviteModalOpen(false)}
        />
      )}
    </div>
  );
}

export default TeamPage;