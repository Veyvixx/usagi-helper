import { Message } from "discord.js";
import { embed, errorEmbed, sendLog, logAction, parseDuration, formatDuration, getConfig } from "../../utils.js";
import { getDb } from "../../db.js";

export default {
  name: "mute",
  description: "Fully mute a user (requires mute role set up)",
  usage: ",mute @user 10m [reason]",
  async execute(message: Message, args: string[]) {
    if (!message.member?.permissions.has("ModerateMembers")) {
      return message.reply({ embeds: [errorEmbed("You don't have permission.")] });
    }
    const target = message.mentions.members?.first();
    if (!target) return message.reply({ embeds: [errorEmbed("Please mention a user.")] });

    const config = getConfig(message.guild!.id);
    const muteRoleId = config?.mute_role_id;
    if (!muteRoleId) return message.reply({ embeds: [errorEmbed("No mute role configured. Use `,setmuterole @role` first.")] });

    const durationStr = args[1];
    const duration = durationStr ? parseDuration(durationStr) : null;
    const reason = args.slice(duration !== null ? 2 : 1).join(" ") || "No reason provided";

    await target.roles.add(muteRoleId, reason);

    if (duration) {
      const db = getDb();
      db.prepare("INSERT OR REPLACE INTO timeouts (guild_id, user_id, expires_at) VALUES (?, ?, ?)")
        .run(message.guild!.id, target.id, Math.floor((Date.now() + duration) / 1000));

      setTimeout(async () => {
        try {
          await target.roles.remove(muteRoleId, "Mute expired");
          db.prepare("DELETE FROM timeouts WHERE guild_id = ? AND user_id = ?").run(message.guild!.id, target.id);
        } catch {}
      }, duration);
    }

    logAction(message.guild!.id, "mute", target.id, message.author.id, reason, duration ? formatDuration(duration) : undefined);

    const e = embed("🔇 User Muted")
      .addFields(
        { name: "User", value: `${target.user.tag} (${target.id})`, inline: true },
        { name: "Moderator", value: message.author.tag, inline: true },
        { name: "Duration", value: duration ? formatDuration(duration) : "Indefinite", inline: true },
        { name: "Reason", value: reason }
      ).setTimestamp();

    await message.reply({ embeds: [e] });
    await sendLog(message.guild!, e);
  },
};
