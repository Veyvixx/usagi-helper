import {
  Client,
  Message,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ThreadChannel,
  TextChannel,
  ChannelType,
  PrivateThreadChannel,
} from "discord.js";
import { getDb } from "../db.js";
import { GUILD_ID, PING_ROLE_ID, DEV_CHANNEL_ID, EMBED_COLOR } from "../config.js";
import { isThreadChannel } from "../utils.js";

export default {
  name: "messageCreate",
  async execute(message: Message, client: Client) {
    if (message.author.bot) return;
    if (!message.guild) return;
    if (message.guild.id !== GUILD_ID) return;

    // ── Dev channel handler ──────────────────────────────────────
    if (message.channelId === DEV_CHANNEL_ID) {
      await handleDevChannel(message);
      return;
    }

    // ── Thread support ───────────────────────────────────────────
    if (isThreadChannel(message.guild.id, message.channelId)) {
      await handleThreadSupport(message);
    }

    // ── Sticky messages ──────────────────────────────────────────
    await handleSticky(message);
  },
};

async function handleDevChannel(message: Message) {
  const db = getDb();
  const content = message.content;

  try {
    await message.delete().catch(() => {});
  } catch {}

  const sentEmbed = new EmbedBuilder()
    .setColor(EMBED_COLOR)
    .setDescription(
      `your message has been **sent** to our developers ! we appreciate your patience and support as a donator !\nthe **current** eta for a response is :\n**5 business days**`
    );

  const sent = await (message.channel as TextChannel).send({
    content: `<@${message.author.id}>`,
    embeds: [sentEmbed],
  }).catch(() => null);

  if (!sent) return;

  db.prepare(
    "INSERT INTO dev_channel_messages (guild_id, channel_id, user_id, message_content, bot_message_id) VALUES (?, ?, ?, ?, ?)"
  ).run(message.guild!.id, message.channelId, message.author.id, content, sent.id);

  // Create a private thread visible only to staff (MANAGE_THREADS permission)
  try {
    const staffThread = await (message.channel as TextChannel).threads.create({
      name: `📩 ${message.author.username}`,
      type: ChannelType.PrivateThread,
      invitable: false,
      autoArchiveDuration: 10080,
    }) as PrivateThreadChannel;

    const msgEmbed = new EmbedBuilder()
      .setColor(EMBED_COLOR)
      .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
      .setDescription(content)
      .setTimestamp();

    await staffThread.send({
      content: `📬 **New dev feedback from <@${message.author.id}>** — use \`/devreply\` to respond.`,
      embeds: [msgEmbed],
    });
  } catch (err) {
    console.error("[DevChannel] Failed to create staff thread:", err);
  }
}

async function handleThreadSupport(message: Message) {
  if (!message.guild) return;
  const db = getDb();

  const preview = message.content.slice(0, 60).replace(/\n/g, " ");
  const threadName = `${message.member?.displayName ?? message.author.username} | ${preview || "new ticket"}`;

  let thread: ThreadChannel | null = null;
  try {
    thread = await (message.channel as TextChannel).threads.create({
      name: threadName.slice(0, 100),
      startMessage: message.id,
      type: ChannelType.PublicThread,
      autoArchiveDuration: 10080,
    });
  } catch (err) {
    console.error("[Thread] Failed to create thread:", err);
    return;
  }

  const supportEmbed = new EmbedBuilder()
    .setColor(EMBED_COLOR)
    .setDescription(
      `• our support team have been notified to come help ! 🐾\n` +
      `• whilst you are waiting, please write any additional information, such as:\n` +
      `• any screenshots relating to your issue\n` +
      `• any commands you ran, if applicable\n` +
      `thank you for your patience!\n\n` +
      `> please avoid pinging roles or staff members: we will come to help you as soon as we can.`
    );

  const closeBtn = new ButtonBuilder()
    .setCustomId(`close_thread:${thread.id}`)
    .setLabel("close thread")
    .setStyle(ButtonStyle.Danger);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(closeBtn);

  const botMsg = await thread.send({
    content: `<@${message.author.id}> · <@&${PING_ROLE_ID}>`,
    embeds: [supportEmbed],
    components: [row],
  }).catch(() => null);

  db.prepare(
    "INSERT INTO support_threads (guild_id, channel_id, thread_id, opener_id, bot_message_id) VALUES (?, ?, ?, ?, ?)"
  ).run(message.guild.id, message.channelId, thread.id, message.author.id, botMsg?.id ?? null);
}

async function handleSticky(message: Message) {
  if (!message.guild) return;
  const db = getDb();

  const sticky = db.prepare(
    "SELECT * FROM sticky_messages WHERE guild_id = ? AND channel_id = ?"
  ).get(message.guild.id, message.channelId) as any;

  if (!sticky) return;

  try {
    if (sticky.last_message_id) {
      const ch = message.channel as TextChannel;
      const old = await ch.messages.fetch(sticky.last_message_id).catch(() => null);
      if (old) await old.delete().catch(() => {});
    }

    let newMsg: Message | null = null;
    const ch = message.channel as TextChannel;

    if (sticky.embed_json) {
      const embedData = JSON.parse(sticky.embed_json);
      const e = new EmbedBuilder(embedData);
      newMsg = await ch.send({ embeds: [e] });
    } else if (sticky.content) {
      newMsg = await ch.send({ content: sticky.content });
    }

    if (newMsg) {
      db.prepare(
        "UPDATE sticky_messages SET last_message_id = ? WHERE guild_id = ? AND channel_id = ?"
      ).run(newMsg.id, message.guild.id, message.channelId);
    }
  } catch (err) {
    console.error("[Sticky] Error resending sticky:", err);
  }
}
