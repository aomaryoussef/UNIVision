const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

// On Vercel (serverless), use /tmp for writable storage; otherwise use local path
const isVercel = !!process.env.VERCEL;
const DB_PATH = isVercel
  ? "/tmp/univision.db"
  : path.join(__dirname, "univision.db");

let _db = null;

function getDb() {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma("journal_mode = WAL");
    _db.pragma("foreign_keys = ON");
  }
  return _db;
}

module.exports = { getDb };
