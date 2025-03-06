const { Pool } = require("pg");
require("dotenv").config();

// Prüfe, ob DATABASE_URL existiert, wenn ja, nutze sie:
const poolConfig = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL }
  : {
      user: process.env.POSTGRES_USER || "postgres",
      host: process.env.POSTGRES_HOST || "postgres",
      database: process.env.POSTGRES_DB || "karen",
      password: process.env.POSTGRES_PASSWORD || "test",
      port: process.env.POSTGRES_PORT || 5432,
  };

// Erstelle die Verbindungspool
const pool = new Pool(poolConfig);

// Verbindung testen
pool.connect()
  .then(() => console.log("✅ PostgreSQL-Datenbank verbunden!"))
  .catch(err => console.error("❌ Fehler bei der Verbindung zur Datenbank:", err));

module.exports = pool;
