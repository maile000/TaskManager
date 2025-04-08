exports.getAvatar = async (req, res) => {
  const pool = req.app.locals.pool;
  const userId = req.userId;

  try {
    const { createAvatar } = await import('@dicebear/core');
    const { bottts, lorelei, pixelArt } = await import('@dicebear/collection');

    const result = await pool.query(
      `SELECT avatar_data FROM users WHERE id = $1`,
      [userId]
    );

    if (!result.rows.length) {
      console.log("❌ Kein Benutzer gefunden für ID:", userId);
      return res.status(404).json({ error: "Benutzer nicht gefunden" });
    }

    let avatar = result.rows[0]?.avatar_data;

    if (!avatar || !avatar.seed || !avatar.style || !avatar.color) {
      console.log("⚠️ Kein vollständiger Avatar vorhanden. Erstelle Default...");
      avatar = {
        seed: `user-${userId}`,
        style: "bottts",
        color: "#ffcc00"
      };

      try {
        await pool.query(
          `UPDATE users SET avatar_data = $1 WHERE id = $2`,
          [JSON.stringify(avatar), userId]
        );
        console.log("✅ Default-Avatar gespeichert für User", userId);
      } catch (updateErr) {
        console.error("❌ Fehler beim Speichern des Default-Avatars:", updateErr);
        return res.status(500).json({ error: "Fehler beim Setzen des Standard-Avatars" });
      }
    }

    const { seed, style, color } = avatar;

    const styles = { bottts, lorelei, pixelArt };
    const selectedStyle = styles[style] || bottts;

    const svg = createAvatar(selectedStyle, {
      seed,
      backgroundColor: [color]
    }).toString();

    res.type('image/svg+xml').send(svg);
  } catch (err) {
    console.error("❌ Avatar-Fehler:", err);
    res.status(500).json({ error: "Fehler beim Generieren des Avatars" });
  }
};



exports.saveAvatar = async (req, res) => {
  const pool = req.app.locals.pool;
  const userId = req.userId;
  const { style, seed, color } = req.body;

  if (!style || !seed || !color) {
    return res.status(400).json({ error: "Fehlende Avatar-Daten" });
  }

  try {
    await pool.query(
      `UPDATE users SET avatar_data = $1 WHERE id = $2`,
      [JSON.stringify({ style, seed, color }), userId]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Fehler beim Speichern des Avatars:", err);
    res.status(500).json({ error: "Serverfehler beim Speichern" });
  }
};

exports.generateAvatar = async (req, res) => {
  try {
    const { createAvatar } = await import('@dicebear/core');
    const { bottts, pixelArt, lorelei } = await import('@dicebear/collection');
    const { seed, style, color } = req.body;

    if (!seed || !style || !color) {
      return res.status(400).json({ error: "Fehlende Daten" });
    }

    const styles = { bottts, pixelArt, lorelei };
    const selectedStyle = styles[style] || bottts;

    const svg = createAvatar(selectedStyle, {
      seed,
      backgroundColor: [color],
    }).toString();

    res.type('image/svg+xml').send(svg);
  } catch (err) {
    console.error("❌ Fehler bei Avatar-Vorschau:", err);
    res.status(500).json({ error: "Fehler beim Generieren" });
  }
};

exports.getAvatarByUserId = async (req, res) => {
  const pool = req.app.locals.pool;
  const userId = req.params.userId;

  try {
    const { createAvatar } = await import('@dicebear/core');
    const { bottts, lorelei, pixelArt } = await import('@dicebear/collection');

    const result = await pool.query(
      `SELECT avatar_data FROM users WHERE id = $1`,
      [userId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Benutzer nicht gefunden" });
    }

    let avatar = result.rows[0]?.avatar_data;

    if (!avatar || !avatar.seed || !avatar.style || !avatar.color) {
      avatar = {
        seed: `user-${userId}`,
        style: "bottts",
        color: "#ffcc00"
      };
    }

    const { seed, style, color } = avatar;
    const styles = { bottts, lorelei, pixelArt };
    const selectedStyle = styles[style] || bottts;

    const svg = createAvatar(selectedStyle, {
      seed,
      backgroundColor: [color]
    }).toString();

    res.type('image/svg+xml').send(svg);
  } catch (err) {
    console.error("Avatar-Fehler:", err);
    res.status(500).json({ error: "Fehler beim Generieren des Avatars" });
  }
};
