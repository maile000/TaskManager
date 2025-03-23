import React, { useEffect, useState } from 'react';

function AvatarOptionen() {
  const [avatars, setAvatars] = useState([]);

  const token = localStorage.getItem('token');
  const seeds = ['drache', 'katze', 'avatarX', 'hexer', 'kaktus'];
  const styles = ['bottts', 'pixelArt', 'lorelei'];
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

  const handleSelect = async (avatar) => {
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

    if (res.ok) {
      alert('✅ Avatar gespeichert!');
    } else {
      alert('❌ Fehler beim Speichern');
    }
  };

  return (
    <div>
      <h3>Wähle deinen Avatar</h3>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        {avatars.map((avatar, i) => (
          <div
            key={i}
            onClick={() => handleSelect(avatar)}
            style={{ cursor: 'pointer', border: '1px solid #ccc', padding: '8px' }}
          >
            <div dangerouslySetInnerHTML={{ __html: avatar.svg }} />
            <p style={{ fontSize: '0.8em' }}>{avatar.seed}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AvatarOptionen;
