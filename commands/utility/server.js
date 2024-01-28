const { SlashCommandBuilder } = require("discord.js");

//command that shows the user the name of the server and the amount of members
module.exports = {
  data: new SlashCommandBuilder()
    .setName("server")
    .setDescription("Provides information about the server."),
  async execute(interaction) {
    await interaction.reply(
      `This server is ${interaction.guild.name} and has ${interaction.guild.memberCount} members`
    );
  },
};
