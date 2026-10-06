const { SlashCommandBuilder } = require('discord.js');
const { canClaimDaily, claimDaily, getBalance, getLastDaily } = require('../../utils/economy');
const { successEmbed, errorEmbed } = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('daily')
    .setDescription('Claim your daily coins!'),
  cooldown: 5,
  async execute(interaction) {
    const userId = interaction.user.id;

    if (!canClaimDaily(userId)) {
      const lastDaily = getLastDaily(userId);
      const nextClaim = lastDaily + 86400;
      return interaction.reply({
        embeds: [errorEmbed('Daily Already Claimed', `You can claim your daily reward again <t:${nextClaim}:R>.`)],
        ephemeral: true,
      });
    }

    const amount = 100;
    claimDaily(userId, amount);
    const newBalance = getBalance(userId);

    await interaction.reply({
      embeds: [successEmbed('Daily Reward Claimed!', `You received \u{1FA99} **${amount}** coins!\n\nYour balance: \u{1FA99} **${newBalance}** coins`)],
    });
  },
};
