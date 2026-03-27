import { Message } from "discord.js";
import { embed, errorEmbed, sendLog, logAction, parseDuration, formatDuration } from "../../utils.js";
import { getDb } from "../../db.js";

export default {
  name: "tempban",
  description: "Temporarily ban a user",
  usage: ",tempban @user 2d [reason]",
  async execute(message: Message, args: string[]) {
    if (!message.member?.permissions.has("BanMembers")) {
      return message.reply({ embeds: [errorEmbed("You don't have permission to ban members.")] });
    }
    const target = message.mentions.members?.first();
    if (!target) return message.reply({ embeds: [errorEmbed("Please mention a user.")] });
    if (!target.bannable) return message.reply({ embeds: [errorEmbed("I cannot ban this user.")] });

    const durationStr = args[1];
    const duration = parseDuration(durationStr);
    if (!duration) return message.reply({ embeds: [errorEmbed("Invalid duration. Use format like `2d`, `1h`, `30m`.")] });

    const reason = args.slice(2).join(" ") || "No reason provided";
    const expiresAt = Date.now() + duration;

    try {
      await target.send({ embeds: [embed("⏱️ You have been temporarily banned", `**Server:** ${message.guild!.name}\n**Duration:** ${formatDuration(duration)}\n**Reason:** ${reason}`)] });
    } catch {}

    await target.ban({ reason });
    const db = getDb();
    db.prepare("INSERT OR REPLACE INTO temp_bans (guild_id, user_id, expires_at) VALUES (?, ?, ?)")
      .run(message.guild!.id, target.id, Math.floor(expiresAt / 1000));
    logAction(message.guild!.id, "tempban", target.id, message.author.id, reason, formatDuration(duration));

    const e = embed("⏱️ User Temp-Banned")
      .addFields(
        { name: "User", value: `${target.user.tag} (${target.id})`, inline: true },
        { name: "Moderator", value: message.author.tag, inline: true },
        { name: "Duration", value: formatDuration(duration), inline: true },
        { name: "Expires", value: `<t:${Math.floor(expiresAt / 1000)}:R>`, inline: true },
        { name: "Reason", value: reason }
      ).setTimestamp();

    await message.reply({ embeds: [e] });
    await sendLog(message.guild!, e);

    setTimeout(async () => {
      try {
        await message.guild!.members.unban(target.id, "Temp ban expired");
        db.prepare("DELETE FROM temp_bans WHERE guild_id = ? AND user_id = ?").run(message.guild!.id, target.id);
      } catch {}
    }, duration);
  },
};
