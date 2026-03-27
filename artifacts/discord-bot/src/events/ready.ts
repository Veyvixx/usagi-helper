import { Client, ActivityType } from "discord.js";
import { BOT_NAME } from "../config.js";

export default {
  name: "clientReady",
  once: true,
  async execute(client: Client) {
    console.log(`[Bot] Logged in as ${client.user?.tag}`);
    client.user?.setPresence({
      activities: [{ name: "your server 👀", type: ActivityType.Watching }],
      status: "online",
    });
  },
};
