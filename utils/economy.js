const { db } = require('../database');

const getBalanceStmt = db.prepare('SELECT balance FROM economy WHERE user_id = ?');
const insertDefaultStmt = db.prepare('INSERT OR IGNORE INTO economy (user_id, balance) VALUES (?, 0)');
const addCoinsStmt = db.prepare(
  'INSERT INTO economy (user_id, balance) VALUES (?, ?) ON CONFLICT(user_id) DO UPDATE SET balance = balance + excluded.balance'
);
const subtractCoinsStmt = db.prepare('UPDATE economy SET balance = balance - ? WHERE user_id = ?');
const leaderboardStmt = db.prepare('SELECT user_id, balance FROM economy ORDER BY balance DESC LIMIT ?');
const getDailyStmt = db.prepare('SELECT last_daily FROM economy WHERE user_id = ?');
const claimDailyStmt = db.prepare(
  'INSERT INTO economy (user_id, balance, last_daily) VALUES (?, ?, unixepoch()) ON CONFLICT(user_id) DO UPDATE SET balance = balance + excluded.balance, last_daily = unixepoch()'
);

function getBalance(userId) {
  const row = getBalanceStmt.get(userId);
  if (!row) {
    insertDefaultStmt.run(userId);
    return 0;
  }
  return row.balance;
}

function addCoins(userId, amount) {
  addCoinsStmt.run(userId, amount);
}

function removeCoins(userId, amount) {
  const balance = getBalance(userId);
  if (balance < amount) return false;
  subtractCoinsStmt.run(amount, userId);
  return true;
}

function getLeaderboard(limit = 10) {
  return leaderboardStmt.all(limit);
}

function canClaimDaily(userId) {
  const row = getDailyStmt.get(userId);
  if (!row) return true;
  const now = Math.floor(Date.now() / 1000);
  return (now - row.last_daily) >= 86400;
}

function getLastDaily(userId) {
  const row = getDailyStmt.get(userId);
  if (!row) return 0;
  return row.last_daily;
}

function claimDaily(userId, amount = 100) {
  claimDailyStmt.run(userId, amount);
}

module.exports = { getBalance, addCoins, removeCoins, getLeaderboard, canClaimDaily, getLastDaily, claimDaily };
