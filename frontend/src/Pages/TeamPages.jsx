import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import InviteModal from "../Component/InviteModal";
import Sidebar from "../Component/SideBar";
import "./Style/TeamPages.css";
import GlasBackground from "../Assets/glas1.png";

function TeamPage() {
  const { teamId } = useParams();
  const [team, setTeam] = useState(null);
  const [avatars, setAvatars] = useState({});
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [roleChanges, setRoleChanges] = useState({});
  
  const currentUserId = useMemo(() => {
    const token = localStorage.getItem("token");
    if (!token) return null;
  
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map(c => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      const payload = JSON.parse(jsonPayload);
      console.log("🧾 JWT Payload:", payload);
  
      const userId = payload.userId; // ← HIER liegt dein Key
      console.log("✅ Extracted User ID:", userId);
  
      return Number(userId);
    } catch (err) {
      console.error("❌ Fehler beim Dekodieren des Tokens:", err);
      return null;
    }
  }, []);
  
  // Get current user's role in this team
  const currentUserRole = useMemo(() => {
    if (!team || !team.members) return null;
    const currentMember = team.members.find(member => member.id === Number(currentUserId));
    return currentMember?.role;
  }, [team, currentUserId]);

  const isTeamLead = currentUserRole === "Team Lead";

  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        const token = localStorage.getItem("token");

        const [teamResponse, membersResponse] = await Promise.all([
          axios.get(`http://localhost:5000/api/teams/${teamId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`http://localhost:5000/api/teams/${teamId}/members`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setTeam({
          ...teamResponse.data,
          members: membersResponse.data,
        });

        const avatarFetches = membersResponse.data.map(async (member) => {
          try {
            const res = await fetch(`http://localhost:5000/api/avatar/${member.id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const svg = await res.text();
            return { userId: member.id, svg };
          } catch {
            return { userId: member.id, svg: "" };
          }
        });

        const avatarResults = await Promise.all(avatarFetches);
        const avatarMap = {};
        avatarResults.forEach(({ userId, svg }) => {
          avatarMap[userId] = svg;
        });

        setAvatars(avatarMap);
      } catch (error) {
        console.error("Fehler beim Laden des Teams:", error);
      }
    };

    fetchTeamData();
  }, [teamId]);

  if (!team) {
    return <div>Lade Team...</div>;
  }

  console.log("Current User ID:", currentUserId, typeof currentUserId);
  console.log("Team Member IDs:", team.members.map(m => [m.name, m.id, typeof m.id]));
  console.log("Current User Role:", currentUserRole);
  
  
  return (
    <div className="teampage" style={{ backgroundImage: `url(${GlasBackground}) ` }}>
      <Sidebar />
      <div className="column team-uebersicht-div">
        <h1>{team.name}</h1>
       
        {isTeamLead && (
          <div>
            <button className="button" onClick={() => setIsInviteModalOpen(true)}>
              Mitglieder hinzufügen
            </button>
            {isInviteModalOpen && (
              <InviteModal
                inviteCode={team.invite_code}
                onClose={() => setIsInviteModalOpen(false)}
              />
            )}
          </div>
        )}
       
        <div>
          {team.members && team.members.length > 0 ? (
            <div className="team-members">
              <h2>Teammitglieder</h2>
              <div className="teammitglied-list">
                {team.members.map((member) => (
                  <div key={member.id} className="teammitglied-card">
                    <div
                      className="avatar"
                      dangerouslySetInnerHTML={{ __html: avatars[member.id] || "" }}
                      style={{ width: "64px", height: "64px" }}
                    />
                    <div><strong>{member.name}</strong></div>
                    
                    {editMode && member.id !== currentUserId ? (
                      <select
                        className="teammember-select"
                        value={roleChanges[member.id] || member.role}
                        onChange={(e) =>
                          setRoleChanges({ ...roleChanges, [member.id]: e.target.value })
                        }
                      >
                        <option value="Member">Member</option>
                        <option value="Team Lead">Team Lead</option>
                      </select>
                    ) : (
                      <div>{member.role}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p>Keine Mitglieder gefunden.</p>
          )}
        </div>
        
        {isTeamLead && (
          <div>
            <button className="secondary-button" onClick={() => setEditMode(!editMode)}>
              {editMode ? "Abbrechen" : "Rollen bearbeiten"}
            </button>
            {editMode && (
              <button
                className="button"
                onClick={async () => {
                  try {
                    const token = localStorage.getItem("token");
                    await Promise.all(
                      Object.entries(roleChanges).map(([userId, newRole]) =>
                        axios.put(
                          `http://localhost:5000/api/teams/${teamId}/members/${userId}/role`,
                          { newRole },
                          {
                            headers: { Authorization: `Bearer ${token}` },
                          }
                        )
                      )
                    );
                    window.location.reload();
                  } catch (err) {
                    console.error("Fehler beim Speichern:", err);
                    alert("Fehler beim Speichern der Änderungen");
                  }
                }}
              >
                Speichern
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default TeamPage;