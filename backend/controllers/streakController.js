exports.getStreak = async (req, res) => {
    const pool = req.app.locals.pool;
    const userId = req.userId;
  
    try {
      // 1) Basis-Daten aus users
      const userResult = await pool.query(
        `SELECT login_streak, streak_started_at, total_points, level
         FROM users
         WHERE id = $1`,
        [userId]
      );
  
      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: "User nicht gefunden" });
      }
      const { login_streak, streak_started_at, total_points, level } = userResult.rows[0];
  
      // 2) Optional: Belohnung für den aktuellen Streak laden
      const rewardResult = await pool.query(
        `SELECT base_points, bonus_multiplier
         FROM streak_rewards
         WHERE streak_days = $1`,
        [login_streak]
      );
      const reward = rewardResult.rows[0] || null;
  
      // 3) Optional: nächstes Level-Threshold ermitteln
      const nextLevelResult = await pool.query(
        `SELECT points_required
         FROM level_thresholds
         WHERE level = $1`,
        [level + 1]
      );
      const nextLevel = nextLevelResult.rows[0] || null;
  
      // 4) Response
      res.json({
        streak: {
          days: login_streak,
          startedAt: streak_started_at,
          reward: reward && {
            basePoints: reward.base_points,
            multiplier: reward.bonus_multiplier
          }
        },
        points: total_points,
        level,
        nextLevel: nextLevel
          ? { level: level + 1, pointsRequired: nextLevel.points_required }
          : null
      });
  
    } catch (err) {
      console.error("Fehler bei getStreak:", err);
      res.status(500).json({ error: "Interner Serverfehler" });
    }
  };
  