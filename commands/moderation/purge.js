const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Bulk delete messages from the channel')
    .addIntegerOption(option =>
      option
        .setName('count')
        .setDescription('Number of messages to delete (1-100)')
        .setMinValue(1)
        .setMaxValue(100)
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  cooldown: 5,
  async execute(interaction) {
    if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageMessages)) {
      return interaction.reply({
        embeds: [errorEmbed('Missing Permissions', 'You need the **Manage Messages** permission to use this command.')],
        ephemeral: true,
      });
    }

    if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return interaction.reply({
        embeds: [errorEmbed('Bot Missing Permissions', 'I need the **Manage Messages** permission to delete messages.')],
        ephemeral: true,
      });
    }

    const count = interaction.options.getInteger('count');

    try {
      const deleted = await interaction.channel.bulkDelete(count, true);

      if (deleted.size === 0) {
        return interaction.reply({
          embeds: [errorEmbed('No Messages Deleted', 'No messages were deleted. Messages older than 14 days cannot be bulk deleted.')],
          ephemeral: true,
        });
      }

      await interaction.reply({
        embeds: [successEmbed('Messages Purged', `Successfully deleted **${deleted.size}** message${deleted.size === 1 ? '' : 's'}.${deleted.size < count ? `\n\n*Note: Messages older than 14 days cannot be bulk deleted.*` : ''}`)],
        ephemeral: true,
      });
    } catch (err) {
      await interaction.reply({
        embeds: [errorEmbed('Purge Failed', `Failed to delete messages: ${err.message}`)],
        ephemeral: true,
      });
    }
  },
};
