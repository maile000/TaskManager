require("dotenv").config();

const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: process.env.POSTGRES_USER || "postgres",
  host: process.env.POSTGRES_HOST || "postgres",
  database: process.env.POSTGRES_DB || "karen",
  password: process.env.POSTGRES_PASSWORD || "test",
  port: process.env.POSTGRES_PORT || 5432,
});

// SECRET wird aus der Umgebungsvariable gelesen oder als Fallback genutzt
const SECRET = process.env.SECRET || "supergeheim";

// Hilfsfunktion zur Generierung eines Einladungscodes
const generateInviteCode = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Authentifizierungs-Middleware
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Kein Token vorhanden" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, SECRET);
    req.userId = decoded.userId; 
    next();
  } catch (err) {
    return res.status(403).json({ error: "Ungültiger oder abgelaufener Token" });
  }
};

// Benutzer registrieren
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const userExists = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: "E-Mail existiert bereits" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await pool.query(
      "INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING *",
      [name, email, hashedPassword]
    );

    res.json(newUser.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

// Benutzer-Login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Suche Benutzer in der Datenbank
    const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (user.rows.length === 0) {
      return res.status(400).json({ error: "Falsche Anmeldedaten" });
    }

    // Passwortvergleich
    const validPassword = await bcrypt.compare(password, user.rows[0].password_hash);
    if (!validPassword) {
      return res.status(400).json({ error: "Falsches Passwort" });
    }

    // JWT-Token erstellen, SECRET konsistent verwenden
    const token = jwt.sign({ userId: user.rows[0].id }, SECRET, { expiresIn: "2h" });

    res.json({ token, user: user.rows[0] });
  } catch (err) {
    console.error("Login-Fehler:", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

// Team erstellen
app.post("/create-team", authenticate, async (req, res) => {
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
});

// Alle Teams eines Benutzers abrufen
app.get("/teams", authenticate, async (req, res) => {
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
});

// Details eines spezifischen Teams abrufen
app.get("/teams/:teamId", authenticate, async (req, res) => {
  const { teamId } = req.params;

  try {
    const team = await pool.query("SELECT * FROM teams WHERE id = $1", [teamId]);
    if (team.rows.length === 0) {
      return res.status(404).json({ error: "Team nicht gefunden" });
    }
    res.json(team.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

// Einladungscode eines Teams abrufen
app.get("/teams/:teamId/invite-code", authenticate, async (req, res) => {
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
});

// Rollen der Teammitglieder abrufen
app.get("/teams/:teamId/members", authenticate, async (req, res) => {
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
});

// Task erstellen
app.post("/teams/:teamId/tasks", authenticate, async (req, res) => {
  const { teamId } = req.params;
  const { title, description, assignedTo, deadline } = req.body;
  const userId = req.userId;

  if (!title) {
    return res.status(400).json({ error: "Titel ist erforderlich" });
  }

  try {
    // Prüfen, ob der Benutzer Mitglied des Teams ist
    const memberCheck = await pool.query(
      "SELECT * FROM team_members WHERE user_id = $1 AND team_id = $2",
      [userId, teamId]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: "Du bist kein Mitglied dieses Teams" });
    }

    // Neue Task einfügen
    const newTask = await pool.query(
      `INSERT INTO tasks (team_id, title, description, assigned_to, deadline, status)
       VALUES ($1, $2, $3, $4, $5, 'To Do') RETURNING *`,
      [teamId, title, description, assignedTo || null, deadline || null]
    );

    res.json({ message: "Task erfolgreich erstellt", task: newTask.rows[0] });
  } catch (err) {
    console.error("❌ Fehler beim Erstellen der Task:", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

// Rolle eines Teammitglieds ändern
app.put("/teams/:teamId/members/:userId/role", authenticate, async (req, res) => {
  const { teamId, userId } = req.params;
  const { newRole } = req.body;

  const allowedRoles = ["Team Lead", "Member"];

  try {
    // Überprüfen, ob der anfragende Benutzer ein Admin ist
    const adminCheck = await pool.query(
      "SELECT role FROM team_members WHERE user_id = $1 AND team_id = $2",
      [req.userId, teamId]
    );

    if (adminCheck.rows.length === 0 || adminCheck.rows[0].role !== "Admin") {
      return res.status(403).json({ error: "Nur Admins können Rollen ändern" });
    }
    
    // Prüfen, ob das zu ändernde Teammitglied existiert
    const userCheck = await pool.query(
      "SELECT * FROM team_members WHERE user_id = $1 AND team_id = $2",
      [userId, teamId]
    );
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: "Teammitglied nicht gefunden" });
    }

    // Rolle aktualisieren
    await pool.query(
      "UPDATE team_members SET role = $1 WHERE user_id = $2 AND team_id = $3",
      [newRole, userId, teamId]
    );

    res.json({ message: "Rolle erfolgreich geändert" });
  } catch (err) {
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

// Alle Tasks eines Teams abrufen
app.get("/teams/:teamId/tasks", authenticate, async (req, res) => {
  const { teamId } = req.params;
  const { sortBy } = req.query; // Optional: Sortierung

  const validSortFields = ["created_at", "deadline", "status"];
  const orderBy = validSortFields.includes(sortBy) ? sortBy : "created_at";

  try {
    // Prüfen, ob der Benutzer Mitglied des Teams ist
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
    console.error("❌ Fehler beim Abrufen der Tasks:", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

// Task-Status aktualisieren
app.put("/tasks/:taskId/status", authenticate, async (req, res) => {
  const { taskId } = req.params;
  const { newStatus } = req.body;
  const validStatuses = ["To Do", "Planning", "In Progress", "Done"];

  if (!validStatuses.includes(newStatus)) {
    return res.status(400).json({ error: "Ungültiger Status" });
  }

  try {
    // Prüfen, ob die Task existiert und ob der Benutzer im Team ist
    const taskCheck = await pool.query(
      `SELECT t.*, tm.user_id FROM tasks t
       JOIN team_members tm ON t.team_id = tm.team_id
       WHERE t.id = $1 AND tm.user_id = $2`,
      [taskId, req.userId]
    );

    if (taskCheck.rows.length === 0) {
      return res.status(403).json({ error: "Du hast keine Berechtigung für diese Task" });
    }

    // Task-Status aktualisieren
    await pool.query(
      "UPDATE tasks SET status = $1 WHERE id = $2",
      [newStatus, taskId]
    );

    res.json({ message: "Task-Status erfolgreich geändert" });
  } catch (err) {
    console.error("❌ Fehler beim Ändern des Task-Status:", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

// Server starten
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});
