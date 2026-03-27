import { Message } from "discord.js";
import { embed, errorEmbed, sendLog, logAction, parseDuration, formatDuration, getConfig } from "../../utils.js";
import { getDb } from "../../db.js";

export default {
  name: "jail",
  description: "Jail a user (remove all roles, assign jail role)",
  usage: ",jail @user 30m [reason]",
  async execute(message: Message, args: string[]) {
    if (!message.member?.permissions.has("ModerateMembers")) {
      return message.reply({ embeds: [errorEmbed("You don't have permission.")] });
    }
    const target = message.mentions.members?.first();
    if (!target) return message.reply({ embeds: [errorEmbed("Please mention a user.")] });

    const config = getConfig(message.guild!.id);
    const jailRoleId = config?.jail_role_id;
    if (!jailRoleId) return message.reply({ embeds: [errorEmbed("No jail role configured. Use `,setjailrole @role` first.")] });

    const durationStr = args[1];
    const duration = durationStr ? parseDuration(durationStr) : null;
    const reason = args.slice(duration !== null ? 2 : 1).join(" ") || "No reason provided";

    // Save current roles (excluding @everyone and managed roles)
    const previousRoles = target.roles.cache
      .filter(r => r.id !== message.guild!.id && !r.managed)
      .map(r => r.id);

    // Remove all roles and add jail role
    try {
      await target.roles.set([jailRoleId], `Jailed by ${message.author.tag}: ${reason}`);
    } catch {
      return message.reply({ embeds: [errorEmbed("Failed to jail user. Check bot role hierarchy.")] });
    }

    const db = getDb();
    db.prepare("INSERT OR REPLACE INTO jailed_users (guild_id, user_id, previous_roles, expires_at) VALUES (?, ?, ?, ?)")
      .run(
        message.guild!.id,
        target.id,
        JSON.stringify(previousRoles),
        duration ? Math.floor((Date.now() + duration) / 1000) : null
      );

    logAction(message.guild!.id, "jail", target.id, message.author.id, reason, duration ? formatDuration(duration) : undefined);

    const e = embed("🔒 User Jailed")
      .addFields(
        { name: "User", value: `${target.user.tag} (${target.id})`, inline: true },
        { name: "Moderator", value: message.author.tag, inline: true },
        { name: "Duration", value: duration ? formatDuration(duration) : "Indefinite", inline: true },
        { name: "Reason", value: reason }
      ).setTimestamp();

    await message.reply({ embeds: [e] });
    await sendLog(message.guild!, e);

    if (duration) {
      setTimeout(async () => {
        try {
          const data = db.prepare("SELECT previous_roles FROM jailed_users WHERE guild_id = ? AND user_id = ?")
            .get(message.guild!.id, target.id) as any;
          if (data) {
            const roles = JSON.parse(data.previous_roles);
            await target.roles.set(roles, "Jail expired");
            db.prepare("DELETE FROM jailed_users WHERE guild_id = ? AND user_id = ?").run(message.guild!.id, target.id);
          }
        } catch {}
      }, duration);
    }
  },
};
