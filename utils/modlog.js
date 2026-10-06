const { EmbedBuilder } = require('discord.js');

async function sendModLog(guild, { action, moderator, target, reason, duration }) {
  const channelId = process.env.MOD_LOG_CHANNEL_ID;
  if (!channelId) return;

  try {
    const channel = await guild.channels.fetch(channelId);
    if (!channel) return;

    const colors = {
      ban: 0xED4245,
      kick: 0xE67E22,
      timeout: 0xFEE75C,
      warn: 0x5865F2,
      clearwarnings: 0x57F287,
    };

    const embed = new EmbedBuilder()
      .setColor(colors[action] || 0x5865F2)
      .setTitle(`\u{1F528} ${action.charAt(0).toUpperCase() + action.slice(1)}`)
      .addFields(
        { name: 'User', value: `<@${target.id}> (${target.id})`, inline: true },
        { name: 'Moderator', value: `<@${moderator.id}>`, inline: true },
        { name: 'Reason', value: reason || 'No reason provided' },
      )
      .setTimestamp();

    if (duration) embed.addFields({ name: 'Duration', value: duration });

    await channel.send({ embeds: [embed] });
  } catch (err) {
    console.error('Failed to send mod log:', err.message);
  }
}

module.exports = { sendModLog };
