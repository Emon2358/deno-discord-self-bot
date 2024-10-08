# Discord deno selfBot

This Discord bot is a simple yet powerful tool designed to interact with Discord servers and channels. It's built using Deno and provides various functionalities such as server information retrieval, message sending, and status updates.

## Features

- Login to Discord using email and password
- Set bot status (online, idle, dnd, invisible)
- Send messages to specified channels
- Retrieve server information
- Respond to various commands:
  - `!ping`: Display uptime
  - `!xlost`: Send a special message
  - `!server <serverID>`: Display detailed server information
  - `!say <message>`: Echo the given message
  - `!help`: List available commands

## Prerequisites

- [Deno](https://deno.land/) installed on your system

## Usage

1. Clone this repository
2. Run the script using Deno:

   ```
   deno run --allow-net --allow-read --allow-env main.ts
   ```

3. When prompted, enter your Discord email, password, and the target channel ID

## Commands

- `!ping`: Displays the bot's uptime
- `!xlost`: Sends a predefined special message
- `!server <serverID>`: Retrieves and displays detailed information about the specified server
- `!say <message>`: Echoes the given message in the channel
- `!help`: Lists all available commands

## Security Notice

This bot uses email and password for authentication, which is not recommended for production use. It's advisable to use bot tokens instead for enhanced security.

## Disclaimer

This bot is for educational purposes only. Be sure to comply with Discord's Terms of Service and API usage guidelines when using this bot.

## Contributing

Contributions, issues, and feature requests are welcome. Feel free to check issues page if you want to contribute.

## License

[MIT](https://choosealicense.com/licenses/mit/)
