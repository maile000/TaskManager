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

exports.getTeamLevels = async (req, res) => {
  const pool = req.app.locals.pool;
  const teamId = req.params.teamId;
  const userId = req.userId; // Authentifizierter User

  try {
    // 1) Überprüfen, ob der User Mitglied des Teams ist
    const membershipCheck = await pool.query(
      `SELECT 1 FROM team_members WHERE team_id = $1 AND user_id = $2`,
      [teamId, userId]
    );

    if (membershipCheck.rows.length === 0) {
      return res.status(403).json({ error: "Kein Zugriff auf dieses Team" });
    }

    // 2) Alle Teammitglieder abrufen
    const membersRes = await pool.query(
      `SELECT id, total_points FROM users 
       WHERE id IN (
         SELECT user_id FROM team_members 
         WHERE team_id = $1
       )`,
      [teamId]
    );

    // 3) Level für jedes Mitglied berechnen
    const levelsPromises = membersRes.rows.map(async (member) => {
      const totalPoints = parseInt(member.total_points, 10);
      
      const levelRes = await pool.query(
        `SELECT level, points_required
         FROM level_thresholds
         WHERE points_required <= $1
         ORDER BY points_required DESC
         LIMIT 1`,
        [totalPoints]
      );

      const currThresh = levelRes.rows[0] || { level: 1, points_required: 0 };
      return {
        userId: member.id,
        level: currThresh.level,
        points: totalPoints
      };
    });

    const levels = await Promise.all(levelsPromises);
    
    res.json(levels);
  } catch (err) {
    console.error("Fehler in getTeamLevels:", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
};