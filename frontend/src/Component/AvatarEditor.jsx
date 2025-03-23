import React, { useState } from 'react';

function AvatarEditor() {
  const [seed, setSeed] = useState('mein-avatar');
  const [style, setStyle] = useState('bottts');
  const [color, setColor] = useState('#ffcc00');
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/avatar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ seed, style, color }),
      });

      if (!response.ok) throw new Error('Fehler beim Speichern');
      setSuccess(true);
    } catch (error) {
      console.error('❌ Fehler:', error);
      setSuccess(false);
    }
  };

  return (
    <div>
      <h2>Avatar bearbeiten</h2>

      <label>Seed:</label>
      <input value={seed} onChange={(e) => setSeed(e.target.value)} />

      <label>Stil:</label>
      <select value={style} onChange={(e) => setStyle(e.target.value)}>
        <option value="bottts">Bottts</option>
        <option value="lorelei">Lorelei</option>
        <option value="pixelArt">PixelArt</option>
      </select>

      <label>Farbe:</label>
      <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />

      <button onClick={handleSave}>💾 Speichern</button>

      {success && <p>✅ Avatar gespeichert!</p>}
    </div>
  );
}

export default AvatarEditor;
