import { Message } from "discord.js";
import { embed, errorEmbed } from "../../utils.js";
import { getDb } from "../../db.js";

export default {
  name: "history",
  description: "Show mod action history for a user",
  usage: ",history @user",
  async execute(message: Message, args: string[]) {
    if (!message.member?.permissions.has("ModerateMembers")) {
      return message.reply({ embeds: [errorEmbed("You don't have permission.")] });
    }
    const target = message.mentions.members?.first() || message.guild?.members.cache.get(args[0]);
    if (!target) return message.reply({ embeds: [errorEmbed("Please mention a user.")] });

    const db = getDb();
    const actions = db.prepare("SELECT * FROM mod_actions WHERE guild_id = ? AND user_id = ? ORDER BY created_at DESC LIMIT 15")
      .all(message.guild!.id, target.id) as any[];

    if (actions.length === 0) {
      return message.reply({ embeds: [embed("📋 Mod History", `${target.user.tag} has no mod history.`)] });
    }

    const list = actions.map((a, i) =>
      `**${i + 1}.** \`${a.action}\` — ${a.reason ?? "No reason"} — <@${a.moderator_id}> <t:${a.created_at}:R>`
    ).join("\n");

    await message.reply({ embeds: [embed(`📋 Mod History for ${target.user.tag}`, list)] });
  },
};
