const { SlashCommandBuilder } = require("discord.js");

//Says sus
module.exports = {
  data: new SlashCommandBuilder().setName("sus").setDescription("Says sus"),
  async execute(interaction) {
    await interaction.reply("Sus");
  },
};
