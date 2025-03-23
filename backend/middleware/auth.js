const jwt = require("jsonwebtoken");
const SECRET = process.env.SECRET || "supergeheim";

function authenticate(req, res, next) {
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
}

module.exports = authenticate;
