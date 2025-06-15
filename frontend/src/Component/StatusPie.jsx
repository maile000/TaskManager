import React, { useEffect, useState } from "react";
import axios from "axios";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import "./StyleComp/StatusPie.css";

const COLORS = ["#FFCCF2", "#977DFF", "#0033FF", "#0600AB", "#F2E6EE"];

const StatusPie = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchUserTasks = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5000/api/user/tasks", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const tasks = res.data.tasks || [];
        const counts = {};

        tasks.forEach((task) => {
          const status = task.status || "Unbekannt";
          counts[status] = (counts[status] || 0) + 1;
        });

        const formatted = Object.entries(counts).map(([status, count]) => ({
          name: status,
          value: count,
        }));

        setData(formatted);
      } catch (err) {
        console.error("❌ Fehler beim Laden der Tasks:", err);
      }
    };

    fetchUserTasks();
  }, []);

  return (
    <div className="status-pie" style={{ width: "100%", maxWidth: 500, margin: "auto" }}>
      <h3>Task-Status-Verteilung</h3>
      {data.length === 0 ? (
        <p>Keine Tasks vorhanden.</p>
      ) : (
        <PieChart width={450} height={300} className="piechart">
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            outerRadius={100}
            dataKey="value"
            className="pie"
          >
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend className="legend" />
        </PieChart>
      )}
    </div>
  );
};

export default StatusPie;
