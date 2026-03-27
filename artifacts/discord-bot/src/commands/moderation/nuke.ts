import { Message, TextChannel } from "discord.js";
import { embed, errorEmbed, sendLog } from "../../utils.js";

export default {
  name: "nuke",
  description: "Clone and wipe a channel",
  usage: ",nuke #channel",
  async execute(message: Message, args: string[]) {
    if (!message.member?.permissions.has("ManageChannels")) {
      return message.reply({ embeds: [errorEmbed("You don't have permission to manage channels.")] });
    }
    const channel = (message.mentions.channels.first() ?? message.channel) as TextChannel;

    const cloned = await channel.clone({ reason: `Nuke by ${message.author.tag}` });
    await cloned.setPosition(channel.position);
    await channel.delete();

    const e = embed("💥 Channel Nuked", `${channel.name} has been wiped and recreated as <#${cloned.id}>.`)
      .addFields({ name: "Moderator", value: message.author.tag, inline: true })
      .setTimestamp();

    await cloned.send({ embeds: [e] });
    await sendLog(message.guild!, e);
  },
};
