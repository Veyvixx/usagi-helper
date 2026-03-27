import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  ChannelType,
} from "discord.js";
import { getDb } from "../../db.js";
import { STAFF_ROLE_ID } from "../../config.js";

export default {
  data: new SlashCommandBuilder()
    .setName("setthreadchannel")
    .setDescription("Add or remove a channel from thread support (staff only)")
    .addSubcommand((sub) =>
      sub
        .setName("add")
        .setDescription("Enable thread support for a channel")
        .addChannelOption((opt) =>
          opt
            .setName("channel")
            .setDescription("The channel to enable thread support in")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("remove")
        .setDescription("Disable thread support for a channel")
        .addChannelOption((opt) =>
          opt
            .setName("channel")
            .setDescription("The channel to disable thread support in")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub.setName("list").setDescription("List all thread-enabled channels")
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const member = await interaction.guild!.members.fetch(interaction.user.id);
    if (!member.roles.cache.has(STAFF_ROLE_ID) && !member.permissions.has(PermissionFlagsBits.Administrator)) {
      await interaction.reply({ content: "❌ You need the staff role to use this command.", ephemeral: true });
      return;
    }

    const db = getDb();
    const sub = interaction.options.getSubcommand();

    if (sub === "add") {
      const channel = interaction.options.getChannel("channel", true);
      db.prepare(
        "INSERT OR IGNORE INTO thread_channels (guild_id, channel_id) VALUES (?, ?)"
      ).run(interaction.guild!.id, channel.id);
      await interaction.reply({ content: `✅ Thread support enabled for <#${channel.id}>.`, ephemeral: true });
    } else if (sub === "remove") {
      const channel = interaction.options.getChannel("channel", true);
      db.prepare(
        "DELETE FROM thread_channels WHERE guild_id = ? AND channel_id = ?"
      ).run(interaction.guild!.id, channel.id);
      await interaction.reply({ content: `✅ Thread support disabled for <#${channel.id}>.`, ephemeral: true });
    } else if (sub === "list") {
      const rows = db.prepare(
        "SELECT channel_id FROM thread_channels WHERE guild_id = ?"
      ).all(interaction.guild!.id) as any[];
      if (!rows.length) {
        await interaction.reply({ content: "No thread-enabled channels set.", ephemeral: true });
      } else {
        const list = rows.map((r) => `<#${r.channel_id}>`).join("\n");
        await interaction.reply({ content: `**Thread-enabled channels:**\n${list}`, ephemeral: true });
      }
    }
  },
};
