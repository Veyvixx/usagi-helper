import { Client, Guild } from "discord.js";
import { GUILD_ID } from "../config.js";

export default {
  name: "guildCreate",
  async execute(guild: Guild, client: Client) {
    if (guild.id !== GUILD_ID) {
      console.log(`[Bot] Auto-leaving unauthorized guild: ${guild.name} (${guild.id})`);
      await guild.leave().catch(() => {});
    }
  },
};
