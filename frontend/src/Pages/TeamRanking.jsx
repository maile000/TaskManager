import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "./Style/TeamPages.css";
import "./Style/TeamRanking.css";
import Sidebar from "../Component/SideBar";

function TeamPage() {
  const { teamId } = useParams();
  const [team, setTeam] = useState(null);
  const [avatars, setAvatars] = useState({});
  const [memberLevels, setMemberLevels] = useState({});

  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        const token = localStorage.getItem("token");

        const [teamResponse, membersResponse, levelsResponse] = await Promise.all([
          axios.get(`http://localhost:5000/api/teams/${teamId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`http://localhost:5000/api/teams/${teamId}/members`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`http://localhost:5000/api/teams/${teamId}/levels`, {
            headers: { Authorization: `Bearer ${token}` },
          })
        ]);

        // Level-Daten verarbeiten
        const levelsMap = {};
        levelsResponse.data.forEach(item => {
          levelsMap[item.userId] = { 
            level: item.level,
            pointsIntoLevel: item.pointsIntoLevel || 0,
            endPoints: item.endPoints || 0,
            startPoints: item.startPoints || 0,
            percent: item.percent || 0
          };
        });

        // Avatare abrufen
        const avatarFetches = membersResponse.data.map(async (member) => {
          try {
            const res = await fetch(`http://localhost:5000/api/avatar/${member.id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            return { userId: member.id, svg: await res.text() };
          } catch {
            return { userId: member.id, svg: "" };
          }
        });

        const avatarResults = await Promise.all(avatarFetches);
        const avatarMap = {};
        avatarResults.forEach(({ userId, svg }) => {
          avatarMap[userId] = svg;
        });

        setTeam({
          ...teamResponse.data,
          members: membersResponse.data,
        });
        setMemberLevels(levelsMap);
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
    <div className="teamranking">
      <Sidebar defaultOpen={false} />
      <div>
        {team.members && team.members.length > 0 ? (
          <div className="team-members">
            <h1>Team Ranking</h1>
            <div className="podium-list">
              {/* Top 3 Mitglieder */}
              <div className="podium-top3">
                {[...team.members]
                  .sort((a, b) => b.points - a.points)
                  .slice(0, 3)
                  .map((member, index) => (
                    <div key={member.id} className="member-tooltip">
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
                      
                      {/* Tooltip für Hover */}
                      <div className="tooltip-text">
                        <div className="tooltip-level">Level {memberLevels[member.id]?.level || 1}</div>
                      </div>
                    </div>
                  ))}
              </div>

              {/* Restliche Mitglieder */}
              {[...team.members]
                .sort((a, b) => b.points - a.points)
                .slice(3)
                .map((member, index) => (
                  <div key={member.id} className="member-tooltip">
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

                    <div className="tooltip-text">
                      <div className="tooltip-level">Level {memberLevels[member.id]?.level || 1}</div>
                      
                    </div>
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