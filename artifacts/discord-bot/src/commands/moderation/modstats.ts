import { Message } from "discord.js";
import { embed, errorEmbed } from "../../utils.js";
import { getDb } from "../../db.js";

export default {
  name: "modstats",
  description: "View mod stats for a role/user",
  usage: ",modstats @role",
  async execute(message: Message, args: string[]) {
    if (!message.member?.permissions.has("ModerateMembers")) {
      return message.reply({ embeds: [errorEmbed("You don't have permission.")] });
    }

    const role = message.mentions.roles.first();
    if (!role) return message.reply({ embeds: [errorEmbed("Please mention a role.")] });

    const db = getDb();
    const members = message.guild!.members.cache.filter(m => m.roles.cache.has(role.id));

    const stats = members.map(m => {
      const count = (db.prepare("SELECT COUNT(*) as c FROM mod_actions WHERE guild_id = ? AND moderator_id = ?")
        .get(message.guild!.id, m.id) as any).c;
      return { tag: m.user.tag, count };
    }).sort((a, b) => b.count - a.count);

    const description = stats.length === 0
      ? "No moderation actions found for this role's members."
      : stats.map((s, i) => `**${i + 1}.** ${s.tag} — **${s.count}** actions`).join("\n");

    await message.reply({
      embeds: [embed(`📊 Mod Stats for ${role.name}`, description).setTimestamp()]
    });
  },
};
