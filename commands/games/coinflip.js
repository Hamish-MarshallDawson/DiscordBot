const { SlashCommandBuilder } = require('discord.js');
const { getBalance, addCoins, removeCoins } = require('../../utils/economy');
const { successEmbed, errorEmbed, infoEmbed } = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('coinflip')
    .setDescription('Flip a coin! Optionally bet some coins.')
    .addIntegerOption(option =>
      option
        .setName('bet')
        .setDescription('Amount of coins to bet')
        .setMinValue(1)
        .setRequired(false)),
  cooldown: 3,
  async execute(interaction) {
    const bet = interaction.options.getInteger('bet');
    const userId = interaction.user.id;
    const isHeads = Math.random() > 0.5;
    const result = isHeads ? 'Heads' : 'Tails';
    const emoji = isHeads ? '\u{1FA99}' : '\u{1FA99}';

    if (bet) {
      if (!removeCoins(userId, bet)) {
        const balance = getBalance(userId);
        return interaction.reply({
          embeds: [errorEmbed('Insufficient Coins', `You don\'t have enough coins!\nYour balance: \u{1FA99} **${balance.toLocaleString()}** coins`)],
          ephemeral: true,
        });
      }

      const won = Math.random() > 0.5;

      if (won) {
        addCoins(userId, bet * 2);
        const newBalance = getBalance(userId);
        await interaction.reply({
          embeds: [successEmbed(`${emoji} ${result} — You Win!`, `You won \u{1FA99} **${bet}** coins!\n\nYour balance: \u{1FA99} **${newBalance.toLocaleString()}** coins`)],
        });
      } else {
        const newBalance = getBalance(userId);
        await interaction.reply({
          embeds: [errorEmbed(`${emoji} ${result} — You Lose!`, `You lost \u{1FA99} **${bet}** coins.\n\nYour balance: \u{1FA99} **${newBalance.toLocaleString()}** coins`)],
        });
      }
    } else {
      await interaction.reply({
        embeds: [infoEmbed(`${emoji} Coin Flip`, `The coin landed on **${result}**!`)],
      });
    }
  },
};
