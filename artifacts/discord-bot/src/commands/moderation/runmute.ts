import { Message } from "discord.js";
import { embed, errorEmbed, sendLog, logAction } from "../../utils.js";
import { getDb } from "../../db.js";

export default {
  name: "runmute",
  description: "Unblock emojis/reactions for a user",
  usage: ",runmute @user",
  async execute(message: Message, args: string[]) {
    if (!message.member?.permissions.has("ModerateMembers")) {
      return message.reply({ embeds: [errorEmbed("You don't have permission.")] });
    }
    const target = message.mentions.members?.first();
    if (!target) return message.reply({ embeds: [errorEmbed("Please mention a user.")] });

    const db = getDb();
    db.prepare("DELETE FROM rmute_users WHERE guild_id = ? AND user_id = ?").run(message.guild!.id, target.id);

    const channels = message.guild!.channels.cache.filter(c => c.isTextBased());
    for (const [, channel] of channels) {
      try {
        await (channel as any).permissionOverwrites.edit(target.id, {
          AddReactions: null,
          UseExternalEmojis: null,
        });
      } catch {}
    }

    logAction(message.guild!.id, "runmute", target.id, message.author.id);
    const e = embed("✅ Reaction Unmuted", `${target.user.tag} can use reactions and emojis again.`).setTimestamp();
    await message.reply({ embeds: [e] });
    await sendLog(message.guild!, e);
  },
};
