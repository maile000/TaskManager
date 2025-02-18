require("dotenv").config();
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const pool = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

const SECRET = "supergeheim"; // Verwende .env für Sicherheit

//  Registrierung eines Users (mit Hash-Passwort)
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Prüfen, ob die E-Mail bereits existiert
    const userExists = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (userExists.rows.length > 0) return res.status(400).json({ error: "E-Mail existiert bereits" });

    // Passwort hashen
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Neuen User in die DB einfügen
    const newUser = await pool.query(
      "INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING *",
      [name, email, hashedPassword]
    );

    res.json(newUser.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server-Fehler");
  }
});

// Login mit JWT-Token
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (user.rows.length === 0) return res.status(400).json({ error: "Falsche Anmeldedaten" });

    // Passwort prüfen
    const validPassword = await bcrypt.compare(password, user.rows[0].password_hash);
    if (!validPassword) return res.status(400).json({ error: "Falsches Passwort" });

    // JWT-Token erstellen
    const token = jwt.sign({ userId: user.rows[0].id }, SECRET, { expiresIn: "2h" });

    res.json({ token, user: user.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server-Fehler");
  }
});

//  Team erstellen mit Einladungscode
app.post("/create-team", async (req, res) => {
  const { userId, teamName } = req.body;
  const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

  try {
    const newTeam = await pool.query(
      "INSERT INTO teams (name, invite_code) VALUES ($1, $2) RETURNING *",
      [teamName, inviteCode]
    );

    // Team-Ersteller zum ersten Mitglied machen
    await pool.query("INSERT INTO team_members (user_id, team_id, role) VALUES ($1, $2, 'Team Lead')", 
                     [userId, newTeam.rows[0].id]);

    res.json(newTeam.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server-Fehler");
  }
});

//  Team beitreten mit Einladungscode
app.post("/join-team", async (req, res) => {
  const { userId, inviteCode } = req.body;

  try {
    const team = await pool.query("SELECT * FROM teams WHERE invite_code = $1", [inviteCode]);
    if (team.rows.length === 0) return res.status(400).json({ error: "Ungültiger Einladungscode" });

    const teamId = team.rows[0].id;

    // Prüfen, ob User bereits Mitglied ist
    const alreadyMember = await pool.query(
      "SELECT * FROM team_members WHERE user_id = $1 AND team_id = $2",
      [userId, teamId]
    );
    if (alreadyMember.rows.length > 0) return res.status(400).json({ error: "Bereits im Team" });

    // User zum Team hinzufügen
    await pool.query("INSERT INTO team_members (user_id, team_id, role) VALUES ($1, $2, 'Member')", 
                     [userId, teamId]);

    res.json({ message: "Team beigetreten", team: team.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server-Fehler");
  }
});

//  Logout (nur Client-seitig Token löschen)
app.post("/logout", (req, res) => {
  res.json({ message: "Logout erfolgreich" });
});

app.listen(5000, () => console.log("🚀 Backend läuft auf Port 5000"));
