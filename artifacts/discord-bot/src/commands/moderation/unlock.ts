import { Message, TextChannel } from "discord.js";
import { embed, errorEmbed, sendLog } from "../../utils.js";

export default {
  name: "unlock",
  description: "Unlock a specific channel",
  usage: ",unlock #channel",
  async execute(message: Message, args: string[]) {
    if (!message.member?.permissions.has("ManageChannels")) {
      return message.reply({ embeds: [errorEmbed("You don't have permission to manage channels.")] });
    }
    const channel = (message.mentions.channels.first() ?? message.channel) as TextChannel;

    await channel.permissionOverwrites.edit(message.guild!.id, {
      SendMessages: null,
    });

    const e = embed("🔓 Channel Unlocked", `<#${channel.id}> has been unlocked.`)
      .addFields({ name: "Moderator", value: message.author.tag, inline: true })
      .setTimestamp();

    await message.reply({ embeds: [e] });
    await sendLog(message.guild!, e);
  },
};
