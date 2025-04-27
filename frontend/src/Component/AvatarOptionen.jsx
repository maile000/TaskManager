import React, { useEffect, useState } from 'react';
import "./StyleComp/AvatarOption.css";

function AvatarOptionen({ onAvatarSelected }) {
  const [avatars, setAvatars] = useState([]);
  const [clickedIndex, setClickedIndex] = useState(null);

  const token = localStorage.getItem('token');
  const seeds = ['Destiny', 'Oliver', 'Riley', 'Brian', 'Sara'];
  const styles = ['bottts'];
  const farben = ['#ffcc00', '#1e90ff', '#ff69b4', '#32cd32', '#ffa500'];

  useEffect(() => {
    const fetchAvatars = async () => {
      const kombis = seeds.slice(0, 5).map((seed, i) => ({
        seed,
        style: styles[i % styles.length],
        color: farben[i % farben.length],
      }));

      const results = await Promise.all(
        kombis.map(async ({ seed, style, color }) => {
          const res = await fetch('http://localhost:5000/api/avatar/generate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ seed, style, color }),
          });

          const svg = await res.text();
          return { seed, style, color, svg };
        })
      );

      setAvatars(results);
    };

    fetchAvatars();
  }, []);

  const handleSelect = async (avatar, index) => {
    setClickedIndex(index);

    const res = await fetch('http://localhost:5000/api/avatar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        seed: avatar.seed,
        style: avatar.style,
        color: avatar.color,
      }),
    });

    if (res.ok && typeof onAvatarSelected === 'function') {
      setTimeout(() => {
        onAvatarSelected();
      }, 600);
    }
  };

  return (
    <div className='avatar-component'>
      <h3>Wähle deinen Avatar</h3>
      <div className='avatar-div'>
        {avatars.map((avatar, i) => (
          <div
            key={i}
            onClick={() => handleSelect(avatar, i)}
            className={`avatar-card ${clickedIndex === i ? "clicked" : ""}`}
          >
            <div
              dangerouslySetInnerHTML={{ __html: avatar.svg }}
              className='avatar-option'
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default AvatarOptionen;
