exports.createTask = async (req, res) => {
  const pool = req.app.locals.pool;
  const { teamId } = req.params;
  const { title, description, assignedTo, deadline, priority_flag, project_id, status } = req.body;
  const userId = req.userId;

  console.log("🧪 Request empfangen:");
  console.log("Team ID:", teamId);
  console.log("User ID:", userId);
  console.log("Body:", req.body);
  
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
        `INSERT INTO tasks (team_id, title, description, assigned_to, deadline, status, priority_flag, project_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [teamId, title, description, assignedTo || null, deadline || null, status || 'Planning', priority_flag || null, project_id || null]
      );
  
      res.json({ message: "Task erfolgreich erstellt", task: newTask.rows[0] });
      res.status(201).json({ task });
    } catch (err) {
        console.error("Fehler in createTask:", err);
        if (error.name === "SequelizeValidationError") {
          return res.status(400).json({ 
            message: "Validierungsfehler",
            details: error.errors.map(e => e.message) 
          });
        }
      res.status(500).json({ error: "Interner Serverfehler" });
    }
  };
  
  exports.getTasksByTeam = async (req, res) => {
    const pool = req.app.locals.pool;
    const { teamId } = req.params;
    const { sortBy, assignedTo, projectId, priority_flag } = req.query;
  
    const validSortFields = ["created_at", "deadline", "status"];
    const orderBy = validSortFields.includes(sortBy) ? sortBy : "created_at";
    console.log("🔍 getTasksByTeam req.query:", req.query)
    try {
      const memberCheck = await pool.query(
        "SELECT * FROM team_members WHERE user_id = $1 AND team_id = $2",
        [req.userId, teamId]
      );
      if (memberCheck.rows.length === 0) {
        return res.status(403).json({ error: "Du bist kein Mitglied dieses Teams" });
      }
  
      let queryText = `
        SELECT t.*, u.name AS assigned_to_name
        FROM tasks t
        LEFT JOIN users u ON t.assigned_to = u.id
        WHERE t.team_id = $1
      `;
  
      const queryParams = [teamId];
      let paramCounter = 2; // Start bei 2 weil $1 bereits teamId ist
  
      if (assignedTo) {
        if (assignedTo === 'unassigned') {
          queryText += ` AND t.assigned_to IS NULL`;
        } else {
          queryText += ` AND t.assigned_to = $${paramCounter}`;
          queryParams.push(assignedTo);
          paramCounter++;
        }
      }
  
      if (projectId) {
        if (projectId === 'unassigned') {
          queryText += ` AND t.project_id IS NULL`;
        } else {
          queryText += ` AND t.project_id = $${paramCounter}`;
          queryParams.push(projectId);
          paramCounter++;
        }
      }
  
      if (priority_flag) {
        queryText += ` AND t.priority_flag = $${paramCounter}`;
        queryParams.push(priority_flag);
        paramCounter++;
      }
  
      queryText += ` ORDER BY ${orderBy} ASC`;
  
      console.log("Executing query:", queryText);
      console.log("With parameters:", queryParams);
  
      const tasks = await pool.query(queryText, queryParams);
      res.json(tasks.rows);
    } catch (err) {
      console.error("Fehler in getTasksByTeam:", err);
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
  
exports.getTeamProjects = async (req, res) => {
  const pool = req.app.locals.pool;
  const { teamId } = req.params;

  try {
    const projects = await pool.query(
      "SELECT id, name FROM projects WHERE team_id = $1",
      [teamId]
    );
    res.json(projects.rows);
  } catch (err) {
    res.status(500).json({ error: "Interner Serverfehler" });
  }
};

exports.postTeamProject = async (req, res) => {
  const pool = req.app.locals.pool;
  const { teamId } = req.params;
  const { name } = req.body;

  try {
    const newProject = await pool.query(
      "INSERT INTO projects (team_id, name) VALUES ($1, $2) RETURNING *",
      [teamId, name]
    );
    res.json(newProject.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Interner Serverfehler" });
  }
};