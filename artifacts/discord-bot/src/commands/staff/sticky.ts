import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ChannelType,
  TextChannel,
  PermissionFlagsBits,
} from "discord.js";
import { getDb } from "../../db.js";
import { STAFF_ROLE_ID } from "../../config.js";

export default {
  data: new SlashCommandBuilder()
    .setName("sticky")
    .setDescription("Manage sticky messages for a channel (staff only)")
    .addSubcommand((sub) =>
      sub
        .setName("settext")
        .setDescription("Set a plain text sticky message")
        .addChannelOption((opt) =>
          opt
            .setName("channel")
            .setDescription("Target channel")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
        .addStringOption((opt) =>
          opt
            .setName("content")
            .setDescription("The sticky message text")
            .setRequired(true)
            .setMaxLength(2000)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("setembed")
        .setDescription("Set an embed sticky message (opens a form)")
        .addChannelOption((opt) =>
          opt
            .setName("channel")
            .setDescription("Target channel")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("remove")
        .setDescription("Remove the sticky message from a channel")
        .addChannelOption((opt) =>
          opt
            .setName("channel")
            .setDescription("Target channel")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const member = await interaction.guild!.members.fetch(interaction.user.id);
    if (!member.roles.cache.has(STAFF_ROLE_ID) && !member.permissions.has(PermissionFlagsBits.Administrator)) {
      await interaction.reply({ content: "❌ You need the staff role to use this command.", ephemeral: true });
      return;
    }

    const db = getDb();
    const sub = interaction.options.getSubcommand();
    const channel = interaction.options.getChannel("channel", true);

    if (sub === "settext") {
      const content = interaction.options.getString("content", true);

      const existing = db.prepare(
        "SELECT last_message_id FROM sticky_messages WHERE guild_id = ? AND channel_id = ?"
      ).get(interaction.guild!.id, channel.id) as any;

      if (existing?.last_message_id) {
        try {
          const ch = await interaction.guild!.channels.fetch(channel.id) as TextChannel;
          const old = await ch.messages.fetch(existing.last_message_id).catch(() => null);
          if (old) await old.delete().catch(() => {});
        } catch {}
      }

      db.prepare(
        "INSERT OR REPLACE INTO sticky_messages (guild_id, channel_id, content, embed_json, last_message_id) VALUES (?, ?, ?, NULL, NULL)"
      ).run(interaction.guild!.id, channel.id, content);

      try {
        const ch = await interaction.guild!.channels.fetch(channel.id) as TextChannel;
        if (ch?.isTextBased()) {
          const sent = await ch.send({ content });
          db.prepare("UPDATE sticky_messages SET last_message_id = ? WHERE guild_id = ? AND channel_id = ?")
            .run(sent.id, interaction.guild!.id, channel.id);
        }
      } catch {}

      await interaction.reply({ content: `✅ Sticky text message set for <#${channel.id}>.`, ephemeral: true });
    } else if (sub === "setembed") {
      const modal = new ModalBuilder()
        .setCustomId(`sticky_embed:${channel.id}`)
        .setTitle("Sticky Embed Builder");

      const titleInput = new TextInputBuilder()
        .setCustomId("s_title")
        .setLabel("Title (optional)")
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
        .setMaxLength(256);

      const descInput = new TextInputBuilder()
        .setCustomId("s_description")
        .setLabel("Description")
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
        .setMaxLength(4000);

      const colorInput = new TextInputBuilder()
        .setCustomId("s_color")
        .setLabel("Color (hex, e.g. #ff69b4) — optional")
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
        .setMaxLength(7);

      modal.addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(titleInput),
        new ActionRowBuilder<TextInputBuilder>().addComponents(descInput),
        new ActionRowBuilder<TextInputBuilder>().addComponents(colorInput),
      );

      await interaction.showModal(modal);
    } else if (sub === "remove") {
      const existing = db.prepare(
        "SELECT last_message_id FROM sticky_messages WHERE guild_id = ? AND channel_id = ?"
      ).get(interaction.guild!.id, channel.id) as any;

      if (existing?.last_message_id) {
        try {
          const ch = await interaction.guild!.channels.fetch(channel.id) as TextChannel;
          const old = await ch.messages.fetch(existing.last_message_id).catch(() => null);
          if (old) await old.delete().catch(() => {});
        } catch {}
      }

      db.prepare(
        "DELETE FROM sticky_messages WHERE guild_id = ? AND channel_id = ?"
      ).run(interaction.guild!.id, channel.id);

      await interaction.reply({ content: `✅ Sticky message removed from <#${channel.id}>.`, ephemeral: true });
    }
  },
};
