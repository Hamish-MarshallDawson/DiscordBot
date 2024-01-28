const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("malady")
    .setDescription("For the gentlemen"),
  async execute(interaction) {
    await interaction.reply(
      "https://tenor.com/view/fedora-tipshat-mlady-melady-athiest-gif-7191305"
    );
  },
};
