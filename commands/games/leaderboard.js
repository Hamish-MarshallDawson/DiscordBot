const { SlashCommandBuilder } = require('discord.js');
const { getLeaderboard } = require('../../utils/economy');
const { infoEmbed } = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('See the top coin holders'),
  cooldown: 5,
  async execute(interaction) {
    const leaders = getLeaderboard(10);

    if (leaders.length === 0) {
      return interaction.reply({
        embeds: [infoEmbed('Leaderboard', 'No one has any coins yet!')],
      });
    }

    const medals = ['\u{1F947}', '\u{1F948}', '\u{1F949}'];
    const lines = leaders.map((entry, index) => {
      const prefix = medals[index] || `**${index + 1}.**`;
      return `${prefix} <@${entry.user_id}> — \u{1FA99} **${entry.balance.toLocaleString()}** coins`;
    });

    await interaction.reply({
      embeds: [infoEmbed('\u{1F3C6} Coin Leaderboard', lines.join('\n'))],
    });
  },
};
