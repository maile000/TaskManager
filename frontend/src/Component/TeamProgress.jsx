import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import './StyleComp/TeamProgress.css';

const TeamProgress = ({ refreshTrigger, filters }) => {
  const { teamId } = useParams();
  const [progress, setProgress] = useState({ 
    total: 0, 
    completed: 0, 
    percentage: 0 
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const token = localStorage.getItem('token');
        const params = {
          ...filters
        };

        const response = await axios.get(
          `http://localhost:5000/api/teams/${teamId}/progress`, 
          {
            params,
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        
        setProgress({
          total: response.data.total_tasks,
          completed: response.data.completed_tasks,
          percentage: response.data.progress
        });
      } catch (error) {
        console.error('Error fetching progress:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, [teamId, refreshTrigger, filters]); // Abhängigkeiten hinzufügen

  if (loading) return <div>Loading progress...</div>;

  return (
    <div className="progress-container">
      <div className="progress-header">
        <h3>Team Progress</h3>
        <span>{progress.percentage}%</span>
      </div>
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${progress.percentage}%` }}
        ></div>
      </div>
      <div className="progress-stats">
        {progress.completed} of {progress.total} tasks completed
      </div>
    </div>
  );
};

export default TeamProgress;