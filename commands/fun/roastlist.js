const { SlashCommandBuilder } = require('discord.js');
const { getDb } = require('../../database');
const { infoEmbed } = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('roastlist')
    .setDescription('List all active roasts in this server'),
  async execute(interaction) {
    const now = Math.floor(Date.now() / 1000);

    // Clean up expired roasts first
    const db = getDb();
    db.prepare('DELETE FROM active_roasts WHERE expires_at < ?').run(now);

    const roasts = db.prepare(
      'SELECT target_id, channel_id, style, started_by, expires_at FROM active_roasts WHERE guild_id = ?'
    ).all(interaction.guild.id);

    if (roasts.length === 0) {
      return interaction.reply({
        embeds: [infoEmbed('Active Roasts', 'No active roasts in this server. Use `/roast` to start one!')],
      });
    }

    const embed = infoEmbed('Active Roasts', `There ${roasts.length === 1 ? 'is' : 'are'} **${roasts.length}** active roast${roasts.length === 1 ? '' : 's'}:`);

    for (const roast of roasts) {
      const timeRemaining = roast.expires_at - now;
      const minutes = Math.floor(timeRemaining / 60);
      const seconds = timeRemaining % 60;

      embed.addFields({
        name: `Roast #${roasts.indexOf(roast) + 1}`,
        value: [
          `**Target:** <@${roast.target_id}>`,
          `**Style:** ${roast.style}`,
          `**Channel:** <#${roast.channel_id}>`,
          `**Time Remaining:** ${minutes}m ${seconds}s`,
          `**Started By:** <@${roast.started_by}>`,
        ].join('\n'),
        inline: true,
      });
    }

    await interaction.reply({ embeds: [embed] });
  },
};
