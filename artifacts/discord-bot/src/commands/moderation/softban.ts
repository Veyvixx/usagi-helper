import { Message } from "discord.js";
import { embed, errorEmbed, sendLog, logAction } from "../../utils.js";

export default {
  name: "softban",
  description: "Ban and immediately unban to wipe messages",
  usage: ",softban @user [reason]",
  async execute(message: Message, args: string[]) {
    if (!message.member?.permissions.has("BanMembers")) {
      return message.reply({ embeds: [errorEmbed("You don't have permission to ban members.")] });
    }
    const target = message.mentions.members?.first();
    if (!target) return message.reply({ embeds: [errorEmbed("Please mention a user.")] });
    if (!target.bannable) return message.reply({ embeds: [errorEmbed("I cannot ban this user.")] });

    const reason = args.slice(1).join(" ") || "No reason provided";

    try {
      await target.send({ embeds: [embed("🧹 You have been softbanned", `**Server:** ${message.guild!.name}\n**Reason:** ${reason}\nYour messages were wiped but you may rejoin.`)] });
    } catch {}

    await target.ban({ reason, deleteMessageSeconds: 604800 });
    await message.guild!.members.unban(target.id, "Softban unban");
    logAction(message.guild!.id, "softban", target.id, message.author.id, reason);

    const e = embed("🧹 User Softbanned")
      .addFields(
        { name: "User", value: `${target.user.tag} (${target.id})`, inline: true },
        { name: "Moderator", value: message.author.tag, inline: true },
        { name: "Reason", value: reason }
      ).setTimestamp();

    await message.reply({ embeds: [e] });
    await sendLog(message.guild!, e);
  },
};
