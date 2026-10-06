const { Events } = require('discord.js');
const { getDb } = require('../database');
const transformers = require('../utils/transformers');

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    if (message.author.bot) return;
    if (!message.guild) return;

    // Check for active roast
    const db = getDb();
    const roast = db.prepare(
      'SELECT id, style, expires_at FROM active_roasts WHERE target_id = ? AND channel_id = ?'
    ).get(message.author.id, message.channel.id);

    if (!roast) return;

    // Check if expired
    const now = Math.floor(Date.now() / 1000);
    if (roast.expires_at < now) {
      db.prepare('DELETE FROM active_roasts WHERE id = ?').run(roast.id);
      return;
    }

    // Transform and reply
    const transformer = transformers[roast.style];
    if (transformer && message.content) {
      const transformed = transformer(message.content);
      await message.reply(transformed);
    }
  },
};
