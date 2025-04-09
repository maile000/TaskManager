import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import InviteModal from "../Component/InviteModal";
import Sidebar from "../Component/SideBar";
import "./Style/TeamPages.css";

function TeamPage() {
  const { teamId } = useParams();
  const [team, setTeam] = useState(null);
  const [avatars, setAvatars] = useState({});
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [roleChanges, setRoleChanges] = useState({});
  const currentUserId = useMemo(() => JSON.parse(atob(localStorage.getItem("token").split(".")[1])).id, []);


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

  return (
    <div className="teampage">
      <Sidebar />
      <div className="column team-uebersicht-div">
        <h1>{team.name}</h1>
       
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
        <div>
          <button className="button" onClick={() => setEditMode(!editMode)}>
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
                    window.location.reload(); // alternativ: Team-Daten neu laden
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
      </div>
    </div>
  );
}

export default TeamPage;
