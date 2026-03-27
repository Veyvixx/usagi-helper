import { Client, Message, PartialMessage } from "discord.js";
import { embed, sendLog } from "../utils.js";
import { GUILD_ID } from "../config.js";

export default {
  name: "messageDelete",
  async execute(msg: Message | PartialMessage, client: Client) {
    if (msg.author?.bot) return;
    if (!msg.guild) return;
    if (msg.guild.id !== GUILD_ID) return;

    const e = embed("🗑️ Message Deleted")
      .addFields(
        { name: "Author", value: `${msg.author?.tag ?? "Unknown"} (${msg.author?.id ?? "?"})`, inline: true },
        { name: "Channel", value: `<#${msg.channelId}>`, inline: true },
        { name: "Content", value: msg.content?.slice(0, 1024) || "*empty / unknown*" },
      )
      .setTimestamp();
    await sendLog(msg.guild, e);
  },
};
