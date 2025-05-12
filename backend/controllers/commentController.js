exports.createComment = async (req, res) => {
    const pool = req.app.locals.pool;
    const { taskId } = req.params;
    const { comment_text } = req.body;
    const userId = req.userId;
  
    if (!comment_text) {
      return res.status(400).json({ error: "Kommentar darf nicht leer sein" });
    }
  
    try {
      const result = await pool.query(
        `INSERT INTO task_comments (task_id, user_id, comment_text)
         VALUES ($1, $2, $3) RETURNING *`,
        [taskId, userId, comment_text]
      );
  
      res.json({ message: "Kommentar gespeichert", comment: result.rows[0] });
    } catch (err) {
      res.status(500).json({ error: "Fehler beim Speichern des Kommentars" });
    }
  };
  
  exports.getCommentsByTask = async (req, res) => {
    const pool = req.app.locals.pool;
    const { taskId } = req.params;
  
    try {
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
      res.status(500).json({ error: "Fehler beim Laden der Kommentare" });
    }
  };
  
  exports.updateComment = async (req, res) => {
    const pool = req.app.locals.pool;
    const { commentId } = req.params;
    const { comment_text } = req.body;
    const userId = req.userId;
  
    if (!comment_text) {
      return res.status(400).json({ error: "Kommentar darf nicht leer sein" });
    }
  
    try {
      const check = await pool.query(
        `SELECT * FROM task_comments WHERE id = $1 AND user_id = $2`,
        [commentId, userId]
      );
  
      if (check.rows.length === 0) {
        return res.status(403).json({ error: "Keine Berechtigung diesen Kommentar zu bearbeiten" });
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
      res.status(500).json({ error: "Fehler beim Aktualisieren des Kommentars" });
    }
  };
  
  exports.deleteComment = async (req, res) => {
    const pool = req.app.locals.pool;
    const { commentId } = req.params;
    const userId = req.userId;
  
    try {
      const check = await pool.query(
        `SELECT * FROM task_comments WHERE id = $1 AND user_id = $2`,
        [commentId, userId]
      );
  
      if (check.rows.length === 0) {
        return res.status(403).json({ error: "Keine Berechtigung diesen Kommentar zu löschen" });
      }
  
      const deleted = await pool.query(
        `DELETE FROM task_comments WHERE id = $1 RETURNING *`,
        [commentId]
      );
  
      res.json({ message: "Kommentar gelöscht", deleted: deleted.rows[0] });
    } catch (err) {
      res.status(500).json({ error: "Fehler beim Löschen des Kommentars" });
    }
  };
  