import { Message } from "discord.js";
import { embed, errorEmbed, sendLog, logAction } from "../../utils.js";

export default {
  name: "hardban",
  description: "Fully ban a user with message history deletion",
  usage: ",hardban @user [reason]",
  async execute(message: Message, args: string[]) {
    if (!message.member?.permissions.has("BanMembers")) {
      return message.reply({ embeds: [errorEmbed("You don't have permission to ban members.")] });
    }
    const target = message.mentions.members?.first();
    if (!target) return message.reply({ embeds: [errorEmbed("Please mention a user to ban.")] });
    if (!target.bannable) return message.reply({ embeds: [errorEmbed("I cannot ban this user.")] });

    const reason = args.slice(1).join(" ") || "No reason provided";

    try {
      await target.send({ embeds: [embed("🔨 You have been banned", `**Server:** ${message.guild!.name}\n**Reason:** ${reason}`)] });
    } catch {}

    await target.ban({ reason, deleteMessageSeconds: 604800 });
    logAction(message.guild!.id, "hardban", target.id, message.author.id, reason);

    const e = embed("🔨 User Banned")
      .addFields(
        { name: "User", value: `${target.user.tag} (${target.id})`, inline: true },
        { name: "Moderator", value: message.author.tag, inline: true },
        { name: "Reason", value: reason },
        { name: "Type", value: "Hard Ban (7d history deleted)" }
      ).setTimestamp();

    await message.reply({ embeds: [e] });
    await sendLog(message.guild!, e);
  },
};
