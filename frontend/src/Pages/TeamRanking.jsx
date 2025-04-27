import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "./Style/TeamPages.css";
import "./Style/TeamRanking.css";
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
              <h2>Ranking</h2>
              <div className="podium-list">
                <div className="podium-top3">
                  {[...team.members]
                    .sort((a, b) => b.points - a.points)
                    .slice(0, 3)
                    .map((member, index) => (
                      <div key={member.id}>
                        <div
                          className="podium-item"
                          style={{
                            backgroundColor: 
                              index === 0 ? '#ffd700' :
                              index === 1 ? '#c0c0c0' :
                              index === 2 ? '#cd7f32' :
                              '#f0f0f0',
                            height:
                              index === 0 ? '220px' :
                              index === 1 ? '180px' :
                              index === 2 ? '140px' :
                              'auto'
                          }}
                        >
                          <div
                            className="avatar"
                            dangerouslySetInnerHTML={{ __html: avatars[member.id] || "" }}
                            style={{ width: "64px", height: "64px" }}
                          />
                          <div className="podium-rank">#{index + 1}</div>
                        </div>
                        <div className="podium-name"><strong>{member.name}</strong></div>
                        <div>{member.points} Punkte</div>
                      </div>
                    ))}
                </div>
                  {[...team.members]
                    .sort((a, b) => b.points - a.points)
                    .slice(3)
                    .map((member, index) => (
                      <div key={member.id} >
                        <div className="podium-item-2">
                           <div
                            className="avatar"
                            dangerouslySetInnerHTML={{ __html: avatars[member.id] || "" }}
                            style={{ width: "64px", height: "64px" }}
                          />
                          <div className="podium-rank">#{index + 4}</div> 
                        </div>
                        <div className="podium-name"><strong>{member.name}</strong></div>
                        <div>{member.points} Punkte</div>
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
