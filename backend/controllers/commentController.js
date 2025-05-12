exports.createComment = async (req, res) => {
  const pool = req.app.locals.pool;
  const { teamId, taskId } = req.params;
  const { comment_text } = req.body;
  const userId = req.userId;

  if (!comment_text) {
    return res.status(400).json({ error: "Kommentar darf nicht leer sein" });
  }

  try {
    // 🔍 Prüfe, ob Task zur angegebenen TeamID gehört
    const taskCheck = await pool.query(
      `SELECT id FROM tasks WHERE id = $1 AND team_id = $2`,
      [taskId, teamId]
    );

    if (taskCheck.rows.length === 0) {
      return res.status(403).json({ error: "Task gehört nicht zu diesem Team oder existiert nicht" });
    }

    // ✅ Kommentar speichern
    const result = await pool.query(
      `INSERT INTO task_comments (task_id, user_id, comment_text)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [taskId, userId, comment_text]
    );

    res.json({ message: "Kommentar gespeichert", comment: result.rows[0] });
  } catch (err) {
    console.error("❌ Fehler beim Speichern des Kommentars:", err);
    res.status(500).json({ error: "Fehler beim Speichern des Kommentars" });
  }
};
exports.getCommentsByTask = async (req, res) => {
  const pool = req.app.locals.pool;
  const { teamId, taskId } = req.params;

  try {
    const taskCheck = await pool.query(
      `SELECT id FROM tasks WHERE id = $1 AND team_id = $2`,
      [taskId, teamId]
    );

    if (taskCheck.rows.length === 0) {
      return res.status(403).json({ error: "Task gehört nicht zu diesem Team oder existiert nicht" });
    }

    const result = await pool.query(
      `SELECT c.*, u.name AS author_name
       FROM task_comments c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.task_id = $1
       ORDER BY c.created_at ASC`,
      [taskId]
    );

    res.json({ comments: result.rows });
  } catch (err) {
    console.error("❌ Fehler beim Laden der Kommentare:", err);
    res.status(500).json({ error: "Fehler beim Laden der Kommentare" });
  }
};
exports.updateComment = async (req, res) => {
  const pool = req.app.locals.pool;
  const { teamId, commentId } = req.params;
  const { comment_text } = req.body;
  const userId = req.userId;

  if (!comment_text) {
    return res.status(400).json({ error: "Kommentar darf nicht leer sein" });
  }

  try {
    const check = await pool.query(
      `SELECT c.*
       FROM task_comments c
       JOIN tasks t ON c.task_id = t.id
       WHERE c.id = $1 AND c.user_id = $2 AND t.team_id = $3`,
      [commentId, userId, teamId]
    );

    if (check.rows.length === 0) {
      return res.status(403).json({ error: "Keine Berechtigung oder Kommentar nicht gefunden" });
    }

    const updated = await pool.query(
      `UPDATE task_comments 
       SET comment_text = $1, updated_at = now() 
       WHERE id = $2 
       RETURNING *`,
      [comment_text, commentId]
    );

    res.json({ message: "Kommentar aktualisiert", comment: updated.rows[0] });
  } catch (err) {
    console.error("❌ Fehler beim Aktualisieren des Kommentars:", err);
    res.status(500).json({ error: "Fehler beim Aktualisieren des Kommentars" });
  }
};
exports.deleteComment = async (req, res) => {
  const pool = req.app.locals.pool;
  const { teamId, commentId } = req.params;
  const userId = req.userId;

  try {
    const check = await pool.query(
      `SELECT c.*
       FROM task_comments c
       JOIN tasks t ON c.task_id = t.id
       WHERE c.id = $1 AND c.user_id = $2 AND t.team_id = $3`,
      [commentId, userId, teamId]
    );

    if (check.rows.length === 0) {
      return res.status(403).json({ error: "Keine Berechtigung oder Kommentar nicht gefunden" });
    }

    const deleted = await pool.query(
      `DELETE FROM task_comments WHERE id = $1 RETURNING *`,
      [commentId]
    );

    res.json({ message: "Kommentar gelöscht", deleted: deleted.rows[0] });
  } catch (err) {
    console.error("❌ Fehler beim Löschen des Kommentars:", err);
    res.status(500).json({ error: "Fehler beim Löschen des Kommentars" });
  }
};
