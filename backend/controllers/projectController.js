exports.createProject = async (req, res) => {
    const pool = req.app.locals.pool;
    const { teamId } = req.params;
    const { name, description } = req.body;
    const userId = req.userId;
  
    if (!name) {
      return res.status(400).json({ error: "Projektname ist erforderlich" });
    }
  
    try {
      const membership = await pool.query(
        `SELECT * FROM team_members WHERE user_id = $1 AND team_id = $2`,
        [userId, teamId]
      );
  
      if (membership.rows.length === 0) {
        return res.status(403).json({ error: "Du bist kein Mitglied dieses Teams" });
      }
  
      const newProject = await pool.query(
        `INSERT INTO projects (team_id, name, description)
         VALUES ($1, $2, $3) RETURNING *`,
        [teamId, name, description || null]
      );
  
      res.status(201).json({ message: "Projekt erfolgreich erstellt", project: newProject.rows[0] });
    } catch (err) {
      console.error("Fehler bei createProject:", err);
      res.status(500).json({ error: "Interner Serverfehler" });
    }
  };
  
  exports.updateProject = async (req, res) => {
    const pool = req.app.locals.pool;
    const { teamId, projectId } = req.params;
    const { name, description } = req.body;
    const userId = req.userId;
  
    try {
      const membership = await pool.query(
        `SELECT * FROM team_members WHERE user_id = $1 AND team_id = $2`,
        [userId, teamId]
      );
  
      if (membership.rows.length === 0) {
        return res.status(403).json({ error: "Du bist kein Mitglied dieses Teams" });
      }
  
      const result = await pool.query(
        `UPDATE projects
         SET name = $1, description = $2
         WHERE id = $3 AND team_id = $4
         RETURNING *`,
        [name, description || null, projectId, teamId]
      );
  
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Projekt nicht gefunden oder kein Zugriff" });
      }
  
      res.json({ message: "Projekt aktualisiert", project: result.rows[0] });
    } catch (err) {
      console.error("Fehler bei updateProject:", err);
      res.status(500).json({ error: "Interner Serverfehler" });
    }
  };
  
  exports.deleteProject = async (req, res) => {
    const pool = req.app.locals.pool;
    const { teamId, projectId } = req.params;
    const userId = req.userId;
  
    try {
      const member = await pool.query(
        `SELECT role FROM team_members WHERE user_id = $1 AND team_id = $2`,
        [userId, teamId]
      );
  
      if (member.rows.length === 0) {
        return res.status(403).json({ error: "Du bist kein Mitglied dieses Teams" });
      }
  
      if (member.rows[0].role !== "Team Lead") {
        return res.status(403).json({ error: "Nur Team Leads dürfen Projekte löschen" });
      }
  
      const result = await pool.query(
        `DELETE FROM projects WHERE id = $1 AND team_id = $2 RETURNING *`,
        [projectId, teamId]
      );
  
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Projekt nicht gefunden oder falsches Team" });
      }
  
      res.json({ message: "Projekt gelöscht", deleted: result.rows[0] });
    } catch (err) {
      console.error("Fehler bei deleteProject:", err);
      res.status(500).json({ error: "Interner Serverfehler" });
    }
  };
  