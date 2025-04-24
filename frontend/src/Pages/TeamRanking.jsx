import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "./Style/TeamPages.css";
import Sidebar from "../Component/SideBar";

function TeamPage() {
  const { teamId } = useParams();
  const [team, setTeam] = useState(null);
  const [avatars, setAvatars] = useState({});
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
        <Sidebar defaultOpen={false} />
        <div>
        {team.members && team.members.length > 0 ? (
            <div className="team-members">
              <h2>Teammitglieder</h2>
              <div className="teammitglied-list">
              {[...team.members]
                .sort((a, b) => b.points - a.points)
                .map((member, index) => (
                <div key={member.id} className="teammitglied-card">
                  <div
                    className="avatar"
                    dangerouslySetInnerHTML={{ __html: avatars[member.id] || "" }}
                    style={{ width: "64px", height: "64px" }}
                  />
                  <div><strong>{member.name}</strong></div>
                  <div><strong>#{index + 1}</strong> – {member.points} Punkte</div>

                </div>
              ))}
              </div>
            </div>
          ) : (
            <p>Keine Mitglieder gefunden.</p>
          )}
        </div>

    </div>
  );
}

export default TeamPage;
