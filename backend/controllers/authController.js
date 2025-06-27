const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const SECRET = process.env.SECRET || "supergeheim";

exports.register = async (req, res) => {
  const pool = req.app.locals.pool;
  const { name, email, password } = req.body;

  try {
    // Prüfen ob User existiert
    const userExists = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: "E-Mail existiert bereits" });
    }

    // Passwort hashen
    const hashedPassword = await bcrypt.hash(password, 10);

    // User erstellen MIT last_login_date
    const newUser = await pool.query(
      `INSERT INTO users 
       (name, email, password_hash, last_login_date) 
       VALUES ($1, $2, $3, CURRENT_DATE) 
       RETURNING *`,
      [name, email, hashedPassword]
    );

    // Trigger manuell auslösen für den ersten Streak
    await pool.query(
      `UPDATE users 
       SET last_login_date = CURRENT_DATE
       WHERE id = $1 AND last_login_date < CURRENT_DATE`,
      [newUser.rows[0].id]
    );
    
    // Aktualisierten User mit Streak-Daten holen
    const updatedUser = await pool.query(
      `SELECT id, name, email, login_streak, total_points, level 
       FROM users WHERE id = $1`,
      [newUser.rows[0].id]
    );

    // Token generieren
    const token = jwt.sign({ userId: updatedUser.rows[0].id }, SECRET, { expiresIn: "2h" });

    res.json({ 
      token,
      user: updatedUser.rows[0]
    });

  } catch (err) {
    console.error("Registrierungsfehler:", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
};

exports.login = async (req, res) => {
  const pool = req.app.locals.pool;
  const { email, password } = req.body;

  try {
    // 1. User finden
    const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (user.rows.length === 0) {
      return res.status(400).json({ error: "Falsche Anmeldedaten" });
    }

    // 2. Passwort prüfen
    const validPassword = await bcrypt.compare(password, user.rows[0].password_hash);
    if (!validPassword) {
      return res.status(400).json({ error: "Falsches Passwort" });
    }

    // 3. Login-Datum aktualisieren (löst Trigger aus)
    await pool.query(
      `UPDATE users 
       SET last_login_date = CURRENT_DATE
       WHERE id = $1 AND last_login_date < CURRENT_DATE`,
      [user.rows[0].id]
    );
    

    // 4. Aktualisierte User-Daten abrufen
    const updatedUser = await pool.query(
      `SELECT id, name, email, login_streak, streak_started_at, total_points, level 
       FROM users WHERE id = $1`,
      [user.rows[0].id]
    );

    // 5. Token generieren
    const token = jwt.sign({ userId: updatedUser.rows[0].id }, SECRET, { expiresIn: "2h" });

    res.json({ 
      token,
      user: updatedUser.rows[0]
    });

  } catch (err) {
    console.error("Login-Fehler:", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
};

exports.getProfile = async (req, res) => {
  const pool = req.app.locals.pool;

  try {
    const user = await pool.query(
      "SELECT id, name, email, total_points, created_at, avatar_data FROM users WHERE id = $1",
      [req.userId]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({ error: "Benutzer nicht gefunden" });
    }

    res.json(user.rows[0]);
  } catch (err) {
    console.error("❌ Fehler beim Abrufen des Profils:", err);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
};