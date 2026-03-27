import { Message } from "discord.js";
import { embed, errorEmbed, sendLog, logAction } from "../../utils.js";

export default {
  name: "revokefiles",
  description: "Revoke file upload access for a user",
  usage: ",revokefiles @user",
  async execute(message: Message, args: string[]) {
    if (!message.member?.permissions.has("ManageChannels")) {
      return message.reply({ embeds: [errorEmbed("You don't have permission.")] });
    }
    const target = message.mentions.members?.first();
    if (!target) return message.reply({ embeds: [errorEmbed("Please mention a user.")] });

    const channels = message.guild!.channels.cache.filter(c => c.isTextBased());
    for (const [, channel] of channels) {
      try {
        await (channel as any).permissionOverwrites.edit(target.id, {
          AttachFiles: false,
        });
      } catch {}
    }

    logAction(message.guild!.id, "revokefiles", target.id, message.author.id);

    const e = embed("📎 File Access Revoked", `${target.user.tag} can no longer attach files.`)
      .addFields({ name: "Moderator", value: message.author.tag, inline: true })
      .setTimestamp();

    await message.reply({ embeds: [e] });
    await sendLog(message.guild!, e);
  },
};
