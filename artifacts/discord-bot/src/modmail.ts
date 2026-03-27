import {
  Client,
  Message,
  ButtonInteraction,
  TextChannel,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
} from "discord.js";
import { getDb } from "./db.js";
import { embed, getConfig, ensureConfig } from "./utils.js";
import { EMBED_COLOR } from "./config.js";

export async function handleModmail(message: Message, client: Client) {
  const db = getDb();

  // Find a guild where the bot shares membership with this user
  const guilds = client.guilds.cache;
  let targetGuildId: string | null = null;
  let modmailChannelId: string | null = null;

  for (const [gid, guild] of guilds) {
    ensureConfig(gid);
    const config = db.prepare("SELECT modmail_channel_id FROM guild_config WHERE guild_id = ?").get(gid) as any;
    if (config?.modmail_channel_id) {
      try {
        await guild.members.fetch(message.author.id);
        targetGuildId = gid;
        modmailChannelId = config.modmail_channel_id;
        break;
      } catch {}
    }
  }

  if (!targetGuildId || !modmailChannelId) {
    return; // No guild with modmail configured
  }

  const guild = guilds.get(targetGuildId)!;

  // Check if there's already an open thread
  const existing = db.prepare(
    "SELECT thread_channel_id FROM modmail_threads WHERE guild_id = ? AND user_id = ? AND open = 1"
  ).get(targetGuildId, message.author.id) as any;

  let threadChannelId = existing?.thread_channel_id;

  if (!threadChannelId) {
    // Create new thread channel
    const modmailParent = await guild.channels.fetch(modmailChannelId).catch(() => null) as TextChannel | null;
    if (!modmailParent) return;

    const threadChannel = await guild.channels.create({
      name: `modmail-${message.author.username}`,
      type: ChannelType.GuildText,
      parent: modmailParent.parentId ?? undefined,
      topic: `ModMail thread for ${message.author.tag} (${message.author.id})`,
    });

    threadChannelId = threadChannel.id;
    db.prepare(
      "INSERT INTO modmail_threads (guild_id, user_id, thread_channel_id) VALUES (?, ?, ?)"
    ).run(targetGuildId, message.author.id, threadChannelId);

    const openEmbed = embed("📬 New ModMail Thread")
      .addFields(
        { name: "User", value: `${message.author.tag} (${message.author.id})`, inline: true },
        { name: "Account Age", value: `<t:${Math.floor(message.author.createdTimestamp / 1000)}:R>`, inline: true }
      )
      .setThumbnail(message.author.displayAvatarURL())
      .setTimestamp();

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("modmail_close")
        .setLabel("Close Thread")
        .setStyle(ButtonStyle.Danger)
        .setEmoji("🔒")
    );

    await threadChannel.send({ embeds: [openEmbed], components: [row] });

    // DM user confirmation
    await message.author.send({
      embeds: [embed("📬 ModMail Opened", "Your message has been sent to the staff team. They will reply here.")],
    }).catch(() => {});
  }

  const threadChannel = await guild.channels.fetch(threadChannelId).catch(() => null) as TextChannel | null;
  if (!threadChannel) return;

  // Relay message
  const msgEmbed = new EmbedBuilder()
    .setColor(EMBED_COLOR)
    .setAuthor({ name: `${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
    .setDescription(message.content || "*[no text]*")
    .setTimestamp();

  if (message.attachments.size > 0) {
    msgEmbed.addFields({ name: "Attachments", value: message.attachments.map((a) => a.url).join("\n") });
  }

  await threadChannel.send({ embeds: [msgEmbed] });

  // Confirm to user
  await message.react("✅").catch(() => {});
}

export async function handleModmailInteraction(interaction: ButtonInteraction, client: Client) {
  const guild = interaction.guild!;
  const db = getDb();

  const thread = db.prepare(
    "SELECT id, user_id FROM modmail_threads WHERE guild_id = ? AND thread_channel_id = ? AND open = 1"
  ).get(guild.id, interaction.channelId) as any;

  if (!thread) {
    await interaction.reply({ content: "No open modmail thread found here.", ephemeral: true });
    return;
  }

  db.prepare("UPDATE modmail_threads SET open = 0 WHERE id = ?").run(thread.id);

  await interaction.reply({ embeds: [embed("🔒 Thread Closed", `Closed by ${interaction.user.tag}`)] });

  // Notify user
  try {
    const user = await client.users.fetch(thread.user_id);
    await user.send({
      embeds: [embed("🔒 ModMail Closed", "Your modmail thread has been closed by staff. Feel free to DM again if you need help.")],
    });
  } catch {}

  // Archive / delete the channel after a delay
  setTimeout(async () => {
    try {
      await interaction.channel?.delete();
    } catch {}
  }, 5000);
}
