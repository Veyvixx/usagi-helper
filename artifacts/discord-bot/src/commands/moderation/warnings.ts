import { Message } from "discord.js";
import { embed, errorEmbed } from "../../utils.js";
import { getDb } from "../../db.js";

export default {
  name: "warnings",
  description: "Show warning history for a user",
  usage: ",warnings @user",
  async execute(message: Message, args: string[]) {
    if (!message.member?.permissions.has("ModerateMembers")) {
      return message.reply({ embeds: [errorEmbed("You don't have permission.")] });
    }
    const target = message.mentions.members?.first() || message.guild?.members.cache.get(args[0]);
    if (!target) return message.reply({ embeds: [errorEmbed("Please mention a user.")] });

    const db = getDb();
    const warns = db.prepare("SELECT * FROM warnings WHERE guild_id = ? AND user_id = ? ORDER BY created_at DESC")
      .all(message.guild!.id, target.id) as any[];

    if (warns.length === 0) {
      return message.reply({ embeds: [embed("📋 Warnings", `${target.user.tag} has no warnings.`)] });
    }

    const list = warns.slice(0, 10).map((w, i) => `**${i + 1}.** ${w.reason} — <@${w.moderator_id}> <t:${w.created_at}:R>`).join("\n");

    await message.reply({
      embeds: [embed(`📋 Warnings for ${target.user.tag}`, list)
        .addFields({ name: "Total", value: `${warns.length}`, inline: true })]
    });
  },
};
