const STEAM_API_KEY = process.env.STEAM_API_KEY;

async function getPlayerSummary(steamId) {
  try {
    const url = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${STEAM_API_KEY}&steamids=${steamId}`;
    const response = await fetch(url);
    const data = await response.json();
    const players = data?.response?.players;
    return players && players.length > 0 ? players[0] : null;
  } catch (error) {
    console.error('Error fetching player summary:', error);
    return null;
  }
}

async function getOwnedGames(steamId) {
  try {
    const url = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${STEAM_API_KEY}&steamid=${steamId}&include_appinfo=true&include_played_free_games=true&format=json`;
    const response = await fetch(url);
    const data = await response.json();
    return data?.response?.games || [];
  } catch (error) {
    console.error('Error fetching owned games:', error);
    return null;
  }
}

async function getRecentGames(steamId) {
  try {
    const url = `https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v0001/?key=${STEAM_API_KEY}&steamid=${steamId}&format=json`;
    const response = await fetch(url);
    const data = await response.json();
    return data?.response?.games || [];
  } catch (error) {
    console.error('Error fetching recent games:', error);
    return null;
  }
}

module.exports = { getPlayerSummary, getOwnedGames, getRecentGames };
