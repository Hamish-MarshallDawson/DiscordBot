const { EmbedBuilder } = require('discord.js');

function successEmbed(title, description) {
  return new EmbedBuilder()
    .setColor(0x57F287)
    .setTitle(title)
    .setDescription(description)
    .setTimestamp();
}

function errorEmbed(title, description) {
  return new EmbedBuilder()
    .setColor(0xED4245)
    .setTitle(title)
    .setDescription(description)
    .setTimestamp();
}

function infoEmbed(title, description) {
  return new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle(title)
    .setDescription(description)
    .setTimestamp();
}

module.exports = { successEmbed, errorEmbed, infoEmbed };
