const path = require('node:path');
const fs = require('node:fs');
const Database = require('better-sqlite3');

const dataDir = path.join(__dirname, 'data');
fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'bot.db'));

// Enable WAL mode for better concurrent performance
db.pragma('journal_mode = WAL');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS steam_links (
      discord_id TEXT PRIMARY KEY,
      steam_id TEXT NOT NULL,
      linked_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS economy (
      user_id TEXT PRIMARY KEY,
      balance INTEGER NOT NULL DEFAULT 0,
      last_daily INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS warnings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      guild_id TEXT NOT NULL,
      moderator_id TEXT NOT NULL,
      reason TEXT NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS active_roasts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      target_id TEXT NOT NULL,
      channel_id TEXT NOT NULL,
      guild_id TEXT NOT NULL,
      style TEXT NOT NULL,
      started_by TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      UNIQUE(target_id, channel_id)
    );
  `);

  // Clean up expired roasts on startup
  db.prepare('DELETE FROM active_roasts WHERE expires_at < unixepoch()').run();
}

module.exports = { db, initDatabase };
