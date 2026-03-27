import { Message } from "discord.js";
import { embed, errorEmbed, successEmbed, sendLog, logAction } from "../../utils.js";
import { getDb } from "../../db.js";

export default {
  name: "warn",
  description: "Warn a user",
  usage: ",warn @user [reason]",
  async execute(message: Message, args: string[]) {
    if (!message.member?.permissions.has("ModerateMembers")) {
      return message.reply({ embeds: [errorEmbed("You don't have permission to warn members.")] });
    }
    const target = message.mentions.members?.first();
    if (!target) return message.reply({ embeds: [errorEmbed("Please mention a user to warn.")] });
    const reason = args.slice(1).join(" ") || "No reason provided";

    const db = getDb();
    db.prepare("INSERT INTO warnings (guild_id, user_id, moderator_id, reason) VALUES (?, ?, ?, ?)")
      .run(message.guild!.id, target.id, message.author.id, reason);

    const warnCount = (db.prepare("SELECT COUNT(*) as c FROM warnings WHERE guild_id = ? AND user_id = ?")
      .get(message.guild!.id, target.id) as any).c;

    logAction(message.guild!.id, "warn", target.id, message.author.id, reason);

    const e = embed("⚠️ User Warned")
      .addFields(
        { name: "User", value: `${target.user.tag} (${target.id})`, inline: true },
        { name: "Moderator", value: `${message.author.tag}`, inline: true },
        { name: "Reason", value: reason },
        { name: "Total Warnings", value: `${warnCount}`, inline: true }
      )
      .setTimestamp();

    await message.reply({ embeds: [e] });
    await sendLog(message.guild!, e);

    try {
      await target.send({ embeds: [embed("⚠️ You have been warned", `**Server:** ${message.guild!.name}\n**Reason:** ${reason}\n**Total warnings:** ${warnCount}`)] });
    } catch {}
  },
};
