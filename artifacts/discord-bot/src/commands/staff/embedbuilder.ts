import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ChannelType,
  PermissionFlagsBits,
} from "discord.js";
import { STAFF_ROLE_ID } from "../../config.js";

export default {
  data: new SlashCommandBuilder()
    .setName("embedbuilder")
    .setDescription("Build and send a custom embed (staff only)")
    .addChannelOption((opt) =>
      opt
        .setName("channel")
        .setDescription("Channel to send the embed in")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const member = await interaction.guild!.members.fetch(interaction.user.id);
    if (!member.roles.cache.has(STAFF_ROLE_ID) && !member.permissions.has(PermissionFlagsBits.Administrator)) {
      await interaction.reply({ content: "❌ You need the staff role to use this command.", ephemeral: true });
      return;
    }

    const channel = interaction.options.getChannel("channel", true);

    const modal = new ModalBuilder()
      .setCustomId(`embedbuilder_send:${channel.id}`)
      .setTitle("Embed Builder");

    const titleInput = new TextInputBuilder()
      .setCustomId("eb_title")
      .setLabel("Title (optional)")
      .setStyle(TextInputStyle.Short)
      .setRequired(false)
      .setMaxLength(256);

    const descInput = new TextInputBuilder()
      .setCustomId("eb_description")
      .setLabel("Description")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true)
      .setMaxLength(4000);

    const colorInput = new TextInputBuilder()
      .setCustomId("eb_color")
      .setLabel("Color (hex, e.g. #ff69b4) — optional")
      .setStyle(TextInputStyle.Short)
      .setRequired(false)
      .setMaxLength(7);

    const imageInput = new TextInputBuilder()
      .setCustomId("eb_image")
      .setLabel("Image URL (optional)")
      .setStyle(TextInputStyle.Short)
      .setRequired(false);

    modal.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(titleInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(descInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(colorInput),
      new ActionRowBuilder<TextInputBuilder>().addComponents(imageInput),
    );

    await interaction.showModal(modal);
  },
};
