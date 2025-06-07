import React, { useState, useEffect } from 'react';
import AvatarOptionen from "../Component/AvatarOptionen";
import axios from "axios";
import "./Style/Profil.css";

function Profil() {
  const [avatarSvg, setAvatarSvg] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const fetchAvatar = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/avatar', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      if (!response.ok) throw new Error('Avatar konnte nicht geladen werden');
      const svgText = await response.text();
      setAvatarSvg(svgText);
    } catch (err) {
      console.error('❌ Fehler beim Laden des Avatars:', err);
    }
  };
  
  useEffect(() => {
    fetchAvatar();
  }, []);

  const handleAvatarUpdated = () => {
    fetchAvatar();
    setIsEditing(false);
  };
  

  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        const token = localStorage.getItem("token");
  
        const userResponse = await axios.get(`http://localhost:5000/api/getProfile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setUser(userResponse.data);
      } catch (error) {
        console.error("Fehler beim Laden des Users:", error);
      }
    };
  
    fetchTeamData();
  }, []);
  
  return (
    <div className='column profil-page'>
      <h1 className='profil-head'>Mein Profil</h1>
      <div className='row profil-block'>
        <div className='column' style={{alignItem:"center"}}>
          <div dangerouslySetInnerHTML={{ __html: avatarSvg }} style={{width:"100px"}}/>
          <button  onClick={() => setIsEditing(!isEditing)} className='secondary-button'>
              edit
            </button>
             
        </div>
        <div className='profil-info-div'>
            <p>Name:</p>
           {user && <p className='profil-info'>{user.name}</p>}
           <p>E-Mail:</p>
           {user && <p className='profil-info'>{user.email}</p>}
        </div>
        
      </div>
      {isEditing && (
        <div>
          <div style={{display: "flex", justifyContent: "flex-end"}}>
            <button onClick={() => setIsEditing(!isEditing)} 
              className='button' 
              >
                X
            </button>
          </div>
          <AvatarOptionen onAvatarSelected={handleAvatarUpdated} />
        </div>
      )}

  </div>
  );
}

export default Profil;
