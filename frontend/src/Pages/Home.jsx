import "./Style/Home.css";
import React, { useState, useEffect } from "react";
import axios from "axios";
import StatusPie from "../Component/StatusPie";

function Home() {
  const today = new Date();
  const datumString = today.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const [deadlines, setDeadlines] = useState([]);
  const [loadingDeadlines, setLoadingDeadlines] = useState(true);
  const [errorDeadlines, setErrorDeadlines] = useState(null);

  const [points, setPoints] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPoints = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "http://localhost:5000/api/user/points",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setPoints(response.data);
      setError(null);
    } catch (error) {
      console.error("Error fetching points:", error);
      setError("Fehler beim Laden der Punkte");
    } finally {
      setLoading(false);
    }
  };

  const fetchDeadlines = async () => {
        try {
          setLoadingDeadlines(true);
          const token = localStorage.getItem("token");
        const res = await axios.get(
            "http://localhost:5000/api/user/tasks/deadlines/weekly",
            { headers: { Authorization: `Bearer ${token}` } }
          );
          // Sortierung nach Datum (ISO-Strings direkt vergleichbar)
          const sorted = res.data.deadlines.sort((a, b) =>
            new Date(a.deadline) - new Date(b.deadline)
          );
          setDeadlines(sorted);
          setErrorDeadlines(null);
        } catch (err) {
          console.error("Error fetching deadlines:", err);
          setErrorDeadlines("Fehler beim Laden der Deadlines");
        } finally {
          setLoadingDeadlines(false);
        }
      };

  useEffect(() => {
    fetchPoints();
    fetchDeadlines();
  }, []);

  if (loading) {
    return <div className="loading">Lade Punkte …</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  // Wenn points da ist, kannst du es so rendern:
  return (
    <div className="home-background">
      <div className="home-grid">
        <div className="item item1">
          <StatusPie />
        </div>
        <div className="item item2">
          {/* 1. Gesamtsumme aller Punkte */}
          <div className="points-div">
            <div className="total-points">
              <strong>{points.total_points} Punkte</strong> 
            </div>
          </div>
          

          {/* 2. Breakdown nach Teams */}
          <div className="points-breakdown">
            <h4>Punkte pro Team:</h4>
            {points.points_by_team.length > 0 ? (
              <ul>
                {points.points_by_team.map((entry) => (
                  <li key={entry.team_id}>
                    {entry.team_name}: {entry.task_points} Punkte
                  </li>
                ))}
              </ul>
            ) : (
              <div>Keine erledigten Tasks bisher</div>
            )}
          </div>
        </div>
        <div className="item item3">
          <div
            style={{
              fontSize: "20px",
              fontWeight: "bold",
              textAlign: "center",
              color: "white",
            }}
          >
            <p>heute {datumString}</p>
            {loadingDeadlines ? (
              <p>Lade Deadlines …</p>
            ) : errorDeadlines ? (
              <p className="error">{errorDeadlines}</p>
            ) : deadlines.length === 0 ? (
              <p>diese Woche keine Deadlines</p>
            ) : (
              <ul className="weekly-deadlines">
                {deadlines.map((d) => (
                  <li key={`${d.team_id}-${d.deadline}-${d.task_name}`}>
                    {new Date(d.deadline).toLocaleDateString("de-DE", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    – {d.task_name} (
                    <a
                      href={`http://localhost:3000/team/${d.team_id}/dashboard`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {d.team_name}-Board
                    </a>
                    )
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
