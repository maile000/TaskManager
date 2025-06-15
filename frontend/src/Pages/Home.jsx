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

  const [deadlines, setDeadlines] = useState({
    overdue: [],
    upcoming: []
  });
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

  // Punkte laden
  const fetchPoints = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "http://localhost:5000/api/user/points",
        { headers: { Authorization: `Bearer ${token}` } }
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

  // Deadlines laden (jetzt mit overdue/upcoming)
  const fetchDeadlines = async () => {
  try {
    setLoadingDeadlines(true);
    const token = localStorage.getItem("token");
    const res = await axios.get(
      "http://localhost:5000/api/user/tasks/deadlines/weekly",
      { 
        headers: { Authorization: `Bearer ${token}` },
        params: { debug: true } // Add this if backend supports it
      }
    );
    
    const grouped = {
      overdue: res.data.deadlines.filter(d => d.status === 'overdue'),
      upcoming: res.data.deadlines.filter(d => d.status === 'upcoming')
    };
    
    setDeadlines(grouped);
    setErrorDeadlines(null);
  } catch (err) {
    console.error("Detailed deadline fetch error:", {
      message: err.message,
      response: err.response?.data, // This contains server error details
      config: err.config
    });
    setErrorDeadlines(err.response?.data?.message || "Fehler beim Laden der Deadlines");
  } finally {
    setLoadingDeadlines(false);
  }
};

  // Streak laden
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

  if (loading) return <div className="loading">Lade Punkte …</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="home-background">
      <div className="home-grid">
        <div className="item item1">
          <StatusPie />
        </div>
        <div className="item item2">
          <div className="points-div column">
            <div className="total-points">
              <strong>{points.total_points} Punkte</strong> 
            </div>
            <Level/>
          </div>
        </div>
        <div className="item item3">
          <div className="deadlines-container">
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
            ) : (
              <>
                {deadlines.overdue.length > 0 && (
                  <div className="deadline-section">
                    <h3 className="deadline-header overdue">Überfällig</h3>
                    <ul className="deadline-list">
                      {deadlines.overdue.map((d) => (
                        <DeadlineItem key={`overdue-${d.team_id}-${d.deadline}`} data={d} />
                      ))}
                    </ul>
                  </div>
                )}

                {deadlines.upcoming.length > 0 && (
                  <div className="deadline-section">
                    <h3 className="deadline-header upcoming">Diese Woche</h3>
                    <ul className="deadline-list">
                      {deadlines.upcoming.map((d) => (
                        <DeadlineItem key={`upcoming-${d.team_id}-${d.deadline}`} data={d} />
                      ))}
                    </ul>
                  </div>
                )}

                {deadlines.overdue.length === 0 && deadlines.upcoming.length === 0 && (
                  <p>Keine Deadlines diese Woche</p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DeadlineItem({ data }) {
  return (
    <li className="item3">
      {new Date(data.deadline).toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })}{" "}
      – {data.task_name} (
      <a
        href={`http://localhost:3000/team/${data.team_id}/dashboard`}
        target="_blank"
        rel="noopener noreferrer"
      >
        {data.team_name}-Board
      </a>
      )
    </li>
  );
}

export default Home;