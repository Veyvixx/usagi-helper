import { Client, Message, PartialMessage } from "discord.js";
import { embed, sendLog } from "../utils.js";
import { GUILD_ID } from "../config.js";

export default {
  name: "messageUpdate",
  async execute(oldMsg: Message | PartialMessage, newMsg: Message | PartialMessage, client: Client) {
    if (oldMsg.author?.bot) return;
    if (!oldMsg.guild) return;
    if (oldMsg.guild.id !== GUILD_ID) return;
    if (oldMsg.content === newMsg.content) return;

    const e = embed("✏️ Message Edited")
      .addFields(
        { name: "Author", value: `${oldMsg.author?.tag ?? "Unknown"} (${oldMsg.author?.id})`, inline: true },
        { name: "Channel", value: `<#${oldMsg.channelId}>`, inline: true },
        { name: "Before", value: (oldMsg.content?.slice(0, 1024)) || "*empty*" },
        { name: "After", value: (newMsg.content?.slice(0, 1024)) || "*empty*" },
      )
      .setTimestamp();
    await sendLog(oldMsg.guild, e);
  },
};
