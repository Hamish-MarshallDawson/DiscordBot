const { SlashCommandBuilder } = require('discord.js');
const { getBalance } = require('../../utils/economy');
const { infoEmbed } = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Check your coin balance or another user\'s')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('The user to check the balance of')
        .setRequired(false)),
  cooldown: 3,
  async execute(interaction) {
    const targetUser = interaction.options.getUser('user') || interaction.user;
    const balance = getBalance(targetUser.id);

    const title = targetUser.id === interaction.user.id ? 'Your Balance' : `${targetUser.displayName}'s Balance`;

    await interaction.reply({
      embeds: [infoEmbed(title, `\u{1FA99} **${balance.toLocaleString()}** coins`)],
    });
  },
};
