const { SlashCommandBuilder } = require('discord.js');
const { getBalance, addCoins, removeCoins } = require('../../utils/economy');
const { successEmbed, errorEmbed, infoEmbed } = require('../../utils/embeds');

const SYMBOLS = ['\u{1F352}', '\u{1F34B}', '\u{1F514}', '\u{1F48E}', '7️⃣'];

function getMultiplier(slots) {
  const [a, b, c] = slots;

  if (a === '7️⃣' && b === '7️⃣' && c === '7️⃣') return 50;
  if (a === '\u{1F48E}' && b === '\u{1F48E}' && c === '\u{1F48E}') return 20;
  if (a === b && b === c) return 10;
  if (a === b || b === c || a === c) return 2;
  return 0;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('slots')
    .setDescription('Try your luck on the slot machine!')
    .addIntegerOption(option =>
      option
        .setName('bet')
        .setDescription('Amount of coins to bet (max 1000)')
        .setMinValue(1)
        .setMaxValue(1000)
        .setRequired(false)),
  cooldown: 3,
  async execute(interaction) {
    const bet = interaction.options.getInteger('bet');
    const userId = interaction.user.id;

    if (bet) {
      if (!removeCoins(userId, bet)) {
        const balance = getBalance(userId);
        return interaction.reply({
          embeds: [errorEmbed('Insufficient Coins', `You don\'t have enough coins!\nYour balance: \u{1FA99} **${balance.toLocaleString()}** coins`)],
          ephemeral: true,
        });
      }
    }

    const slots = [
      SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
      SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
      SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
    ];

    const display = `\u{1F3B0} [ ${slots[0]} | ${slots[1]} | ${slots[2]} ]`;
    const multiplier = getMultiplier(slots);

    if (bet) {
      if (multiplier > 0) {
        const winnings = bet * multiplier;
        addCoins(userId, winnings);
        const newBalance = getBalance(userId);
        await interaction.reply({
          embeds: [successEmbed(`${display}`, `You won \u{1FA99} **${winnings.toLocaleString()}** coins! (${multiplier}x)\n\nYour balance: \u{1FA99} **${newBalance.toLocaleString()}** coins`)],
        });
      } else {
        const newBalance = getBalance(userId);
        await interaction.reply({
          embeds: [errorEmbed(`${display}`, `No match. You lost \u{1FA99} **${bet.toLocaleString()}** coins.\n\nYour balance: \u{1FA99} **${newBalance.toLocaleString()}** coins`)],
        });
      }
    } else {
      const resultText = multiplier > 0
        ? `That would have been a **${multiplier}x** win!`
        : 'No match this time. Better luck next time!';
      await interaction.reply({
        embeds: [infoEmbed(`${display}`, `${resultText}\n\nUse \`/slots <bet>\` to play for coins!`)],
      });
    }
  },
};
