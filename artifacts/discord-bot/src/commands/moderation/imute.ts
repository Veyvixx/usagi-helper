import { Message, PermissionFlagsBits } from "discord.js";
import { embed, errorEmbed, sendLog, logAction } from "../../utils.js";
import { getDb } from "../../db.js";

export default {
  name: "imute",
  description: "Block a user from sending media/embeds",
  usage: ",imute @user",
  async execute(message: Message, args: string[]) {
    if (!message.member?.permissions.has("ModerateMembers")) {
      return message.reply({ embeds: [errorEmbed("You don't have permission.")] });
    }
    const target = message.mentions.members?.first();
    if (!target) return message.reply({ embeds: [errorEmbed("Please mention a user.")] });

    const db = getDb();
    db.prepare("INSERT OR IGNORE INTO imute_users (guild_id, user_id) VALUES (?, ?)").run(message.guild!.id, target.id);

    // Deny embed links and attach files in all channels
    const channels = message.guild!.channels.cache.filter(c => c.isTextBased());
    for (const [, channel] of channels) {
      try {
        await (channel as any).permissionOverwrites.edit(target.id, {
          EmbedLinks: false,
          AttachFiles: false,
        });
      } catch {}
    }

    logAction(message.guild!.id, "imute", target.id, message.author.id);
    const e = embed("🖼️ Media Muted", `${target.user.tag} can no longer send media/embeds.`).setTimestamp();
    await message.reply({ embeds: [e] });
    await sendLog(message.guild!, e);
  },
};
