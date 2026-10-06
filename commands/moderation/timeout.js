const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const { sendModLog } = require('../../utils/modlog');

const TIME_UNITS = {
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
};

const MAX_TIMEOUT = 28 * 24 * 60 * 60 * 1000; // 28 days in ms

function parseDuration(input) {
  const match = input.match(/^(\d+)\s*(s|m|h|d)$/i);
  if (!match) return null;

  const value = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  const ms = value * TIME_UNITS[unit];

  if (ms <= 0 || ms > MAX_TIMEOUT) return null;
  return ms;
}

function formatDuration(input) {
  const match = input.match(/^(\d+)\s*(s|m|h|d)$/i);
  if (!match) return input;

  const value = match[1];
  const unit = match[2].toLowerCase();
  const names = { s: 'second', m: 'minute', h: 'hour', d: 'day' };
  return `${value} ${names[unit]}${value === '1' ? '' : 's'}`;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Timeout a member')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('The member to timeout')
        .setRequired(true))
    .addStringOption(option =>
      option
        .setName('duration')
        .setDescription('Duration (e.g., 10m, 1h, 30s, 1d)')
        .setRequired(true))
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('Reason for the timeout')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  cooldown: 3,
  async execute(interaction) {
    if (!interaction.memberPermissions.has(PermissionFlagsBits.ModerateMembers)) {
      return interaction.reply({
        embeds: [errorEmbed('Missing Permissions', 'You need the **Moderate Members** permission to use this command.')],
        ephemeral: true,
      });
    }

    if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return interaction.reply({
        embeds: [errorEmbed('Bot Missing Permissions', 'I need the **Moderate Members** permission to timeout members.')],
        ephemeral: true,
      });
    }

    const targetUser = interaction.options.getUser('user');
    const durationStr = interaction.options.getString('duration');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    const durationMs = parseDuration(durationStr);
    if (!durationMs) {
      return interaction.reply({
        embeds: [errorEmbed('Invalid Duration', 'Please provide a valid duration (e.g., `10m`, `1h`, `30s`, `1d`).\nMaximum timeout is 28 days.')],
        ephemeral: true,
      });
    }

    const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
    if (!member) {
      return interaction.reply({
        embeds: [errorEmbed('User Not Found', 'That user is not in this server.')],
        ephemeral: true,
      });
    }

    if (member.roles.highest.position >= interaction.guild.members.me.roles.highest.position) {
      return interaction.reply({
        embeds: [errorEmbed('Cannot Timeout', 'I cannot timeout this user because their highest role is equal to or higher than mine.')],
        ephemeral: true,
      });
    }

    if (!member.moderatable) {
      return interaction.reply({
        embeds: [errorEmbed('Cannot Timeout', 'I cannot timeout this user. They may be the server owner or have a higher role.')],
        ephemeral: true,
      });
    }

    try {
      const durationDisplay = formatDuration(durationStr);
      await member.send(`You have been timed out in **${interaction.guild.name}** for ${durationDisplay}.\nReason: ${reason}`).catch(() => {});
      await member.timeout(durationMs, reason);

      await interaction.reply({
        embeds: [successEmbed('Member Timed Out', `**${targetUser.tag}** has been timed out for ${durationDisplay}.\n**Reason:** ${reason}`)],
      });

      await sendModLog(interaction.guild, {
        action: 'timeout',
        moderator: interaction.user,
        target: targetUser,
        reason,
        duration: durationDisplay,
      });
    } catch (err) {
      await interaction.reply({
        embeds: [errorEmbed('Timeout Failed', `Failed to timeout the user: ${err.message}`)],
        ephemeral: true,
      });
    }
  },
};
