import { Message } from "discord.js";
import { embed, errorEmbed, sendLog, logAction } from "../../utils.js";
import { getDb } from "../../db.js";

export default {
  name: "unjail",
  description: "Unjail a user, restoring their previous roles",
  usage: ",unjail @user",
  async execute(message: Message, args: string[]) {
    if (!message.member?.permissions.has("ModerateMembers")) {
      return message.reply({ embeds: [errorEmbed("You don't have permission.")] });
    }
    const target = message.mentions.members?.first();
    if (!target) return message.reply({ embeds: [errorEmbed("Please mention a user.")] });

    const db = getDb();
    const data = db.prepare("SELECT previous_roles FROM jailed_users WHERE guild_id = ? AND user_id = ?")
      .get(message.guild!.id, target.id) as any;

    if (!data) return message.reply({ embeds: [errorEmbed("This user is not jailed.")] });

    const roles = JSON.parse(data.previous_roles);
    try {
      await target.roles.set(roles, `Unjailed by ${message.author.tag}`);
    } catch {
      return message.reply({ embeds: [errorEmbed("Failed to restore roles. Check bot permissions.")] });
    }

    db.prepare("DELETE FROM jailed_users WHERE guild_id = ? AND user_id = ?").run(message.guild!.id, target.id);
    logAction(message.guild!.id, "unjail", target.id, message.author.id);

    const e = embed("🔓 User Unjailed")
      .addFields(
        { name: "User", value: `${target.user.tag} (${target.id})`, inline: true },
        { name: "Moderator", value: message.author.tag, inline: true }
      ).setTimestamp();

    await message.reply({ embeds: [e] });
    await sendLog(message.guild!, e);
  },
};
