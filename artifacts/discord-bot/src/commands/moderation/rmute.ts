import { Message } from "discord.js";
import { embed, errorEmbed, sendLog, logAction } from "../../utils.js";
import { getDb } from "../../db.js";

export default {
  name: "rmute",
  description: "Block a user from using reactions/emojis",
  usage: ",rmute @user",
  async execute(message: Message, args: string[]) {
    if (!message.member?.permissions.has("ModerateMembers")) {
      return message.reply({ embeds: [errorEmbed("You don't have permission.")] });
    }
    const target = message.mentions.members?.first();
    if (!target) return message.reply({ embeds: [errorEmbed("Please mention a user.")] });

    const db = getDb();
    db.prepare("INSERT OR IGNORE INTO rmute_users (guild_id, user_id) VALUES (?, ?)").run(message.guild!.id, target.id);

    const channels = message.guild!.channels.cache.filter(c => c.isTextBased());
    for (const [, channel] of channels) {
      try {
        await (channel as any).permissionOverwrites.edit(target.id, {
          AddReactions: false,
          UseExternalEmojis: false,
        });
      } catch {}
    }

    logAction(message.guild!.id, "rmute", target.id, message.author.id);
    const e = embed("😶 Reaction Muted", `${target.user.tag} can no longer use reactions or external emojis.`).setTimestamp();
    await message.reply({ embeds: [e] });
    await sendLog(message.guild!, e);
  },
};
