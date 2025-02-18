const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
    user: "postgres",
    host: "localhost",
    database: "karen",
    password: "mysecretpassword", // Ändere dein Passwort!
    port: 5432
});

pool.connect()
    .then(() => console.log("✅ PostgreSQL-Datenbank verbunden!"))
    .catch(err => console.error("❌ Fehler bei der Verbindung zur Datenbank:", err));

module.exports = pool;
