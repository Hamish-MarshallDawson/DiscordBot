# Discord Bot

A feature-rich Discord server bot built with [discord.js](https://discord.js.org/) v14. Includes message roasting, Steam stats, mini-games with an economy system, and moderation tools.

## Features

### 🔥 Message Roasting
Target a user and the bot auto-replies to their messages in a transformed style:
- **UwU** — hewwo, dis is uwu speak OwO
- **Sarcasm** — aLtErNaTiNg CaPs
- **Pirate** — Arrr! Ahoy matey, ye scallywag!
- **Shakespeare** — Forsooth, thou art most eloquent
- **Baby** — goo goo, pwease talk wittle
- **Fancy** — Indubitably, this is simply magnificent. Good day!
- **Yoda** — The store today, I am going to

### 🎮 Steam Integration
- `/steam link <steamid>` — Link your Discord account to a Steam64 ID
- `/steam stats [user] [game]` — View top games by playtime or filter by game
- `/steam compare <user1> <user2>` — Compare game libraries side-by-side

### 🎲 Mini-Games & Economy
- `/daily` — Claim 100 coins every 24 hours
- `/balance [user]` — Check coin balance
- `/leaderboard` — Top 10 richest users
- `/coinflip [bet]` — Flip a coin, optionally wager coins (2x payout)
- `/slots [bet]` — Slot machine with 🍒🍋🔔💎7️⃣ (up to 50x payout)
- `/trivia` — Multiple-choice trivia with buttons (50 coins for correct answer)
- `/rps <opponent>` — Rock Paper Scissors challenge with buttons

### 🛡️ Moderation
- `/kick <user> [reason]` — Kick a member
- `/ban <user> [reason]` — Ban a member
- `/timeout <user> <duration> [reason]` — Timeout (e.g., `10m`, `1h`, `1d`)
- `/warn <user> <reason>` — Issue a warning (stored in database)
- `/warnings <user>` — View all warnings for a user
- `/clearwarnings <user>` — Clear all warnings
- `/purge <count>` — Bulk delete up to 100 messages

All mod actions post to a configurable mod log channel and attempt to DM the target user.

### 🛠️ Utility
- `/ping` — Pong!
- `/user` — Your username and join date
- `/server` — Server name and member count
- `/sus` — Sus
- `/malady` — *tips fedora*

## Setup

### Prerequisites
- [Node.js](https://nodejs.org/) v18 or later
- A [Discord bot application](https://discord.com/developers/applications)
- Build tools for native modules (`build-essential` and `python3` on Linux)

### Installation

```bash
git clone https://github.com/Hamish-MarshallDawson/DiscordBot.git
cd DiscordBot
npm install
```

### Configuration

1. Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

```env
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_client_id_here
GUILD_ID=your_guild_id_here
STEAM_API_KEY=your_steam_api_key_here          # Get from https://steamcommunity.com/dev/apikey
MOD_LOG_CHANNEL_ID=your_mod_log_channel_id_here # Channel for mod action logs
```

2. **Enable Privileged Intents** in the [Discord Developer Portal](https://discord.com/developers/applications):
   - Go to your application → Bot → Privileged Gateway Intents
   - Enable **Message Content Intent**
   - Enable **Server Members Intent**

### Running

```bash
# Register slash commands with Discord (run once, and after adding new commands)
npm run deploy

# Start the bot
npm start

# Development mode (auto-restart on file changes)
npm run dev
```

## Project Structure

```
├── index.js              # Entry point — loads commands, events, database
├── deploy-commands.js    # Registers slash commands with Discord API
├── database.js           # SQLite database setup (better-sqlite3)
├── commands/
│   ├── fun/              # Roast commands
│   ├── games/            # Economy and mini-game commands
│   ├── moderation/       # Kick, ban, timeout, warn, purge
│   ├── steam/            # Steam integration
│   └── utility/          # Ping, user, server, etc.
├── events/
│   ├── ready.js          # Bot startup
│   ├── interactionCreate.js  # Slash command + cooldown handling
│   └── messageCreate.js      # Roast system listener
├── utils/
│   ├── embeds.js         # Embed builder helpers
│   ├── economy.js        # Coin balance operations
│   ├── modlog.js         # Mod action log poster
│   ├── steam-api.js      # Steam Web API wrapper
│   └── transformers.js   # Text transformation functions
└── data/
    └── bot.db            # SQLite database (auto-created)
```

## Tech Stack

- **discord.js** v14 — Discord API wrapper
- **better-sqlite3** — Persistent SQLite database (no external server needed)
- **dotenv** — Environment variable management
- **Open Trivia DB** — Free trivia question API
- **Steam Web API** — Game stats and profile data
