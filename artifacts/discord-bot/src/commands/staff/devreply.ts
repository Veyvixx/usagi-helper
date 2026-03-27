import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  TextChannel,
  PermissionFlagsBits,
} from "discord.js";
import { getDb } from "../../db.js";
import { STAFF_ROLE_ID, DEV_CHANNEL_ID, EMBED_COLOR } from "../../config.js";

export default {
  data: new SlashCommandBuilder()
    .setName("devreply")
    .setDescription("Reply to a user who sent a message in the dev feedback channel (staff only)")
    .addUserOption((opt) =>
      opt.setName("user").setDescription("The user to reply to").setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName("message").setDescription("Your reply message").setRequired(true).setMaxLength(2000)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const member = await interaction.guild!.members.fetch(interaction.user.id);
    if (!member.roles.cache.has(STAFF_ROLE_ID) && !member.permissions.has(PermissionFlagsBits.Administrator)) {
      await interaction.reply({ content: "❌ You need the staff role to use this command.", ephemeral: true });
      return;
    }

    const target = interaction.options.getUser("user", true);
    const replyText = interaction.options.getString("message", true);
    const staffMember = await interaction.guild!.members.fetch(interaction.user.id);
    const staffName = staffMember.displayName;

    const replyEmbed = new EmbedBuilder()
      .setColor(EMBED_COLOR)
      .setDescription(replyText);

    try {
      const ch = await interaction.guild!.channels.fetch(DEV_CHANNEL_ID) as TextChannel;
      if (!ch?.isTextBased()) {
        await interaction.reply({ content: "❌ Dev channel not found.", ephemeral: true });
        return;
      }
      await ch.send({
        content: `<@${target.id}> · @reply >< · **you have received a response from** \`${staffName}\``,
        embeds: [replyEmbed],
      });
      await interaction.reply({ content: `✅ Reply sent to <@${target.id}>.`, ephemeral: true });
    } catch {
      await interaction.reply({ content: "❌ Failed to send reply.", ephemeral: true });
    }
  },
};
