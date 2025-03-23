import React, { useState, useEffect } from 'react';
import AvatarEditor from '../Component/AvatarEditor';
import AvatarOptionen from "../Component/AvatarOptionen";

function Profil() {
  const [avatarSvg, setAvatarSvg] = useState('');

  useEffect(() => {
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

    fetchAvatar();
  }, []);

  return (
    <div>
      <h2>Mein Profil</h2>
      <AvatarEditor/>
      <AvatarOptionen/>
      <div dangerouslySetInnerHTML={{ __html: avatarSvg }} style={{width:"100px"}}/>
    </div>
  );
}

export default Profil;
