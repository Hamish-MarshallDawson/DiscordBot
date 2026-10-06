const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const { sendModLog } = require('../../utils/modlog');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a member from the server')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('The member to ban')
        .setRequired(true))
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('Reason for the ban')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
  cooldown: 3,
  async execute(interaction) {
    if (!interaction.memberPermissions.has(PermissionFlagsBits.BanMembers)) {
      return interaction.reply({
        embeds: [errorEmbed('Missing Permissions', 'You need the **Ban Members** permission to use this command.')],
        ephemeral: true,
      });
    }

    if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.BanMembers)) {
      return interaction.reply({
        embeds: [errorEmbed('Bot Missing Permissions', 'I need the **Ban Members** permission to ban members.')],
        ephemeral: true,
      });
    }

    const targetUser = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

    if (member) {
      if (member.roles.highest.position >= interaction.guild.members.me.roles.highest.position) {
        return interaction.reply({
          embeds: [errorEmbed('Cannot Ban', 'I cannot ban this user because their highest role is equal to or higher than mine.')],
          ephemeral: true,
        });
      }

      if (!member.bannable) {
        return interaction.reply({
          embeds: [errorEmbed('Cannot Ban', 'I cannot ban this user. They may be the server owner or have a higher role.')],
          ephemeral: true,
        });
      }
    }

    try {
      if (member) {
        await member.send(`You have been banned from **${interaction.guild.name}**.\nReason: ${reason}`).catch(() => {});
      }

      await interaction.guild.members.ban(targetUser, { deleteMessageSeconds: 0, reason });

      await interaction.reply({
        embeds: [successEmbed('Member Banned', `**${targetUser.tag}** has been banned.\n**Reason:** ${reason}`)],
      });

      await sendModLog(interaction.guild, {
        action: 'ban',
        moderator: interaction.user,
        target: targetUser,
        reason,
      });
    } catch (err) {
      await interaction.reply({
        embeds: [errorEmbed('Ban Failed', `Failed to ban the user: ${err.message}`)],
        ephemeral: true,
      });
    }
  },
};
