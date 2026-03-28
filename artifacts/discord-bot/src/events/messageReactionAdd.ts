import {
  Client,
  MessageReaction,
  User,
  PartialMessageReaction,
  PartialUser,
  EmbedBuilder,
  TextChannel,
} from "discord.js";
import { getDb } from "../db.js";
import { GUILD_ID, STAFF_ROLE_ID, CHIEAT_EMOJI_ID, CHIEAT_EMOJI_NAME, EMBED_COLOR } from "../config.js";

export default {
  name: "messageReactionAdd",
  async execute(
    reaction: MessageReaction | PartialMessageReaction,
    user: User | PartialUser,
    client: Client
  ) {
    if (user.bot) return;

    if (reaction.partial) {
      try { await reaction.fetch(); } catch { return; }
    }
    if (reaction.message.partial) {
      try { await reaction.message.fetch(); } catch { return; }
    }

    // Support threads inside guilds — get guild via client if needed
    const guild =
      reaction.message.guild ??
      client.guilds.cache.get(GUILD_ID) ??
      null;
    if (!guild || guild.id !== GUILD_ID) return;

    const emoji = reaction.emoji;
    const isChiiEat =
      emoji.id === CHIEAT_EMOJI_ID && emoji.name === CHIEAT_EMOJI_NAME;
    if (!isChiiEat) return;

    const member = await guild.members.fetch(user.id).catch(() => null);
    if (!member) return;
    if (!member.roles.cache.has(STAFF_ROLE_ID)) return;

    const db = getDb();

    // Match by the original message the thread was created from
    const threadData = db
      .prepare(
        "SELECT * FROM support_threads WHERE starter_message_id = ? AND closed = 0"
      )
      .get(reaction.message.id) as any;

    if (!threadData) return;
    if (threadData.picked_by_id) return;

    db.prepare(
      "UPDATE support_threads SET picked_by_id = ? WHERE id = ?"
    ).run(user.id, threadData.id);

    try {
      const threadChannel = await guild.channels
        .fetch(threadData.thread_id)
        .catch(() => null) as TextChannel | null;

      if (!threadChannel?.isTextBased()) return;

      const pickEmbed = new EmbedBuilder()
        .setColor(EMBED_COLOR)
        .setDescription(
          `• <@${user.id}> has picked up this case !\n• please be patient as they respond ~`
        );

      await threadChannel.send({ embeds: [pickEmbed] });
    } catch (err) {
      console.error("[ReactionAdd] Failed to send pick-up embed:", err);
    }
  },
};
