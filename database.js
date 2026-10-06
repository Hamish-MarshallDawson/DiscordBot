const path = require('node:path');
const fs = require('node:fs');
const initSqlJs = require('sql.js');

const dataDir = path.join(__dirname, 'data');
const dbPath = path.join(dataDir, 'bot.db');

let db = null;

/**
 * Wrapper around sql.js that mimics the better-sqlite3 API.
 * This lets all command files use db.prepare(sql).get/run/all()
 * exactly like better-sqlite3, but with zero native compilation.
 */
function createWrapper(rawDb) {
  function save() {
    const data = rawDb.export();
    fs.writeFileSync(dbPath, Buffer.from(data));
  }

  return {
    prepare(sql) {
      return {
        run(...params) {
          rawDb.run(sql, params);
          save();
          return { changes: rawDb.getRowsModified() };
        },
        get(...params) {
          const stmt = rawDb.prepare(sql);
          if (params.length > 0) stmt.bind(params);
          let result = null;
          if (stmt.step()) {
            result = stmt.getAsObject();
          }
          stmt.free();
          return result;
        },
        all(...params) {
          const results = [];
          const stmt = rawDb.prepare(sql);
          if (params.length > 0) stmt.bind(params);
          while (stmt.step()) {
            results.push(stmt.getAsObject());
          }
          stmt.free();
          return results;
        },
      };
    },
    exec(sql) {
      rawDb.exec(sql);
      save();
    },
  };
}

async function initDatabase() {
  fs.mkdirSync(dataDir, { recursive: true });

  const SQL = await initSqlJs();

  // Load existing database file if it exists
  let rawDb;
  try {
    const fileBuffer = fs.readFileSync(dbPath);
    rawDb = new SQL.Database(fileBuffer);
  } catch {
    rawDb = new SQL.Database();
  }

  // Enable WAL mode equivalent (not applicable in sql.js, but harmless)
  rawDb.exec(`
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

  db = createWrapper(rawDb);

  // Clean up expired roasts on startup
  db.prepare('DELETE FROM active_roasts WHERE expires_at < unixepoch()').run();
}

function getDb() {
  if (!db) throw new Error('Database not initialized — call initDatabase() first');
  return db;
}

module.exports = { initDatabase, getDb };
