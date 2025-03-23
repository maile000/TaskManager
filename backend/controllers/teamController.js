const generateInviteCode = require("../utils/generateInviteCode");

exports.createTeam = async (req, res) => {
  const pool = req.app.locals.pool;
  const { teamName } = req.body;
  const userId = req.userId;

  if (!teamName) {
    return res.status(400).json({ error: "Teamname erforderlich" });
  }

  try {
    const inviteCode = generateInviteCode();
    const newTeam = await pool.query(
      "INSERT INTO teams (name, invite_code) VALUES ($1, $2) RETURNING *",
      [teamName, inviteCode]
    );

    await pool.query(
      "INSERT INTO team_members (user_id, team_id, role) VALUES ($1, $2, 'Team Lead')",
      [userId, newTeam.rows[0].id]
    );

    res.json(newTeam.rows[0]);
  } catch (err) {
    console.error("❌ Fehler beim Erstellen des Teams:", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
};

exports.getUserTeams = async (req, res) => {
  const pool = req.app.locals.pool;
  const userId = req.userId;

  try {
    const teams = await pool.query(
      `SELECT t.* FROM teams t
       JOIN team_members tm ON t.id = tm.team_id
       WHERE tm.user_id = $1`,
      [userId]
    );
    res.json(teams.rows);
  } catch (err) {
    res.status(500).json({ error: "Interner Serverfehler" });
  }
};

exports.getTeamDetails = async (req, res) => {
  const pool = req.app.locals.pool;
  const { teamId } = req.params;

  try {
    const memberCheck = await pool.query(
      "SELECT * FROM team_members WHERE user_id = $1 AND team_id = $2",
      [req.userId, teamId]
    );
    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: "Du bist kein Mitglied dieses Teams" });
    }

    const team = await pool.query("SELECT * FROM teams WHERE id = $1", [teamId]);
    if (team.rows.length === 0) {
      return res.status(404).json({ error: "Team nicht gefunden" });
    }

    res.json(team.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Interner Serverfehler" });
  }
};

exports.getInviteCode = async (req, res) => {
  const pool = req.app.locals.pool;
  const { teamId } = req.params;

  try {
    const team = await pool.query("SELECT invite_code FROM teams WHERE id = $1", [teamId]);
    if (team.rows.length === 0) {
      return res.status(404).json({ error: "Team nicht gefunden" });
    }

    res.json({ inviteCode: team.rows[0].invite_code });
  } catch (err) {
    res.status(500).json({ error: "Interner Serverfehler" });
  }
};

exports.getTeamMembers = async (req, res) => {
  const pool = req.app.locals.pool;
  const { teamId } = req.params;

  try {
    const members = await pool.query(
      `SELECT u.id, u.name, u.email, tm.role 
       FROM team_members tm
       JOIN users u ON tm.user_id = u.id
       WHERE tm.team_id = $1`,
      [teamId]
    );
    res.json(members.rows);
  } catch (err) {
    res.status(500).json({ error: "Interner Serverfehler" });
  }
};

exports.changeMemberRole = async (req, res) => {
  const pool = req.app.locals.pool;
  const { teamId, userId } = req.params;
  const { newRole } = req.body;

  const allowedRoles = ["Team Lead", "Member"];

  try {
    const adminCheck = await pool.query(
      "SELECT role FROM team_members WHERE user_id = $1 AND team_id = $2",
      [req.userId, teamId]
    );

    if (adminCheck.rows.length === 0 || adminCheck.rows[0].role !== "Admin") {
      return res.status(403).json({ error: "Nur Admins können Rollen ändern" });
    }

    const userCheck = await pool.query(
      "SELECT * FROM team_members WHERE user_id = $1 AND team_id = $2",
      [userId, teamId]
    );
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: "Teammitglied nicht gefunden" });
    }

    await pool.query(
      "UPDATE team_members SET role = $1 WHERE user_id = $2 AND team_id = $3",
      [newRole, userId, teamId]
    );

    res.json({ message: "Rolle erfolgreich geändert" });
  } catch (err) {
    res.status(500).json({ error: "Interner Serverfehler" });
  }
};

exports.updateColumnOrder = async (req, res) => {
  const pool = req.app.locals.pool;
  const { teamId } = req.params;
  const { columnOrder } = req.body;

  try {
    await pool.query(
      "UPDATE teams SET column_order = $1 WHERE id = $2",
      [JSON.stringify(columnOrder), teamId]
    );
    res.json({ message: "Column order updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Database error" });
  }
};

exports.joinTeam = async (req, res) => {
  const pool = req.app.locals.pool;
  const { inviteCode } = req.body;
  const userId = req.userId;

  if (!inviteCode) {
    return res.status(400).json({ error: "Einladungscode erforderlich" });
  }

  try {
    const team = await pool.query(
      "SELECT id FROM teams WHERE invite_code = $1",
      [inviteCode]
    );

    if (team.rows.length === 0) {
      return res.status(404).json({ error: "Ungültiger Einladungscode" });
    }

    const teamId = team.rows[0].id;

    // Prüfen, ob User bereits im Team ist
    const existingMember = await pool.query(
      "SELECT * FROM team_members WHERE user_id = $1 AND team_id = $2",
      [userId, teamId]
    );

    if (existingMember.rows.length > 0) {
      return res.status(400).json({ error: "Du bist bereits Mitglied dieses Teams" });
    }

    await pool.query(
      "INSERT INTO team_members (user_id, team_id, role) VALUES ($1, $2, 'Member')",
      [userId, teamId]
    );

    res.json({ message: "Du bist dem Team erfolgreich beigetreten", teamId });
  } catch (err) {
    console.error("❌ Fehler beim Teambeitritt:", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
};

