import { Message } from "discord.js";
import { embed, errorEmbed, sendLog, logAction, parseDuration, formatDuration } from "../../utils.js";

export default {
  name: "timeout",
  description: "Temporarily timeout a user",
  usage: ",timeout @user 10m [reason]",
  async execute(message: Message, args: string[]) {
    if (!message.member?.permissions.has("ModerateMembers")) {
      return message.reply({ embeds: [errorEmbed("You don't have permission to timeout members.")] });
    }
    const target = message.mentions.members?.first();
    if (!target) return message.reply({ embeds: [errorEmbed("Please mention a user.")] });

    const durationStr = args[1];
    const duration = parseDuration(durationStr);
    if (!duration) return message.reply({ embeds: [errorEmbed("Invalid duration. Use format like `10m`, `1h`, `2d`.")] });

    const reason = args.slice(2).join(" ") || "No reason provided";

    await target.timeout(duration, reason);
    logAction(message.guild!.id, "timeout", target.id, message.author.id, reason, formatDuration(duration));

    const e = embed("⏱️ User Timed Out")
      .addFields(
        { name: "User", value: `${target.user.tag} (${target.id})`, inline: true },
        { name: "Moderator", value: message.author.tag, inline: true },
        { name: "Duration", value: formatDuration(duration), inline: true },
        { name: "Reason", value: reason }
      ).setTimestamp();

    await message.reply({ embeds: [e] });
    await sendLog(message.guild!, e);
  },
};
