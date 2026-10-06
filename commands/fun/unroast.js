const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { db } = require('../../database');
const { successEmbed, errorEmbed } = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unroast')
    .setDescription('Stop roasting a user in this channel')
    .addUserOption(option =>
      option
        .setName('target')
        .setDescription('The user to stop roasting')
        .setRequired(true)
    ),
  async execute(interaction) {
    const target = interaction.options.getUser('target');

    const roast = db.prepare(
      'SELECT id, started_by FROM active_roasts WHERE target_id = ? AND channel_id = ?'
    ).get(target.id, interaction.channel.id);

    if (!roast) {
      return interaction.reply({
        embeds: [errorEmbed('No Active Roast', `${target} is not being roasted in this channel.`)],
        ephemeral: true,
      });
    }

    // Check permission: must be the one who started the roast or have ManageMessages
    const hasPermission =
      roast.started_by === interaction.user.id ||
      interaction.member.permissions.has(PermissionFlagsBits.ManageMessages);

    if (!hasPermission) {
      return interaction.reply({
        embeds: [errorEmbed('Permission Denied', 'You can only stop roasts that you started, or you need the Manage Messages permission.')],
        ephemeral: true,
      });
    }

    db.prepare('DELETE FROM active_roasts WHERE id = ?').run(roast.id);

    await interaction.reply({
      embeds: [successEmbed('Roast Removed', `${target} is no longer being roasted in this channel.`)],
    });
  },
};
