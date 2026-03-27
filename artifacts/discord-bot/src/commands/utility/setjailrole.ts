import { Message } from "discord.js";
import { embed, errorEmbed, ensureConfig } from "../../utils.js";
import { getDb } from "../../db.js";

export default {
  name: "setjailrole",
  description: "Set the jail role",
  usage: ",setjailrole @role",
  async execute(message: Message, args: string[]) {
    if (!message.member?.permissions.has("ManageGuild")) {
      return message.reply({ embeds: [errorEmbed("You need Manage Server permission.")] });
    }
    const role = message.mentions.roles.first();
    if (!role) return message.reply({ embeds: [errorEmbed("Please mention a role.")] });

    ensureConfig(message.guild!.id);
    const db = getDb();
    db.prepare("UPDATE guild_config SET jail_role_id = ? WHERE guild_id = ?").run(role.id, message.guild!.id);

    await message.reply({ embeds: [embed("✅ Jail Role Set", `Jail role is now ${role}.`)] });
  },
};
