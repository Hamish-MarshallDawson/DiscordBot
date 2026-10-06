const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const { addCoins, getBalance } = require('../../utils/economy');
const { successEmbed, errorEmbed, infoEmbed } = require('../../utils/embeds');

function decodeHtmlEntities(text) {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&ntilde;/g, 'ñ')
    .replace(/&eacute;/g, 'é')
    .replace(/&rsquo;/g, '’')
    .replace(/&lsquo;/g, '‘')
    .replace(/&rdquo;/g, '”')
    .replace(/&ldquo;/g, '“')
    .replace(/&hellip;/g, '…')
    .replace(/&shy;/g, '­')
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(Number(num)));
}

function shuffleArray(arr) {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('trivia')
    .setDescription('Answer a trivia question to win coins!'),
  cooldown: 5,
  async execute(interaction) {
    await interaction.deferReply();

    let data;
    try {
      const response = await fetch('https://opentdb.com/api.php?amount=1&type=multiple');
      data = await response.json();
    } catch {
      return interaction.editReply({
        embeds: [errorEmbed('Trivia Error', 'Failed to fetch a trivia question. Please try again later.')],
      });
    }

    if (!data.results || data.results.length === 0) {
      return interaction.editReply({
        embeds: [errorEmbed('Trivia Error', 'No trivia questions available. Please try again later.')],
      });
    }

    const question = data.results[0];
    const correctAnswer = decodeHtmlEntities(question.correct_answer);
    const incorrectAnswers = question.incorrect_answers.map(decodeHtmlEntities);
    const allAnswers = shuffleArray([correctAnswer, ...incorrectAnswers]);
    const correctIndex = allAnswers.indexOf(correctAnswer);

    const labels = ['A', 'B', 'C', 'D'];
    const difficultyColors = { easy: '\u{1F7E2}', medium: '\u{1F7E1}', hard: '\u{1F534}' };
    const diffEmoji = difficultyColors[question.difficulty] || '\u{1F535}';

    const questionEmbed = infoEmbed(
      '\u{2753} Trivia Time!',
      `**Category:** ${decodeHtmlEntities(question.category)}\n**Difficulty:** ${diffEmoji} ${question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}\n\n**${decodeHtmlEntities(question.question)}**\n\n${allAnswers.map((a, i) => `**${labels[i]}.** ${a}`).join('\n')}`
    );

    const row = new ActionRowBuilder().addComponents(
      allAnswers.map((answer, i) =>
        new ButtonBuilder()
          .setCustomId(`trivia_${correctIndex}_${i}`)
          .setLabel(`${labels[i]}: ${answer.substring(0, 72)}`)
          .setStyle(ButtonStyle.Primary)
      )
    );

    const message = await interaction.editReply({ embeds: [questionEmbed], components: [row] });

    const collector = message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      filter: (i) => i.user.id === interaction.user.id,
      time: 15_000,
      max: 1,
    });

    collector.on('collect', async (i) => {
      const [, correctIdx, chosenIdx] = i.customId.split('_');
      const isCorrect = correctIdx === chosenIdx;

      const disabledRow = new ActionRowBuilder().addComponents(
        allAnswers.map((answer, idx) => {
          const btn = new ButtonBuilder()
            .setCustomId(`trivia_${correctIndex}_${idx}`)
            .setLabel(`${labels[idx]}: ${answer.substring(0, 72)}`)
            .setDisabled(true);

          if (idx === correctIndex) {
            btn.setStyle(ButtonStyle.Success);
          } else if (idx === Number(chosenIdx) && !isCorrect) {
            btn.setStyle(ButtonStyle.Danger);
          } else {
            btn.setStyle(ButtonStyle.Secondary);
          }
          return btn;
        })
      );

      if (isCorrect) {
        const reward = 50;
        addCoins(interaction.user.id, reward);
        const newBalance = getBalance(interaction.user.id);
        await i.update({
          embeds: [successEmbed('✅ Correct!', `You earned \u{1FA99} **${reward}** coins!\n\nYour balance: \u{1FA99} **${newBalance.toLocaleString()}** coins`)],
          components: [disabledRow],
        });
      } else {
        await i.update({
          embeds: [errorEmbed('❌ Incorrect!', `The correct answer was: **${labels[correctIndex]}. ${correctAnswer}**`)],
          components: [disabledRow],
        });
      }
    });

    collector.on('end', async (collected) => {
      if (collected.size === 0) {
        const disabledRow = new ActionRowBuilder().addComponents(
          allAnswers.map((answer, idx) => {
            const btn = new ButtonBuilder()
              .setCustomId(`trivia_${correctIndex}_${idx}`)
              .setLabel(`${labels[idx]}: ${answer.substring(0, 72)}`)
              .setDisabled(true);

            if (idx === correctIndex) {
              btn.setStyle(ButtonStyle.Success);
            } else {
              btn.setStyle(ButtonStyle.Secondary);
            }
            return btn;
          })
        );

        try {
          await interaction.editReply({
            embeds: [errorEmbed('⏰ Time\'s Up!', `You didn\'t answer in time!\nThe correct answer was: **${labels[correctIndex]}. ${correctAnswer}**`)],
            components: [disabledRow],
          });
        } catch {
          // Message may have been deleted
        }
      }
    });
  },
};
