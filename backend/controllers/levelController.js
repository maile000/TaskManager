exports.getLevelProgress = async (req, res) => {
  const pool = req.app.locals.pool;
  const userId = req.userId;

  try {
    // 1) Lese total_points aus users
    const userRes = await pool.query(
      `SELECT total_points
       FROM users
       WHERE id = $1`,
      [userId]
    );
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: "User nicht gefunden" });
    }
    const totalPoints = parseInt(userRes.rows[0].total_points, 10);

    // 2) Ermittle aktuelles Level nach DB-Definition
    const levelRes = await pool.query(
      `SELECT level, points_required
       FROM level_thresholds
       WHERE points_required <= $1
       ORDER BY points_required DESC
       LIMIT 1`,
      [totalPoints]
    );
    // Falls gar kein Level-Threshold passt, nehmen wir Level 1 mit 0 Punkten
    const currThresh = levelRes.rows[0] || { level: 1, points_required: 0 };
    const currentLevel = currThresh.level;
    const startPoints = currThresh.points_required;

    // 3) Ermittle Threshold fürs nächste Level
    const nextRes = await pool.query(
      `SELECT level, points_required
       FROM level_thresholds
       WHERE level = $1`,
      [currentLevel + 1]
    );
    const nextThresh = nextRes.rows[0] || null;
    const endPoints = nextThresh ? nextThresh.points_required : startPoints;

    // 4) Berechne Fortschritt ins nächste Level
    const pointsIntoLevel = totalPoints - startPoints;
    const pointsNeeded = Math.max(endPoints - totalPoints, 0);
    const percent =
      endPoints > startPoints
        ? Math.min((pointsIntoLevel / (endPoints - startPoints)) * 100, 100)
        : 100;

    // 5) Gib alles als JSON zurück
    res.json({
      level: currentLevel,
      totalPoints,
      startPoints,
      endPoints,
      pointsIntoLevel,
      pointsNeeded,
      percent: Math.round(percent),
    });
  } catch (err) {
    console.error("Fehler in getLevelProgress:", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
};
