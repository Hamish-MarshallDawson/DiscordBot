const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { db } = require('../../database');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const { sendModLog } = require('../../utils/modlog');

const deleteWarnings = db.prepare(
  'DELETE FROM warnings WHERE user_id = ? AND guild_id = ?'
);
const countWarnings = db.prepare(
  'SELECT COUNT(*) as count FROM warnings WHERE user_id = ? AND guild_id = ?'
);

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clearwarnings')
    .setDescription('Clear all warnings for a member')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('The member to clear warnings for')
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
    const { count } = countWarnings.get(targetUser.id, interaction.guild.id);

    if (count === 0) {
      return interaction.reply({
        embeds: [errorEmbed('No Warnings', `**${targetUser.tag}** has no warnings to clear.`)],
        ephemeral: true,
      });
    }

    deleteWarnings.run(targetUser.id, interaction.guild.id);

    await interaction.reply({
      embeds: [successEmbed('Warnings Cleared', `Cleared **${count}** warning${count === 1 ? '' : 's'} for **${targetUser.tag}**.`)],
    });

    await sendModLog(interaction.guild, {
      action: 'clearwarnings',
      moderator: interaction.user,
      target: targetUser,
      reason: `Cleared ${count} warning${count === 1 ? '' : 's'}`,
    });
  },
};
