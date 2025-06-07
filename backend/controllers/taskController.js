// 1. Zuordnung von Status → Punkte
const pointsByStatus = {
  "Planning":     10,
  "To Do":        200,
  "In Progress":  300,
  "Done":         500,
  "Archived":       0
};

// 2. Zuordnung von Priority Flag → Punkte
const pointsByFlag = {
  "Low":       10,
  "Medium":    30,
  "High":      50,
  "Critical": 100
};

/**
 * createTask
 * Erstellt einen neuen Task in einem Team. Punkte werden aus status + priority_flag berechnet.
 * Schreibt anschließend in team_points (überschreibt immer den Wert).
 */
exports.createTask = async (req, res) => {
  const pool = req.app.locals.pool;
  const { teamId } = req.params;
  // Felder aus dem Body
  const { title, description, assignedTo, deadline, priority_flag, project_id, status } = req.body;
  const userId = req.userId;

  if (!title) {
    return res.status(400).json({ error: "Titel ist erforderlich" });
  }

  try {
    // 1. Prüfen, ob der eingeloggte User Mitglied im Team ist
    const memberCheck = await pool.query(
      "SELECT 1 FROM team_members WHERE user_id = $1 AND team_id = $2",
      [userId, teamId]
    );
    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: "Du bist kein Mitglied dieses Teams" });
    }

    // 2. Punkte berechnen (Status + Priority Flag)
    const statusPoints = pointsByStatus[status]      || 0;
    const flagPoints   = pointsByFlag[priority_flag] || 0;
    const totalPoints  = statusPoints + flagPoints;

    // 3. Task in der Tabelle `tasks` anlegen, inkl. berechneter Punkte
    const newTask = await pool.query(
      `INSERT INTO tasks 
         (team_id, title, description, assigned_to, deadline, status, priority_flag, points, project_id)
       VALUES
         ($1,       $2,    $3,         $4,         $5,      $6,          $7,         $8,     $9)
       RETURNING *`,
      [
        teamId,
        title,
        description,
        assignedTo || null,
        deadline || null,
        status || "Planning",
        priority_flag || null,
        totalPoints,
        project_id || null
      ]
    );
    const createdTask = newTask.rows[0];

    // 4. In `team_points` den aktuellen Stand auf `totalPoints` setzen (überschreiben)
    //    Achtung: VORHER muss in der Datenbank ein UNIQUE(user_id, team_id) existieren!
    if (assignedTo) {
      await pool.query(
        `INSERT INTO team_points (user_id, team_id, points_in_team)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, team_id)
         DO UPDATE SET points_in_team = EXCLUDED.points_in_team`,
        [assignedTo, teamId, totalPoints]
      );
    }

    return res.status(201).json({
      message: "Task erfolgreich erstellt",
      task: createdTask
    });
  } catch (err) {
    console.error("Fehler in createTask:", err);
    return res.status(500).json({ error: "Interner Serverfehler" });
  }
};

// controllers/taskController.js

/**
 * deleteTask
 * Löscht eine Task innerhalb eines Teams, wenn der eingeloggte User Mitglied des Teams ist.
 */
exports.deleteTask = async (req, res) => {
  const pool = req.app.locals.pool;
  const { teamId, taskId } = req.params;
  const userId = req.userId;

  try {
    // 1. Prüfen, ob der eingeloggte User Mitglied im Team ist
    const memberCheck = await pool.query(
      "SELECT 1 FROM team_members WHERE user_id = $1 AND team_id = $2",
      [userId, teamId]
    );
    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: "Du bist kein Mitglied dieses Teams" });
    }

    // 2. Prüfen, ob die Task überhaupt in diesem Team existiert
    const taskRes = await pool.query(
      "SELECT id FROM tasks WHERE id = $1 AND team_id = $2",
      [taskId, teamId]
    );
    if (taskRes.rows.length === 0) {
      return res.status(404).json({ error: "Task nicht gefunden" });
    }

    // 3. Task löschen
    await pool.query(
      "DELETE FROM tasks WHERE id = $1",
      [taskId]
    );

    // 4. Optional: Falls du team_points oder andere Zusammenhänge aktualisieren möchtest,
    //    kannst du hier weitere Queries einbauen (z. B. Punktabzug).
    //    Ist nicht zwingend nötig, wenn du das in einem separaten Cron‐Job o. Ä. machst.

    return res.json({ message: "Task erfolgreich gelöscht" });
  } catch (err) {
    console.error("Fehler in deleteTask:", err);
    return res.status(500).json({ error: "Interner Serverfehler" });
  }
};

/**
 * getTasksByTeam
 * Liefert alle Tasks eines Teams zurück (inkl. Punkte) – mit optionalen Filtern und Sortierung.
 */
exports.getTasksByTeam = async (req, res) => {
  const pool = req.app.locals.pool;
  const { teamId } = req.params;
  const { sortBy, assignedTo, projectId, priority_flag } = req.query;

  // Nur bestimmte Felder zum Sortieren erlauben
  const validSortFields = ["created_at", "deadline", "status"];
  const orderBy = validSortFields.includes(sortBy) ? sortBy : "created_at";

  try {
    // A. Prüfen, ob der eingeloggte User Mitglied im Team ist
    const memberCheck = await pool.query(
      "SELECT 1 FROM team_members WHERE user_id = $1 AND team_id = $2",
      [req.userId, teamId]
    );
    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: "Du bist kein Mitglied dieses Teams" });
    }

    // B. Basis-Query bauen (wir holen bewusst t.* um auch `points` mitzunehmen)
    let queryText = `
      SELECT t.*, u.name AS assigned_to_name
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.team_id = $1
    `;
    const queryParams = [teamId];
    let paramCounter = 2;

    // Optionale Filter:
    // B1. assignedTo
    if (assignedTo) {
      if (assignedTo === "unassigned") {
        queryText += ` AND t.assigned_to IS NULL`;
      } else {
        queryText += ` AND t.assigned_to = $${paramCounter}`;
        queryParams.push(assignedTo);
        paramCounter++;
      }
    }
    // B2. projectId
    if (projectId) {
      if (projectId === "unassigned") {
        queryText += ` AND t.project_id IS NULL`;
      } else {
        queryText += ` AND t.project_id = $${paramCounter}`;
        queryParams.push(projectId);
        paramCounter++;
      }
    }
    // B3. priority_flag
    if (priority_flag) {
      queryText += ` AND t.priority_flag = $${paramCounter}`;
      queryParams.push(priority_flag);
      paramCounter++;
    }

    // C. Sortierung anhängen
    queryText += ` ORDER BY ${orderBy} ASC`;

    // D. Query ausführen
    const tasksRes = await pool.query(queryText, queryParams);
    return res.json(tasksRes.rows);
  } catch (err) {
    console.error("Fehler in getTasksByTeam:", err);
    return res.status(500).json({ error: "Interner Serverfehler" });
  }
};

/**
 * getSingleTask
 * Holt eine einzelne Task innerhalb eines Teams (inkl. Punkte).
 */
exports.getSingleTask = async (req, res) => {
  const pool = req.app.locals.pool;
  const { teamId, taskId } = req.params;

  try {
    // A. Prüfen, ob der eingeloggte User Mitglied im Team ist
    const memberCheck = await pool.query(
      "SELECT 1 FROM team_members WHERE user_id = $1 AND team_id = $2",
      [req.userId, teamId]
    );
    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: "Du bist kein Mitglied dieses Teams" });
    }

    // B. Task abrufen (inkl. points-Spalte)
    const taskRes = await pool.query(
      "SELECT * FROM tasks WHERE id = $1 AND team_id = $2",
      [taskId, teamId]
    );
    if (taskRes.rows.length === 0) {
      return res.status(404).json({ error: "Task nicht gefunden" });
    }

    return res.json(taskRes.rows[0]);
  } catch (err) {
    console.error("Fehler in getSingleTask:", err);
    return res.status(500).json({ error: "Interner Serverfehler" });
  }
};

/**
 * updateTask
 * Aktualisiert eine bestehende Task (inkl. Neuberechnung der Punkte).
 * - Berechnet bei JEDEM Update (egal welcher Status) neu: points = pointsByStatus + pointsByFlag
 * - Überschreibt in team_points (statt addieren), damit der aktuelle Wert immer genau passt
 */
exports.updateTask = async (req, res) => {
  const pool = req.app.locals.pool;
  const { teamId, taskId } = req.params;
  const {
    title,
    description,
    status,
    assigned_to,
    priority_flag,
    deadline,
    project_id
  } = req.body;

  // 1. Validierung: Nur erlaubte Status-Werte
  const validStatuses = ["To Do", "Planning", "In Progress", "Done", "Archived"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: "Ungültiger Status: " + status });
  }

  try {
    // 2. Prüfen, ob eingeloggter User Mitglied im Team ist und Zugriff auf diese Task hat
    const taskCheck = await pool.query(
      `SELECT t.id
         FROM tasks t
         JOIN team_members tm ON t.team_id = tm.team_id
        WHERE t.id = $1
          AND t.team_id = $2
          AND tm.user_id = $3`,
      [taskId, teamId, req.userId]
    );
    if (taskCheck.rows.length === 0) {
      return res.status(403).json({ error: "Keine Berechtigung oder falsches Team" });
    }

    // 3. Neue Punkte berechnen (immer, unabhängig vom aktuellen Status)
    const statusPoints = pointsByStatus[status]      || 0;
    const flagPoints   = pointsByFlag[priority_flag] || 0;
    const newPoints    = statusPoints + flagPoints;

    // 4. Task in der Tabelle `tasks` updaten (inkl. neuer Punkte)
    const updateQuery = `
      UPDATE tasks
         SET title         = $1,
             description   = $2,
             points        = $3,
             status        = $4,
             assigned_to   = $5,
             priority_flag = $6,
             deadline      = $7,
             project_id    = $8
       WHERE id = $9
         AND team_id = $10
       RETURNING *`;
    const updateValues = [
      title,
      description,
      newPoints,
      status,
      assigned_to === "" ? null : assigned_to,
      priority_flag || null,
      deadline || null,
      project_id === "" ? null : project_id,
      taskId,
      teamId
    ];
    const updatedRes = await pool.query(updateQuery, updateValues);
    const updatedTask = updatedRes.rows[0];

    // 5. team_points immer überschreiben (nicht addieren), damit der aktuelle Stand passt
    if (assigned_to) {
      await pool.query(
        `INSERT INTO team_points (user_id, team_id, points_in_team)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, team_id)
         DO UPDATE SET points_in_team = EXCLUDED.points_in_team`,
        [assigned_to, teamId, newPoints]
      );
    }

    return res.json({
      message: "Task erfolgreich aktualisiert",
      task: updatedTask
    });
  } catch (err) {
    console.error("Fehler bei updateTask:", err);
    return res.status(500).json({ error: "Interner Serverfehler" });
  }
};

exports.updateTaskStatus = async (req, res) => {
  const pool = req.app.locals.pool;
  const { taskId } = req.params;
  const { status } = req.body;

  const validStatuses = ["To Do", "Planning", "In Progress", "Done", "Archived"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: "Ungültiger Status: " + status });
  }

  try {
    // 1. Alte Task-Daten abfragen, um team_id, assigned_to und alte priority_flag zu bekommen
    const taskRes = await pool.query(
      "SELECT team_id, assigned_to, priority_flag FROM tasks WHERE id = $1",
      [taskId]
    );
    if (taskRes.rows.length === 0) {
      return res.status(404).json({ error: "Task nicht gefunden" });
    }
    const { team_id: teamId, assigned_to: assignedTo, priority_flag: oldFlag } = taskRes.rows[0];

    // 2. Prüfen, ob der eingeloggte User Mitglied im Team ist
    const memberCheck = await pool.query(
      "SELECT 1 FROM team_members WHERE user_id = $1 AND team_id = $2",
      [req.userId, teamId]
    );
    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: "Du bist kein Mitglied dieses Teams" });
    }

    // 3. Neue Punkte berechnen (immer, unabhängig vom neuen Status)
    //    Wir verwenden die alte priority_flag (oldFlag)
    const statusPoints = pointsByStatus[status] || 0;
    const flagPoints   = pointsByFlag[oldFlag]   || 0;
    const newPoints    = statusPoints + flagPoints;

    // 4. Task-Status und Punkte in `tasks` updaten
    await pool.query(
      `UPDATE tasks
          SET status = $1,
              points = $2
        WHERE id = $3`,
      [status, newPoints, taskId]
    );

    // 5. team_points immer überschreiben mit newPoints, wenn assignedTo existiert
    if (assignedTo) {
      await pool.query(
        `INSERT INTO team_points (user_id, team_id, points_in_team)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, team_id)
         DO UPDATE SET points_in_team = EXCLUDED.points_in_team`,
        [assignedTo, teamId, newPoints]
      );
    }

    // 6. Geänderte Task wieder abrufen und zurückgeben (inkl. aktualisiertem points-Wert)
    const updatedTask = await pool.query(
      "SELECT * FROM tasks WHERE id = $1",
      [taskId]
    );
    return res.json({
      message: "Task-Status erfolgreich aktualisiert",
      task: updatedTask.rows[0]
    });
  } catch (err) {
    console.error("Fehler in updateTaskStatus:", err);
    return res.status(500).json({ error: "Interner Serverfehler" });
  }
};

/**
 * updateTaskPosition
 * Aktualisiert nur Status und Position einer Task (z. B. Drag & Drop).
 * Punkte werden dabei NICHT neu berechnet.
 */
exports.updateTaskPosition = async (req, res) => {
  const pool = req.app.locals.pool;
  const { taskId } = req.params;
  const { newStatus, newPosition } = req.body;

  try {
    await pool.query(
      "UPDATE tasks SET status = $1, position = $2 WHERE id = $3",
      [newStatus, newPosition, taskId]
    );
    return res.json({ message: "Task-Position aktualisiert" });
  } catch (err) {
    console.error("Fehler in updateTaskPosition:", err);
    return res.status(500).json({ error: "Interner Serverfehler" });
  }
};

/**
 * getUserTasks
 * Liefert alle Tasks, die dem aktuell eingeloggten User über alle Teams hinweg zugewiesen sind.
 */
exports.getUserTasks = async (req, res) => {
  const pool = req.app.locals.pool;
  const userId = req.userId;

  try {
    // 1. Alle Team-IDs ermitteln, in denen der User Mitglied ist
    const teamsRes = await pool.query(
      "SELECT team_id FROM team_members WHERE user_id = $1",
      [userId]
    );
    const teamIds = teamsRes.rows.map((row) => row.team_id);

    if (teamIds.length === 0) {
      return res.json({ tasks: [] });
    }

    // 2. Alle Tasks abrufen, die diesem User zugewiesen sind und in diesen Teams liegen
    const tasksRes = await pool.query(
      `SELECT * FROM tasks
       WHERE assigned_to = $1
         AND team_id = ANY($2::int[])`,
      [userId, teamIds]
    );
    return res.json({ tasks: tasksRes.rows });
  } catch (err) {
    console.error("Fehler bei getUserTasks:", err);
    return res.status(500).json({ error: "Interner Serverfehler" });
  }
};

/**
 * getTeamProjects
 * Liefert alle Projekte eines Teams.
 */
exports.getTeamProjects = async (req, res) => {
  const pool = req.app.locals.pool;
  const { teamId } = req.params;

  try {
    const projectsRes = await pool.query(
      "SELECT id, name FROM projects WHERE team_id = $1",
      [teamId]
    );
    return res.json(projectsRes.rows);
  } catch (err) {
    console.error("Fehler in getTeamProjects:", err);
    return res.status(500).json({ error: "Interner Serverfehler" });
  }
};

/**
 * postTeamProject
 * Legt ein neues Projekt in einem Team an.
 */
exports.postTeamProject = async (req, res) => {
  const pool = req.app.locals.pool;
  const { teamId } = req.params;
  const { name } = req.body;

  try {
    const newProjRes = await pool.query(
      "INSERT INTO projects (team_id, name) VALUES ($1, $2) RETURNING *",
      [teamId, name]
    );
    return res.json(newProjRes.rows[0]);
  } catch (err) {
    console.error("Fehler in postTeamProject:", err);
    return res.status(500).json({ error: "Interner Serverfehler" });
  }
};

/**
 * getTeamProgress
 * Gibt eine Prozentzahl zurück, wie viele Tasks in einem Team (optional gefiltert nach Projekt oder Priority Flag) erledigt sind.
 */
exports.getTeamProgress = async (req, res) => {
  const pool = req.app.locals.pool;
  const { teamId } = req.params;
  const { projectId, priority_flag } = req.query;

  try {
    // A. Prüfen, ob der User Mitglied im Team ist
    const memberCheck = await pool.query(
      "SELECT 1 FROM team_members WHERE user_id = $1 AND team_id = $2",
      [req.userId, teamId]
    );
    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: "Du bist kein Mitglied dieses Teams" });
    }

    // B. Basis-Query: Gesamt- und erledigte Tasks zählen
    let queryText = `
      SELECT 
        COUNT(*) FILTER (WHERE status NOT IN ('Archived', 'Planning')) AS total_tasks,
        COUNT(*) FILTER (WHERE status = 'Done') AS completed_tasks
      FROM tasks
      WHERE team_id = $1
    `;
    const queryParams = [teamId];
    let paramCounter = 2;

    // B1. Filter: projectId
    if (projectId) {
      if (projectId === "unassigned") {
        queryText += ` AND project_id IS NULL`;
      } else {
        queryText += ` AND project_id = $${paramCounter}`;
        queryParams.push(projectId);
        paramCounter++;
      }
    }
    // B2. Filter: priority_flag
    if (priority_flag) {
      queryText += ` AND priority_flag = $${paramCounter}`;
      queryParams.push(priority_flag);
      paramCounter++;
    }

    // C. Query ausführen und Ergebnis verarbeiten
    const progressRes = await pool.query(queryText, queryParams);
    const { total_tasks, completed_tasks } = progressRes.rows[0];
    const progress = total_tasks > 0
      ? Math.round((completed_tasks / total_tasks) * 100)
      : 0;

    return res.json({ total_tasks, completed_tasks, progress });
  } catch (err) {
    console.error("Fehler in getTeamProgress:", err);
    return res.status(500).json({ error: "Interner Serverfehler" });
  }
};

exports.getUserTaskPoints = async (req, res) => {
  const pool = req.app.locals.pool;
  const userId = req.userId;

  try {
    // 1. Punkte aus  Tasks holen (gruppiert nach Team)
    const taskPointsRes = await pool.query(
      `SELECT 
         t.team_id,
         tm.name AS team_name,
         COALESCE(SUM(t.points), 0) AS task_points
       FROM tasks t
       JOIN teams tm ON t.team_id = tm.id
       WHERE t.assigned_to = $1
       GROUP BY t.team_id, tm.name
       ORDER BY tm.name`,
      [userId]
    );

    // 2. Gesamtsumme aller Task-Punkte berechnen
    const totalTaskPoints = taskPointsRes.rows.reduce((sum, row) => sum + parseInt(row.task_points), 0);

    return res.json({
      total_points: totalTaskPoints,
      points_by_team: taskPointsRes.rows,
      breakdown: {
        task_points: totalTaskPoints
      }
    });
  } catch (err) {
    console.error("Fehler in getUserTaskPoints:", err);
    return res.status(500).json({ error: "Interner Serverfehler" });
  }
};

exports.getWeeklyDeadlines = async (req, res) => {
  const pool = req.app.locals.pool;
  const userId = req.userId;

  // 1. Start und Ende der aktuellen Woche berechnen (Montag 00:00 bis Sonntag 23:59:59)
  const now = new Date();
  const day = now.getDay(); // Sonntag=0, Montag=1, …
  const diffToMonday = (day + 6) % 7; 
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - diffToMonday);
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  try {
    const result = await pool.query(
       `SELECT 
          t.deadline,
          t.title AS task_name,
          t.team_id,
          tm.name     AS team_name
       FROM tasks t
       JOIN team_members tm2 
         ON t.team_id = tm2.team_id
        AND tm2.user_id = $1
       JOIN teams tm 
         ON t.team_id = tm.id
       WHERE t.assigned_to = $1
         AND t.deadline BETWEEN $2 AND $3
       ORDER BY t.deadline ASC`,
      [userId, startOfWeek, endOfWeek]
    );

    return res.json({ deadlines: result.rows });
  } catch (err) {
    console.error("Fehler in getWeeklyDeadlines:", err);
    return res.status(500).json({ error: "Interner Serverfehler" });
  }
};
