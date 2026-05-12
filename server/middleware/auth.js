const jwt = require("jsonwebtoken");

function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return res.status(401).json({ error: "Missing token" });
  try {
    req.user = jwt.verify(header.slice(7), process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

function requireSelf(req, res, next) {
  const { id, role } = req.user;
  if (role === "doctor" || role === "admin") return next();
  if (id !== req.params.studentId) return res.status(403).json({ error: "Forbidden" });
  next();
}

module.exports = { requireAuth, requireSelf };
