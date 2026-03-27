import { Message } from "discord.js";
import { embed, errorEmbed, sendLog, logAction } from "../../utils.js";

export default {
  name: "unban",
  description: "Unban a user by ID",
  usage: ",unban <userId> [reason]",
  async execute(message: Message, args: string[]) {
    if (!message.member?.permissions.has("BanMembers")) {
      return message.reply({ embeds: [errorEmbed("You don't have permission to unban members.")] });
    }
    const userId = args[0];
    if (!userId) return message.reply({ embeds: [errorEmbed("Please provide a user ID.")] });
    const reason = args.slice(1).join(" ") || "No reason provided";

    try {
      await message.guild!.members.unban(userId, reason);
      logAction(message.guild!.id, "unban", userId, message.author.id, reason);

      const e = embed("✅ User Unbanned")
        .addFields(
          { name: "User ID", value: userId, inline: true },
          { name: "Moderator", value: message.author.tag, inline: true },
          { name: "Reason", value: reason }
        ).setTimestamp();

      await message.reply({ embeds: [e] });
      await sendLog(message.guild!, e);
    } catch {
      await message.reply({ embeds: [errorEmbed("Could not find that user in the ban list.")] });
    }
  },
};
