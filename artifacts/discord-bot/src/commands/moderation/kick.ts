import { Message } from "discord.js";
import { embed, errorEmbed, sendLog, logAction } from "../../utils.js";

export default {
  name: "kick",
  description: "Kick a user",
  usage: ",kick @user [reason]",
  async execute(message: Message, args: string[]) {
    if (!message.member?.permissions.has("KickMembers")) {
      return message.reply({ embeds: [errorEmbed("You don't have permission to kick members.")] });
    }
    const target = message.mentions.members?.first();
    if (!target) return message.reply({ embeds: [errorEmbed("Please mention a user to kick.")] });
    if (!target.kickable) return message.reply({ embeds: [errorEmbed("I cannot kick this user.")] });

    const reason = args.slice(1).join(" ") || "No reason provided";

    try {
      await target.send({ embeds: [embed("👢 You have been kicked", `**Server:** ${message.guild!.name}\n**Reason:** ${reason}`)] });
    } catch {}

    await target.kick(reason);
    logAction(message.guild!.id, "kick", target.id, message.author.id, reason);

    const e = embed("👢 User Kicked")
      .addFields(
        { name: "User", value: `${target.user.tag} (${target.id})`, inline: true },
        { name: "Moderator", value: message.author.tag, inline: true },
        { name: "Reason", value: reason }
      ).setTimestamp();

    await message.reply({ embeds: [e] });
    await sendLog(message.guild!, e);
  },
};
