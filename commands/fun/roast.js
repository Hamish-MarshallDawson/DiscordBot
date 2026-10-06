const { SlashCommandBuilder } = require('discord.js');
const { getDb } = require('../../database');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const { getStyles } = require('../../utils/transformers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('roast')
    .setDescription('Roast a user by transforming their messages')
    .addUserOption(option =>
      option
        .setName('target')
        .setDescription('The user to roast')
        .setRequired(true)
    )
    .addStringOption(option => {
      const opt = option
        .setName('style')
        .setDescription('The roast style')
        .setRequired(true);
      for (const style of getStyles()) {
        opt.addChoices({ name: style, value: style });
      }
      return opt;
    })
    .addIntegerOption(option =>
      option
        .setName('duration')
        .setDescription('Duration in minutes (default: 5)')
        .setMinValue(1)
        .setMaxValue(30)
    ),
  async execute(interaction) {
    const target = interaction.options.getUser('target');
    const style = interaction.options.getString('style');
    const duration = interaction.options.getInteger('duration') ?? 5;

    if (target.bot) {
      return interaction.reply({
        embeds: [errorEmbed('Cannot Roast', 'You cannot roast a bot!')],
        ephemeral: true,
      });
    }

    const expiresAt = Math.floor(Date.now() / 1000) + duration * 60;

    const db = getDb();
    db.prepare(`
      INSERT OR REPLACE INTO active_roasts (target_id, channel_id, guild_id, style, started_by, expires_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(target.id, interaction.channel.id, interaction.guild.id, style, interaction.user.id, expiresAt);

    const embed = successEmbed(
      'Roast Activated!',
      `${target} is now being roasted in **${style}** style for **${duration} minute${duration === 1 ? '' : 's'}**!\n\nEvery message they send in this channel will be transformed.`
    );

    await interaction.reply({ embeds: [embed] });
  },
};
