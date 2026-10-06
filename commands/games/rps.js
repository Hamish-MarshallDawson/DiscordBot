const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const { successEmbed, errorEmbed, infoEmbed } = require('../../utils/embeds');

const choices = new Map([
  ['rock', { emoji: '\u{1FAA8}', beats: 'scissors' }],
  ['paper', { emoji: '\u{1F4C4}', beats: 'rock' }],
  ['scissors', { emoji: '✂️', beats: 'paper' }],
]);

function determineWinner(choice1, choice2) {
  if (choice1 === choice2) return 'tie';
  if (choices.get(choice1).beats === choice2) return 'player1';
  return 'player2';
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rps')
    .setDescription('Challenge someone to Rock Paper Scissors!')
    .addUserOption(option =>
      option
        .setName('opponent')
        .setDescription('The user to challenge')
        .setRequired(true)),
  cooldown: 5,
  async execute(interaction) {
    const opponent = interaction.options.getUser('opponent');
    const challenger = interaction.user;

    if (opponent.bot) {
      return interaction.reply({
        embeds: [errorEmbed('Invalid Opponent', 'You can\'t challenge a bot!')],
        ephemeral: true,
      });
    }

    if (opponent.id === challenger.id) {
      return interaction.reply({
        embeds: [errorEmbed('Invalid Opponent', 'You can\'t challenge yourself!')],
        ephemeral: true,
      });
    }

    const challengeEmbed = infoEmbed(
      '\u{1FAA8} Rock Paper Scissors!',
      `<@${challenger.id}> challenges <@${opponent.id}> to Rock Paper Scissors!\n\nBoth players, click a button to make your choice!`
    );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`rps_${interaction.id}_rock`)
        .setLabel('Rock')
        .setEmoji('\u{1FAA8}')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`rps_${interaction.id}_paper`)
        .setLabel('Paper')
        .setEmoji('\u{1F4C4}')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`rps_${interaction.id}_scissors`)
        .setLabel('Scissors')
        .setEmoji('✂️')
        .setStyle(ButtonStyle.Primary),
    );

    const message = await interaction.reply({ embeds: [challengeEmbed], components: [row], fetchReply: true });

    const playerChoices = {};

    const collector = message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      filter: (i) => i.user.id === challenger.id || i.user.id === opponent.id,
      time: 30_000,
    });

    collector.on('collect', async (i) => {
      const choice = i.customId.split('_').pop();

      if (playerChoices[i.user.id]) {
        return i.reply({ content: 'You\'ve already made your choice!', ephemeral: true });
      }

      playerChoices[i.user.id] = choice;
      await i.reply({ content: `You chose ${choices.get(choice).emoji} **${choice.charAt(0).toUpperCase() + choice.slice(1)}**!`, ephemeral: true });

      if (playerChoices[challenger.id] && playerChoices[opponent.id]) {
        collector.stop('complete');
      }
    });

    collector.on('end', async (_, reason) => {
      const disabledRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`rps_${interaction.id}_rock`)
          .setLabel('Rock')
          .setEmoji('\u{1FAA8}')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId(`rps_${interaction.id}_paper`)
          .setLabel('Paper')
          .setEmoji('\u{1F4C4}')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId(`rps_${interaction.id}_scissors`)
          .setLabel('Scissors')
          .setEmoji('✂️')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true),
      );

      if (reason !== 'complete' || !playerChoices[challenger.id] || !playerChoices[opponent.id]) {
        try {
          await interaction.editReply({
            embeds: [errorEmbed('\u{1FAA8} Challenge Expired', 'The Rock Paper Scissors challenge expired because not everyone chose in time.')],
            components: [disabledRow],
          });
        } catch {
          // Message may have been deleted
        }
        return;
      }

      const challengerChoice = playerChoices[challenger.id];
      const opponentChoice = playerChoices[opponent.id];
      const result = determineWinner(challengerChoice, opponentChoice);

      const challengerEmoji = choices.get(challengerChoice).emoji;
      const opponentEmoji = choices.get(opponentChoice).emoji;

      let resultEmbed;
      if (result === 'tie') {
        resultEmbed = infoEmbed(
          '\u{1FAA8} It\'s a Tie!',
          `${challengerEmoji} vs ${opponentEmoji}\n\n<@${challenger.id}> and <@${opponent.id}> both chose **${challengerChoice}**!`
        );
      } else if (result === 'player1') {
        resultEmbed = successEmbed(
          '\u{1FAA8} We Have a Winner!',
          `${challengerEmoji} vs ${opponentEmoji}\n\n<@${challenger.id}> wins with **${challengerChoice}** against <@${opponent.id}>'s **${opponentChoice}**!`
        );
      } else {
        resultEmbed = successEmbed(
          '\u{1FAA8} We Have a Winner!',
          `${challengerEmoji} vs ${opponentEmoji}\n\n<@${opponent.id}> wins with **${opponentChoice}** against <@${challenger.id}>'s **${challengerChoice}**!`
        );
      }

      try {
        await interaction.editReply({ embeds: [resultEmbed], components: [disabledRow] });
      } catch {
        // Message may have been deleted
      }
    });
  },
};
