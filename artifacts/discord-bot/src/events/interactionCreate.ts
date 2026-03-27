import { Client, Interaction } from "discord.js";
import { getDb } from "../db.js";
import { handleModmailInteraction } from "../modmail.js";

export default {
  name: "interactionCreate",
  async execute(interaction: Interaction, client: Client) {
    if (!interaction.isButton()) return;

    const guild = interaction.guild;
    if (!guild) return;

    // Button roles
    const db = getDb();
    const row = db.prepare(
      "SELECT role_id FROM button_roles WHERE guild_id = ? AND message_id = ? AND custom_id = ?"
    ).get(guild.id, interaction.message.id, interaction.customId) as any;

    if (row) {
      try {
        const member = await guild.members.fetch(interaction.user.id);
        if (member.roles.cache.has(row.role_id)) {
          await member.roles.remove(row.role_id);
          await interaction.reply({ content: `✅ Removed role <@&${row.role_id}>`, ephemeral: true });
        } else {
          await member.roles.add(row.role_id);
          await interaction.reply({ content: `✅ Gave you role <@&${row.role_id}>`, ephemeral: true });
        }
      } catch {
        await interaction.reply({ content: "❌ Could not assign role.", ephemeral: true });
      }
      return;
    }

    // ModMail close button
    if (interaction.customId === "modmail_close") {
      await handleModmailInteraction(interaction, client);
    }
  },
};
