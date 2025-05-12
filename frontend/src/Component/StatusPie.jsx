import React, { useEffect, useState } from "react";
import axios from "axios";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

const COLORS = ["#36A2EB", "#FF6384", "#FFCE56", "#4BC0C0", "#9966FF", "#E7E9ED"];

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
    <div style={{ width: "100%", maxWidth: 500, margin: "auto" }}>
      <h3>Task-Status-Verteilung</h3>
      {data.length === 0 ? (
        <p>Keine Tasks vorhanden.</p>
      ) : (
        <PieChart width={400} height={300}>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            outerRadius={100}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      )}
    </div>
  );
};

export default StatusPie;
