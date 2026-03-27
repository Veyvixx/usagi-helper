import { Client, GuildMember } from "discord.js";
import { embed, sendLog } from "../utils.js";
import { GUILD_ID } from "../config.js";

export default {
  name: "guildMemberAdd",
  async execute(member: GuildMember, client: Client) {
    if (member.guild.id !== GUILD_ID) return;
    const e = embed("📥 Member Joined")
      .setThumbnail(member.user.displayAvatarURL())
      .addFields(
        { name: "User", value: `${member.user.tag} (${member.id})`, inline: true },
        { name: "Account Created", value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
        { name: "Member Count", value: `${member.guild.memberCount}`, inline: true }
      )
      .setTimestamp();
    await sendLog(member.guild, e);
  },
};
