import { Client, GuildMember, PartialGuildMember } from "discord.js";
import { embed, sendLog } from "../utils.js";

export default {
  name: "guildMemberRemove",
  async execute(member: GuildMember | PartialGuildMember, client: Client) {
    const e = embed("📤 Member Left")
      .setThumbnail(member.user?.displayAvatarURL() ?? null)
      .addFields(
        { name: "User", value: `${member.user?.tag ?? "Unknown"} (${member.id})`, inline: true },
        { name: "Joined", value: member.joinedTimestamp ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : "Unknown", inline: true }
      )
      .setTimestamp();
    if (member.guild) await sendLog(member.guild, e);
  },
};
