const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { getDb } = require('../../database');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const { sendModLog } = require('../../utils/modlog');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn a member')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('The member to warn')
        .setRequired(true))
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('Reason for the warning')
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
    const reason = interaction.options.getString('reason');

    const db = getDb();
    db.prepare(
      'INSERT INTO warnings (user_id, guild_id, moderator_id, reason) VALUES (?, ?, ?, ?)'
    ).run(targetUser.id, interaction.guild.id, interaction.user.id, reason);

    const countRow = db.prepare(
      'SELECT COUNT(*) as count FROM warnings WHERE user_id = ? AND guild_id = ?'
    ).get(targetUser.id, interaction.guild.id);
    const count = countRow.count;

    try {
      await targetUser.send(`You have been warned in **${interaction.guild.name}**.\n**Reason:** ${reason}\n\nYou now have **${count}** warning${count === 1 ? '' : 's'}.`);
    } catch {
      // DMs may be disabled
    }

    await interaction.reply({
      embeds: [successEmbed('Member Warned', `**${targetUser.tag}** has been warned.\n**Reason:** ${reason}\n\nThey now have **${count}** warning${count === 1 ? '' : 's'}.`)],
    });

    await sendModLog(interaction.guild, {
      action: 'warn',
      moderator: interaction.user,
      target: targetUser,
      reason,
    });
  },
};
