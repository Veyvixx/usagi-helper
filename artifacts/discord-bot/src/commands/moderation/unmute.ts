import { Message } from "discord.js";
import { embed, errorEmbed, sendLog, logAction, getConfig } from "../../utils.js";

export default {
  name: "unmute",
  description: "Remove mute from a user",
  usage: ",unmute @user",
  async execute(message: Message, args: string[]) {
    if (!message.member?.permissions.has("ModerateMembers")) {
      return message.reply({ embeds: [errorEmbed("You don't have permission.")] });
    }
    const target = message.mentions.members?.first();
    if (!target) return message.reply({ embeds: [errorEmbed("Please mention a user.")] });

    const config = getConfig(message.guild!.id);
    const muteRoleId = config?.mute_role_id;
    if (!muteRoleId) return message.reply({ embeds: [errorEmbed("No mute role configured.")] });

    await target.roles.remove(muteRoleId);
    logAction(message.guild!.id, "unmute", target.id, message.author.id);

    const e = embed("✅ User Unmuted")
      .addFields(
        { name: "User", value: `${target.user.tag} (${target.id})`, inline: true },
        { name: "Moderator", value: message.author.tag, inline: true }
      ).setTimestamp();

    await message.reply({ embeds: [e] });
    await sendLog(message.guild!, e);
  },
};
