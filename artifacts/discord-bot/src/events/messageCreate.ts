import { Client, Message } from "discord.js";
import { PREFIX, GUILD_ID } from "../config.js";
import { getConfig, ensureConfig } from "../utils.js";
import { handleModmail } from "../modmail.js";

export default {
  name: "messageCreate",
  async execute(message: Message, client: Client) {
    if (message.author.bot) return;

    // DM → ModMail
    if (!message.guild) {
      await handleModmail(message, client);
      return;
    }

    if (message.guild.id !== GUILD_ID) return;

    ensureConfig(message.guild.id);
    const config = getConfig(message.guild.id);
    const prefix = config?.prefix ?? PREFIX;

    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/\s+/);
    const commandName = args.shift()?.toLowerCase();
    if (!commandName) return;

    const command = (client as any).commands.get(commandName);
    if (!command) return;

    try {
      await command.execute(message, args, client);
    } catch (err) {
      console.error(err);
      message.reply({ content: "An error occurred running that command." }).catch(() => {});
    }
  },
};
