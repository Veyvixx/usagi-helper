import { Message, TextChannel } from "discord.js";
import { embed, errorEmbed, ensureConfig } from "../../utils.js";
import { getDb } from "../../db.js";

export default {
  name: "setlogchannel",
  description: "Set the logging channel",
  usage: ",setlogchannel #channel",
  async execute(message: Message, args: string[]) {
    if (!message.member?.permissions.has("ManageGuild")) {
      return message.reply({ embeds: [errorEmbed("You need Manage Server permission.")] });
    }
    const channel = message.mentions.channels.first() as TextChannel | undefined;
    if (!channel || !channel.isTextBased()) {
      return message.reply({ embeds: [errorEmbed("Please mention a text channel.")] });
    }

    ensureConfig(message.guild!.id);
    const db = getDb();
    db.prepare("UPDATE guild_config SET log_channel_id = ? WHERE guild_id = ?").run(channel.id, message.guild!.id);

    await message.reply({ embeds: [embed("✅ Log Channel Set", `Logs will now be sent to <#${channel.id}>.`)] });
  },
};
