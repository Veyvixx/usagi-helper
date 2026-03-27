import { Client, ActivityType } from "discord.js";
import { GUILD_ID } from "../config.js";

export default {
  name: "clientReady",
  once: true,
  async execute(client: Client) {
    console.log(`[Bot] Logged in as ${client.user?.tag}`);

    // Leave any guild that isn't the configured one
    for (const [id, guild] of client.guilds.cache) {
      if (id !== GUILD_ID) {
        console.log(`[Bot] Leaving unauthorized guild: ${guild.name} (${id})`);
        await guild.leave().catch(() => {});
      }
    }

    client.user?.setPresence({
      activities: [{ name: "your smile <3", type: ActivityType.Watching }],
      status: "online",
    });

    console.log(`[Bot] Locked to guild ${GUILD_ID}`);
  },
};
