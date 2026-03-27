import { Message, TextChannel } from "discord.js";
import { embed, errorEmbed, sendLog, parseDuration } from "../../utils.js";

export default {
  name: "slowmode",
  description: "Set channel slowmode",
  usage: ",slowmode 10s  OR  ,slowmode 0",
  async execute(message: Message, args: string[]) {
    if (!message.member?.permissions.has("ManageChannels")) {
      return message.reply({ embeds: [errorEmbed("You don't have permission to manage channels.")] });
    }
    const channel = message.channel as TextChannel;
    const input = args[0];
    if (!input) return message.reply({ embeds: [errorEmbed("Please provide a duration (e.g. `10s`) or `0` to disable.")] });

    let seconds = 0;
    if (input === "0") {
      seconds = 0;
    } else {
      const ms = parseDuration(input);
      if (!ms) return message.reply({ embeds: [errorEmbed("Invalid duration. Use `10s`, `1m`, etc.")] });
      seconds = ms / 1000;
    }

    await channel.setRateLimitPerUser(seconds);

    const e = embed("🐌 Slowmode Updated")
      .addFields(
        { name: "Channel", value: `<#${channel.id}>`, inline: true },
        { name: "Slowmode", value: seconds === 0 ? "Disabled" : `${seconds}s`, inline: true },
        { name: "Moderator", value: message.author.tag, inline: true }
      ).setTimestamp();

    await message.reply({ embeds: [e] });
    await sendLog(message.guild!, e);
  },
};
