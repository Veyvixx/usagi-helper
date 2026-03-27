import { Message } from "discord.js";
import { embed, errorEmbed, sendLog, logAction } from "../../utils.js";
import { getDb } from "../../db.js";

export default {
  name: "iunmute",
  description: "Unblock media/embeds for a user",
  usage: ",iunmute @user",
  async execute(message: Message, args: string[]) {
    if (!message.member?.permissions.has("ModerateMembers")) {
      return message.reply({ embeds: [errorEmbed("You don't have permission.")] });
    }
    const target = message.mentions.members?.first();
    if (!target) return message.reply({ embeds: [errorEmbed("Please mention a user.")] });

    const db = getDb();
    db.prepare("DELETE FROM imute_users WHERE guild_id = ? AND user_id = ?").run(message.guild!.id, target.id);

    const channels = message.guild!.channels.cache.filter(c => c.isTextBased());
    for (const [, channel] of channels) {
      try {
        await (channel as any).permissionOverwrites.edit(target.id, {
          EmbedLinks: null,
          AttachFiles: null,
        });
      } catch {}
    }

    logAction(message.guild!.id, "iunmute", target.id, message.author.id);
    const e = embed("✅ Media Unmuted", `${target.user.tag} can send media/embeds again.`).setTimestamp();
    await message.reply({ embeds: [e] });
    await sendLog(message.guild!, e);
  },
};
