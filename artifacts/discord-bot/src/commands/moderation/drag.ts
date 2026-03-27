import { Message } from "discord.js";
import { embed, errorEmbed, sendLog } from "../../utils.js";

export default {
  name: "drag",
  description: "Move a user to another voice channel",
  usage: ",drag @user #voice-channel",
  async execute(message: Message, args: string[]) {
    if (!message.member?.permissions.has("MoveMembers")) {
      return message.reply({ embeds: [errorEmbed("You don't have permission to move members.")] });
    }
    const target = message.mentions.members?.first();
    if (!target) return message.reply({ embeds: [errorEmbed("Please mention a user.")] });
    if (!target.voice.channel) return message.reply({ embeds: [errorEmbed("That user is not in a voice channel.")] });

    const vcChannel = message.mentions.channels.first();
    if (!vcChannel || !vcChannel.isVoiceBased()) {
      return message.reply({ embeds: [errorEmbed("Please mention a voice channel.")] });
    }

    await target.voice.setChannel(vcChannel as any, `Dragged by ${message.author.tag}`);

    const e = embed("🎙️ User Dragged")
      .addFields(
        { name: "User", value: `${target.user.tag}`, inline: true },
        { name: "To", value: `<#${vcChannel.id}>`, inline: true },
        { name: "Moderator", value: message.author.tag, inline: true }
      ).setTimestamp();

    await message.reply({ embeds: [e] });
    await sendLog(message.guild!, e);
  },
};
