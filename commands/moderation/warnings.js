const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { getDb } = require('../../database');
const { infoEmbed, errorEmbed } = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('View warnings for a member')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('The member to check warnings for')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  cooldown: 3,
  async execute(interaction) {
    if (!interaction.memberPermissions.has(PermissionFlagsBits.ModerateMembers)) {
      return interaction.reply({
        embeds: [errorEmbed('Missing Permissions', 'You need the **Moderate Members** permission to use this command.')],
        ephemeral: true,
      });
    }

    const targetUser = interaction.options.getUser('user');
    const db = getDb();
    const warnings = db.prepare(
      'SELECT id, moderator_id, reason, created_at FROM warnings WHERE user_id = ? AND guild_id = ? ORDER BY created_at DESC'
    ).all(targetUser.id, interaction.guild.id);

    if (warnings.length === 0) {
      return interaction.reply({
        embeds: [infoEmbed('Warnings', `**${targetUser.tag}** has no warnings.`)],
      });
    }

    const lines = warnings.map((w, index) => {
      return `**${index + 1}.** ${w.reason}\n   Moderator: <@${w.moderator_id}> | <t:${w.created_at}:R>`;
    });

    await interaction.reply({
      embeds: [infoEmbed(`Warnings for ${targetUser.tag}`, `Total: **${warnings.length}** warning${warnings.length === 1 ? '' : 's'}\n\n${lines.join('\n\n')}`)],
    });
  },
};
