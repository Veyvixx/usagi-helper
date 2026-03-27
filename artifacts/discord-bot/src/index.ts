import { Client, GatewayIntentBits, Partials, Collection } from "discord.js";
import { loadCommands } from "./handlers/commandHandler.js";
import { loadEvents } from "./handlers/eventHandler.js";
import { initDb } from "./db.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildVoiceStates,
  ],
  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.Reaction,
    Partials.GuildMember,
    Partials.User,
  ],
});

(client as any).commands = new Collection();

initDb();
loadCommands(client);
loadEvents(client);

const token = process.env.DISCORD_TOKEN;
if (!token) throw new Error("DISCORD_TOKEN environment variable is not set.");

client.login(token);
