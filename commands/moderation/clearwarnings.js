const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { getDb } = require('../../database');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const { sendModLog } = require('../../utils/modlog');

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
    const db = getDb();

    const countRow = db.prepare(
      'SELECT COUNT(*) as count FROM warnings WHERE user_id = ? AND guild_id = ?'
    ).get(targetUser.id, interaction.guild.id);
    const count = countRow.count;

    if (count === 0) {
      return interaction.reply({
        embeds: [errorEmbed('No Warnings', `**${targetUser.tag}** has no warnings to clear.`)],
        ephemeral: true,
      });
    }

    db.prepare('DELETE FROM warnings WHERE user_id = ? AND guild_id = ?').run(targetUser.id, interaction.guild.id);

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
