import { Message, TextChannel } from "discord.js";
import { embed, errorEmbed, sendLog } from "../../utils.js";

export default {
  name: "topic",
  description: "Set the channel topic",
  usage: ",topic [new topic text]",
  async execute(message: Message, args: string[]) {
    if (!message.member?.permissions.has("ManageChannels")) {
      return message.reply({ embeds: [errorEmbed("You don't have permission to manage channels.")] });
    }
    const channel = message.channel as TextChannel;
    const topic = args.join(" ");

    await channel.setTopic(topic || null);

    const e = embed("📝 Channel Topic Updated")
      .addFields(
        { name: "Channel", value: `<#${channel.id}>`, inline: true },
        { name: "Topic", value: topic || "*cleared*" }
      ).setTimestamp();

    await message.reply({ embeds: [e] });
    await sendLog(message.guild!, e);
  },
};
