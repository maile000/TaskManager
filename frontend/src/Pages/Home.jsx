import "./Style/Home.css";
import React, { useState, useEffect } from "react";
import axios from "axios";
import StatusPie from "../Component/StatusPie";
import Level from "../Component/LevelProgress";

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

  const [points, setPoints] = useState({
       total_points: 0,
       points_by_team: []
     });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [streakData, setStreakData] = useState(null);
  const [loadingStreak, setLoadingStreak] = useState(true);
  const [errorStreak, setErrorStreak] = useState(null);

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
      setPoints({
        total_points: response.data.total_points,
        points_by_team: response.data.points_by_team || []
      });
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

  const fetchStreak = async () => {
      try {
        setLoadingStreak(true);
        const token = localStorage.getItem("token");
        const res = await axios.get(
          "http://localhost:5000/api/streak",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setStreakData(res.data);
        setErrorStreak(null);
      } catch (err) {
        console.error("Error fetching streak:", err);
        setErrorStreak("Fehler beim Laden des Streaks");
      } finally {
        setLoadingStreak(false);
      }
  };

  useEffect(() => {
    fetchPoints();
    fetchDeadlines();
    fetchStreak();
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
          <div className="points-div column">
            <div className="total-points">
              <strong>{points.total_points} Punkte</strong> 
            </div>
            <Level/>
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
            {loadingStreak ? (
              <p>Lade Streak …</p>
            ) : errorStreak ? (
              <p className="error">{errorStreak}</p>
            ) : streakData ? (
              <p>
                Dein aktueller Streak: <strong>{streakData.streak.days} Tage</strong>  
              </p>
            ) : null}

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
