const { SlashCommandBuilder } = require('discord.js');
const { db } = require('../../database');
const { successEmbed, errorEmbed, infoEmbed } = require('../../utils/embeds');
const { getPlayerSummary, getOwnedGames } = require('../../utils/steam-api');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('steam')
    .setDescription('Steam integration commands')
    .addSubcommand(sub =>
      sub
        .setName('link')
        .setDescription('Link your Steam account')
        .addStringOption(option =>
          option
            .setName('steamid')
            .setDescription('Your Steam64 ID')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('stats')
        .setDescription('View Steam game stats')
        .addUserOption(option =>
          option
            .setName('user')
            .setDescription('The user to look up (defaults to you)')
        )
        .addStringOption(option =>
          option
            .setName('game')
            .setDescription('Filter by game name')
        )
    )
    .addSubcommand(sub =>
      sub
        .setName('compare')
        .setDescription('Compare Steam libraries between two users')
        .addUserOption(option =>
          option
            .setName('user1')
            .setDescription('First user to compare')
            .setRequired(true)
        )
        .addUserOption(option =>
          option
            .setName('user2')
            .setDescription('Second user to compare')
            .setRequired(true)
        )
    ),
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'link') {
      await handleLink(interaction);
    } else if (subcommand === 'stats') {
      await handleStats(interaction);
    } else if (subcommand === 'compare') {
      await handleCompare(interaction);
    }
  },
};

async function handleLink(interaction) {
  const steamId = interaction.options.getString('steamid');

  await interaction.deferReply();

  const player = await getPlayerSummary(steamId);

  if (!player) {
    return interaction.editReply({
      embeds: [errorEmbed('Invalid Steam ID', 'Could not find a Steam profile with that ID. Make sure you are using your Steam64 ID.')],
    });
  }

  db.prepare(`
    INSERT OR REPLACE INTO steam_links (discord_id, steam_id, linked_at)
    VALUES (?, ?, unixepoch())
  `).run(interaction.user.id, steamId);

  const embed = successEmbed(
    'Steam Account Linked!',
    `Successfully linked to **${player.personaname}**`
  );
  embed.setThumbnail(player.avatarfull || player.avatar);

  await interaction.editReply({ embeds: [embed] });
}

async function handleStats(interaction) {
  const targetUser = interaction.options.getUser('user') || interaction.user;
  const gameFilter = interaction.options.getString('game');

  const link = db.prepare('SELECT steam_id FROM steam_links WHERE discord_id = ?').get(targetUser.id);

  if (!link) {
    return interaction.reply({
      embeds: [errorEmbed('Not Linked', `${targetUser} has not linked their Steam account. Use \`/steam link\` to link one.`)],
      ephemeral: true,
    });
  }

  await interaction.deferReply();

  const games = await getOwnedGames(link.steam_id);

  if (!games || games.length === 0) {
    return interaction.editReply({
      embeds: [errorEmbed('No Games Found', 'Could not retrieve game data. The profile may be private.')],
    });
  }

  if (gameFilter) {
    const filterLower = gameFilter.toLowerCase();
    const matched = games.filter(g => g.name.toLowerCase().includes(filterLower));

    if (matched.length === 0) {
      return interaction.editReply({
        embeds: [infoEmbed('No Match', `No games matching "${gameFilter}" found for ${targetUser}.`)],
      });
    }

    const sorted = matched.sort((a, b) => b.playtime_forever - a.playtime_forever);
    const top = sorted.slice(0, 10);
    const lines = top.map((g, i) =>
      `**${i + 1}.** ${g.name} - ${(g.playtime_forever / 60).toFixed(1)} hours`
    );

    const embed = infoEmbed(
      `Games matching "${gameFilter}"`,
      lines.join('\n')
    );
    embed.setFooter({ text: `Showing ${top.length} of ${matched.length} matching games for ${targetUser.username}` });

    return interaction.editReply({ embeds: [embed] });
  }

  // No game filter: show top 10 by playtime
  const sorted = games.sort((a, b) => b.playtime_forever - a.playtime_forever);
  const top = sorted.slice(0, 10);
  const lines = top.map((g, i) =>
    `**${i + 1}.** ${g.name} - ${(g.playtime_forever / 60).toFixed(1)} hours`
  );

  const embed = infoEmbed(
    `Top Games for ${targetUser.username}`,
    lines.join('\n')
  );
  embed.setFooter({ text: `${games.length} games owned` });

  await interaction.editReply({ embeds: [embed] });
}

async function handleCompare(interaction) {
  const user1 = interaction.options.getUser('user1');
  const user2 = interaction.options.getUser('user2');

  const link1 = db.prepare('SELECT steam_id FROM steam_links WHERE discord_id = ?').get(user1.id);
  const link2 = db.prepare('SELECT steam_id FROM steam_links WHERE discord_id = ?').get(user2.id);

  if (!link1 || !link2) {
    const missing = [];
    if (!link1) missing.push(user1.toString());
    if (!link2) missing.push(user2.toString());
    return interaction.reply({
      embeds: [errorEmbed('Not Linked', `The following user(s) have not linked their Steam account: ${missing.join(', ')}`)],
      ephemeral: true,
    });
  }

  await interaction.deferReply();

  const [games1, games2] = await Promise.all([
    getOwnedGames(link1.steam_id),
    getOwnedGames(link2.steam_id),
  ]);

  if (!games1 || !games2) {
    return interaction.editReply({
      embeds: [errorEmbed('Error', 'Could not retrieve game data. One or both profiles may be private.')],
    });
  }

  // Find common games by appid
  const games2Map = new Map(games2.map(g => [g.appid, g]));
  const common = [];

  for (const g1 of games1) {
    const g2 = games2Map.get(g1.appid);
    if (g2) {
      common.push({
        name: g1.name,
        user1Hours: (g1.playtime_forever / 60).toFixed(1),
        user2Hours: (g2.playtime_forever / 60).toFixed(1),
        combinedPlaytime: g1.playtime_forever + g2.playtime_forever,
      });
    }
  }

  if (common.length === 0) {
    return interaction.editReply({
      embeds: [infoEmbed('No Common Games', `${user1} and ${user2} don't share any games!`)],
    });
  }

  // Sort by combined playtime
  common.sort((a, b) => b.combinedPlaytime - a.combinedPlaytime);
  const top = common.slice(0, 10);

  const lines = top.map((g, i) =>
    `**${i + 1}.** ${g.name}\n   ${user1.username}: ${g.user1Hours}h | ${user2.username}: ${g.user2Hours}h`
  );

  const embed = infoEmbed(
    `${user1.username} vs ${user2.username}`,
    lines.join('\n')
  );
  embed.setFooter({ text: `${common.length} games in common` });

  await interaction.editReply({ embeds: [embed] });
}
