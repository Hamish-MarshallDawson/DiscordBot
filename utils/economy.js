const { getDb } = require('../database');

function getBalance(userId) {
  const db = getDb();
  const row = db.prepare('SELECT balance FROM economy WHERE user_id = ?').get(userId);
  if (!row) {
    db.prepare('INSERT OR IGNORE INTO economy (user_id, balance) VALUES (?, 0)').run(userId);
    return 0;
  }
  return row.balance;
}

function addCoins(userId, amount) {
  const db = getDb();
  db.prepare(
    'INSERT INTO economy (user_id, balance) VALUES (?, ?) ON CONFLICT(user_id) DO UPDATE SET balance = balance + excluded.balance'
  ).run(userId, amount);
}

function removeCoins(userId, amount) {
  const balance = getBalance(userId);
  if (balance < amount) return false;
  const db = getDb();
  db.prepare('UPDATE economy SET balance = balance - ? WHERE user_id = ?').run(amount, userId);
  return true;
}

function getLeaderboard(limit = 10) {
  const db = getDb();
  return db.prepare('SELECT user_id, balance FROM economy ORDER BY balance DESC LIMIT ?').all(limit);
}

function canClaimDaily(userId) {
  const db = getDb();
  const row = db.prepare('SELECT last_daily FROM economy WHERE user_id = ?').get(userId);
  if (!row) return true;
  const now = Math.floor(Date.now() / 1000);
  return (now - row.last_daily) >= 86400;
}

function getLastDaily(userId) {
  const db = getDb();
  const row = db.prepare('SELECT last_daily FROM economy WHERE user_id = ?').get(userId);
  if (!row) return 0;
  return row.last_daily;
}

function claimDaily(userId, amount = 100) {
  const db = getDb();
  db.prepare(
    'INSERT INTO economy (user_id, balance, last_daily) VALUES (?, ?, unixepoch()) ON CONFLICT(user_id) DO UPDATE SET balance = balance + excluded.balance, last_daily = unixepoch()'
  ).run(userId, amount);
}

module.exports = { getBalance, addCoins, removeCoins, getLeaderboard, canClaimDaily, getLastDaily, claimDaily };
