const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const { sendModLog } = require('../../utils/modlog');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a member from the server')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('The member to kick')
        .setRequired(true))
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('Reason for the kick')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
  cooldown: 3,
  async execute(interaction) {
    if (!interaction.memberPermissions.has(PermissionFlagsBits.KickMembers)) {
      return interaction.reply({
        embeds: [errorEmbed('Missing Permissions', 'You need the **Kick Members** permission to use this command.')],
        ephemeral: true,
      });
    }

    if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.KickMembers)) {
      return interaction.reply({
        embeds: [errorEmbed('Bot Missing Permissions', 'I need the **Kick Members** permission to kick members.')],
        ephemeral: true,
      });
    }

    const targetUser = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
    if (!member) {
      return interaction.reply({
        embeds: [errorEmbed('User Not Found', 'That user is not in this server.')],
        ephemeral: true,
      });
    }

    if (member.roles.highest.position >= interaction.guild.members.me.roles.highest.position) {
      return interaction.reply({
        embeds: [errorEmbed('Cannot Kick', 'I cannot kick this user because their highest role is equal to or higher than mine.')],
        ephemeral: true,
      });
    }

    if (!member.kickable) {
      return interaction.reply({
        embeds: [errorEmbed('Cannot Kick', 'I cannot kick this user. They may be the server owner or have a higher role.')],
        ephemeral: true,
      });
    }

    try {
      await member.send(`You have been kicked from **${interaction.guild.name}**.\nReason: ${reason}`).catch(() => {});
      await member.kick(reason);

      await interaction.reply({
        embeds: [successEmbed('Member Kicked', `**${targetUser.tag}** has been kicked.\n**Reason:** ${reason}`)],
      });

      await sendModLog(interaction.guild, {
        action: 'kick',
        moderator: interaction.user,
        target: targetUser,
        reason,
      });
    } catch (err) {
      await interaction.reply({
        embeds: [errorEmbed('Kick Failed', `Failed to kick the user: ${err.message}`)],
        ephemeral: true,
      });
    }
  },
};
