import React, { useState, useEffect } from "react";
import axios from "axios";

export default function LevelProgress() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLevel = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          "http://localhost:5000/api/level",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setData(res.data);
      } catch (err) {
        console.error("Error fetching level:", err);
        setError("Fehler beim Laden");
      } finally {
        setLoading(false);
      }
    };
    fetchLevel();
  }, []);

  if (loading) return <p>Lade Level …</p>;
  if (error)   return <p className="error">{error}</p>;

  const {
    level,
    totalPoints,
    startPoints,
    endPoints,
    pointsNeeded,
    percent,
  } = data;

  return (
    <div className="level-progress">
      <h3>Level {level}</h3>
      <p>
        {totalPoints} / {endPoints} Punkte
      </p>
      <progress value={percent} max={100}></progress>
      <p>Noch {pointsNeeded} Punkte bis Level {level + 1}</p>
    </div>
  );
}
