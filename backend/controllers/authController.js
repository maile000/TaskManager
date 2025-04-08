const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const SECRET = process.env.SECRET || "supergeheim";

exports.register = async (req, res) => {
  const pool = req.app.locals.pool;
  const { name, email, password } = req.body;

  try {
    const userExists = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: "E-Mail existiert bereits" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await pool.query(
      "INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING *",
      [name, email, hashedPassword]
    );

    res.json(newUser.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Interner Serverfehler" });
  }
};

exports.login = async (req, res) => {
    const pool = req.app.locals.pool;
    const { email, password } = req.body;
  
    console.log("📩 LOGIN-Request empfangen:", { email, password });
  
    try {
      const user = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
  
      if (user.rows.length === 0) {
        console.log("❌ Kein Benutzer gefunden");
        return res.status(400).json({ error: "Falsche Anmeldedaten" });
      }
  
      const validPassword = await bcrypt.compare(password, user.rows[0].password_hash);
      if (!validPassword) {
        console.log("❌ Passwort falsch");
        return res.status(400).json({ error: "Falsches Passwort" });
      }
  
      const token = jwt.sign({ userId: user.rows[0].id }, process.env.SECRET || "supergeheim", { expiresIn: "2h" });
      console.log("✅ Login erfolgreich");
  
      res.json({ token, user: user.rows[0] });
    } catch (err) {
      console.error("❌ Interner Fehler beim Login:", err); // <— DAS brauchen wir
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