import {
  Client,
  Interaction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  TextChannel,
} from "discord.js";
import { getDb } from "../db.js";
import { GUILD_ID, STAFF_ROLE_ID, EMBED_COLOR } from "../config.js";

export default {
  name: "interactionCreate",
  async execute(interaction: Interaction, client: Client) {
    if (!interaction.guild) return;
    if (interaction.guild.id !== GUILD_ID) return;

    // ── Slash commands ───────────────────────────────────────────
    if (interaction.isChatInputCommand()) {
      const command = (client as any).slashCommands?.get(interaction.commandName);
      if (!command) return;
      try {
        await command.execute(interaction, client);
      } catch (err) {
        console.error(err);
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ content: "An error occurred.", ephemeral: true }).catch(() => {});
        } else {
          await interaction.reply({ content: "An error occurred.", ephemeral: true }).catch(() => {});
        }
      }
      return;
    }

    // ── Modal submissions ────────────────────────────────────────
    if (interaction.isModalSubmit()) {
      if (interaction.customId.startsWith("embedbuilder_send:")) {
        const channelId = interaction.customId.split(":")[1];
        const title = interaction.fields.getTextInputValue("eb_title");
        const description = interaction.fields.getTextInputValue("eb_description");
        const colorHex = interaction.fields.getTextInputValue("eb_color").trim();
        const imageUrl = interaction.fields.getTextInputValue("eb_image").trim();

        const e = new EmbedBuilder().setColor(EMBED_COLOR);
        if (title) e.setTitle(title);
        if (description) e.setDescription(description);
        if (colorHex) {
          const parsed = parseInt(colorHex.replace("#", ""), 16);
          if (!isNaN(parsed)) e.setColor(parsed);
        }
        if (imageUrl) e.setImage(imageUrl);

        try {
          const ch = await interaction.guild.channels.fetch(channelId) as TextChannel;
          if (!ch?.isTextBased()) {
            await interaction.reply({ content: "❌ Invalid channel.", ephemeral: true });
            return;
          }
          await ch.send({ embeds: [e] });
          await interaction.reply({ content: `✅ Embed sent to <#${channelId}>!`, ephemeral: true });
        } catch {
          await interaction.reply({ content: "❌ Failed to send embed.", ephemeral: true });
        }
        return;
      }

      if (interaction.customId.startsWith("sticky_embed:")) {
        const channelId = interaction.customId.split(":")[1];
        const title = interaction.fields.getTextInputValue("s_title");
        const description = interaction.fields.getTextInputValue("s_description");
        const colorHex = interaction.fields.getTextInputValue("s_color").trim();

        const e = new EmbedBuilder().setColor(EMBED_COLOR);
        if (title) e.setTitle(title);
        if (description) e.setDescription(description);
        if (colorHex) {
          const parsed = parseInt(colorHex.replace("#", ""), 16);
          if (!isNaN(parsed)) e.setColor(parsed);
        }

        const db = getDb();
        db.prepare(
          "INSERT OR REPLACE INTO sticky_messages (guild_id, channel_id, content, embed_json, last_message_id) VALUES (?, ?, NULL, ?, NULL)"
        ).run(interaction.guild.id, channelId, JSON.stringify(e.toJSON()));

        try {
          const ch = await interaction.guild.channels.fetch(channelId) as TextChannel;
          if (ch?.isTextBased()) {
            const sent = await ch.send({ embeds: [e] });
            db.prepare("UPDATE sticky_messages SET last_message_id = ? WHERE guild_id = ? AND channel_id = ?")
              .run(sent.id, interaction.guild.id, channelId);
          }
        } catch {}

        await interaction.reply({ content: `✅ Sticky embed set for <#${channelId}>!`, ephemeral: true });
        return;
      }
    }

    // ── Button interactions ──────────────────────────────────────
    if (!interaction.isButton()) return;

    // Close thread button
    if (interaction.customId.startsWith("close_thread:")) {
      const threadId = interaction.customId.split(":")[1];
      const db = getDb();
      const threadData = db.prepare(
        "SELECT * FROM support_threads WHERE thread_id = ? AND closed = 0"
      ).get(threadId) as any;

      if (!threadData) {
        await interaction.reply({ content: "This thread is already closed or not found.", ephemeral: true });
        return;
      }

      const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
      if (!member) {
        await interaction.reply({ content: "❌ Could not verify your permissions.", ephemeral: true });
        return;
      }

      const isOpener = interaction.user.id === threadData.opener_id;
      const isStaff = member.roles.cache.has(STAFF_ROLE_ID);

      if (!isOpener && !isStaff) {
        await interaction.reply({ content: "❌ Only the thread opener or staff can close this thread.", ephemeral: true });
        return;
      }

      db.prepare("UPDATE support_threads SET closed = 1 WHERE thread_id = ?").run(threadId);

      const closedEmbed = new EmbedBuilder()
        .setColor(0xff4444)
        .setDescription(`• this thread has been closed by <@${interaction.user.id}> !\n• thank you for reaching out ~`);

      const disabledRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`close_thread_disabled`)
          .setLabel("thread closed")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true)
      );

      await interaction.update({ components: [disabledRow] });

      try {
        const thread = await interaction.guild.channels.fetch(threadId) as TextChannel;
        if (thread?.isTextBased()) {
          await thread.send({ embeds: [closedEmbed] });
          if ("setArchived" in thread) {
            await (thread as any).setArchived(true).catch(() => {});
          }
        }
      } catch {}

      return;
    }
  },
};
