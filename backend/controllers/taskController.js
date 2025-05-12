exports.createTask = async (req, res) => {
    const pool = req.app.locals.pool;
    const { teamId } = req.params;
    const { title, description, assignedTo, deadline ,priority_flag, project_id} = req.body;
    const userId = req.userId;
  
    if (!title) {
      return res.status(400).json({ error: "Titel ist erforderlich" });
    }
  
    try {
      const memberCheck = await pool.query(
        "SELECT * FROM team_members WHERE user_id = $1 AND team_id = $2",
        [userId, teamId]
      );
      if (memberCheck.rows.length === 0) {
        return res.status(403).json({ error: "Du bist kein Mitglied dieses Teams" });
      }
  
      const newTask = await pool.query(
        `INSERT INTO tasks (team_id, title, description, assigned_to, deadline, status,priority_flag, project_id)
         VALUES ($1, $2, $3, $4, $5, 'To Do', $6, $7) RETURNING *`,
        [teamId, title, description, assignedTo || null, deadline || null, priority_flag || null, project_id || null]
      );
  
      res.json({ message: "Task erfolgreich erstellt", task: newTask.rows[0] });
    } catch (err) {
      res.status(500).json({ error: "Interner Serverfehler" });
    }
  };
  
  exports.getTasksByTeam = async (req, res) => {
    const pool = req.app.locals.pool;
    const { teamId } = req.params;
    const { sortBy } = req.query;
  
    const validSortFields = ["created_at", "deadline", "status"];
    const orderBy = validSortFields.includes(sortBy) ? sortBy : "created_at";
  
    try {
      const memberCheck = await pool.query(
        "SELECT * FROM team_members WHERE user_id = $1 AND team_id = $2",
        [req.userId, teamId]
      );
      if (memberCheck.rows.length === 0) {
        return res.status(403).json({ error: "Du bist kein Mitglied dieses Teams" });
      }
  
      const tasks = await pool.query(
        `SELECT t.*, u.name AS assigned_to_name
         FROM tasks t
         LEFT JOIN users u ON t.assigned_to = u.id
         WHERE t.team_id = $1
         ORDER BY ${orderBy} ASC`,
        [teamId]
      );
  
      res.json(tasks.rows);
    } catch (err) {
      res.status(500).json({ error: "Interner Serverfehler" });
    }
  };
  
  exports.getSingleTask = async (req, res) => {
    const pool = req.app.locals.pool;
    const { teamId, taskId } = req.params;
  
    try {
      const memberCheck = await pool.query(
        "SELECT * FROM team_members WHERE user_id = $1 AND team_id = $2",
        [req.userId, teamId]
      );
      if (memberCheck.rows.length === 0) {
        return res.status(403).json({ error: "Du bist kein Mitglied dieses Teams" });
      }
  
      const task = await pool.query(
        "SELECT * FROM tasks WHERE id = $1 AND team_id = $2",
        [taskId, teamId]
      );
  
      if (task.rows.length === 0) {
        return res.status(404).json({ error: "Task nicht gefunden" });
      }
  
      res.json(task.rows[0]);
    } catch (err) {
      res.status(500).json({ error: "Interner Serverfehler" });
    }
  };
  
  exports.updateTask = async (req, res) => {
    const pool = req.app.locals.pool;
    const { teamId, taskId } = req.params;
    const { title, description, status, points, assigned_to,priority_flag, deadline, project_id } = req.body;
    
    const validStatuses = ["To Do", "Planning", "In Progress", "Done", "Archived"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "❌ Ungültiger Status: " + status });
    }
  
    try {
      const taskCheck = await pool.query(
        `SELECT t.id FROM tasks t
         JOIN team_members tm ON t.team_id = tm.team_id
         WHERE t.id = $1 AND t.team_id = $2 AND tm.user_id = $3`,
        [taskId, teamId, req.userId]
      );
  
      if (taskCheck.rows.length === 0) {
        return res.status(403).json({ error: "Keine Berechtigung für diese Task oder falsches Team" });
      }
  
      const updateQuery = `
        UPDATE tasks 
          SET title = $1, 
          description = $2, 
          points = $3,
          status = $4, 
          assigned_to = $5, 
          deadline = $6, 
          priority_flag = $7,
          project_id = $8
        WHERE id = $9 AND team_id = $10
        RETURNING *`;
  
      const updateValues = [
        title,
        description,
        points,
        status,
        assigned_to === "" ? null : assigned_to,
        deadline || null,
        priority_flag,
        project_id === "" ? null : project_id,
        taskId,
        teamId
      ];
  
      console.log("🧾 Query-Parameter:", updateValues);
  
      const updatedTask = await pool.query(updateQuery, updateValues);
  
      res.json({ message: "Task erfolgreich aktualisiert", task: updatedTask.rows[0] });
  
    } catch (err) {
      console.error("❌ Fehler bei updateTask:", err);
      res.status(500).json({ error: "Interner Serverfehler" });
    }
  };
  

  exports.updateTaskStatus = async (req, res) => {
    const pool = req.app.locals.pool;
    const { taskId } = req.params;
    const { status } = req.body;
  
    const validStatuses = ["To Do", "Planning", "In Progress", "Done", "Archiv"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "❌ Ungültiger Status: " + status });
    }
  
    try {
      const taskCheck = await pool.query(
        `SELECT t.id, t.team_id FROM tasks t
         JOIN team_members tm ON t.team_id = tm.team_id
         WHERE t.id = $1 AND tm.user_id = $2`,
        [taskId, req.userId]
      );
  
      if (taskCheck.rows.length === 0) {
        return res.status(403).json({ error: "Keine Berechtigung für diese Task" });
      }
  
      await pool.query(
        "UPDATE tasks SET status = $1 WHERE id = $2",
        [status, taskId]
      );
  
      res.json({ message: "Task-Status erfolgreich geändert", newStatus: status });
    } catch (err) {
      res.status(500).json({ error: "Interner Serverfehler" });
    }
  };
  
  exports.updateTaskPosition = async (req, res) => {
    const pool = req.app.locals.pool;
    const { newStatus, newPosition } = req.body;
    const { taskId } = req.params;
  
    try {
      await pool.query(
        "UPDATE tasks SET status = $1, position = $2 WHERE id = $3",
        [newStatus, newPosition, taskId]
      );
  
      res.json({ message: "Task-Position aktualisiert" });
    } catch (error) {
      res.status(500).json({ error: "Database error" });
    }
  };
  
  exports.getUserTasks = async (req, res) => {
    const pool = req.app.locals.pool;
  const userId = req.userId;

  try {
    // 1. Team-Mitgliedschaften holen
    const teamsRes = await pool.query(
      `SELECT team_id FROM team_members WHERE user_id = $1`,
      [userId]
    );

    const teamIds = teamsRes.rows.map((row) => row.team_id);

    if (teamIds.length === 0) {
      return res.json({ tasks: [] });
    }

    // 2. Tasks abrufen, bei denen der User assigned ist und im Team Mitglied
    const tasksRes = await pool.query(
      `SELECT * FROM tasks
       WHERE assigned_to = $1 AND team_id = ANY($2::int[])`,
      [userId, teamIds]
    );

    res.json({ tasks: tasksRes.rows });
  } catch (err) {
    console.error("❌ Fehler bei getUserTasksAcrossTeams:", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
  };
  