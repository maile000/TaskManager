import "./Style/Home.css";
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import StatusPie from "../Component/StatusPie";

function Home() {
    const today = new Date();
    const datumString = today.toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });

    const [points, setPoints] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchPoints = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/user/points', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPoints(response.data);
            setError(null);
        } catch (error) {
            console.error('Error fetching points:', error);
            setError('Fehler beim Laden der Punkte');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPoints();
        
    }, []);

    if (loading) {
        return <div className="loading">Lade Punkte …</div>;
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

    return (
        <div className="home-background">
            <div className="home-grid">
                <div className="item item1">
                    <StatusPie />
                </div>
                <div className="item item2">
                    <div className="total-points">
                        Gesamt: <strong>{points.total_points}</strong> Punkte
                    </div>
                    <div className="points-breakdown">
                        <div>Aus Tasks: {points.breakdown.task_points} (erledigte Tasks: {points.breakdown.completed_tasks})</div>
                        {points.breakdown.other_points > 0 && (
                            <div>Aus Belohnungen: {points.breakdown.other_points}</div>
                        )}
                    </div>
                </div>
                <div className="item item3">
                    <div style={{ fontSize: "20px", fontWeight: "bold", textAlign: "center", color: "white" }}>
                        {datumString}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Home;