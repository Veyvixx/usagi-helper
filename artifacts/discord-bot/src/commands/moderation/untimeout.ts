import { Message } from "discord.js";
import { embed, errorEmbed, sendLog, logAction } from "../../utils.js";

export default {
  name: "untimeout",
  description: "Remove timeout from a user",
  usage: ",untimeout @user",
  async execute(message: Message, args: string[]) {
    if (!message.member?.permissions.has("ModerateMembers")) {
      return message.reply({ embeds: [errorEmbed("You don't have permission.")] });
    }
    const target = message.mentions.members?.first();
    if (!target) return message.reply({ embeds: [errorEmbed("Please mention a user.")] });

    await target.timeout(null);
    logAction(message.guild!.id, "untimeout", target.id, message.author.id);

    const e = embed("✅ Timeout Removed")
      .addFields(
        { name: "User", value: `${target.user.tag} (${target.id})`, inline: true },
        { name: "Moderator", value: message.author.tag, inline: true }
      ).setTimestamp();

    await message.reply({ embeds: [e] });
    await sendLog(message.guild!, e);
  },
};
