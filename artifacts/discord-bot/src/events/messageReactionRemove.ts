import { Client, MessageReaction, User, PartialMessageReaction, PartialUser } from "discord.js";
import { getDb } from "../db.js";

export default {
  name: "messageReactionRemove",
  async execute(reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser, client: Client) {
    if (user.bot) return;
    if (reaction.partial) {
      try { await reaction.fetch(); } catch { return; }
    }
    if (reaction.message.partial) {
      try { await reaction.message.fetch(); } catch { return; }
    }

    const guild = reaction.message.guild;
    if (!guild) return;

    const emojiKey = reaction.emoji.id ? `<:${reaction.emoji.name}:${reaction.emoji.id}>` : reaction.emoji.name;
    const db = getDb();
    const row = db.prepare(
      "SELECT role_id FROM reaction_roles WHERE guild_id = ? AND message_id = ? AND emoji = ?"
    ).get(guild.id, reaction.message.id, emojiKey) as any;

    if (!row) return;

    try {
      const member = await guild.members.fetch(user.id);
      await member.roles.remove(row.role_id);
    } catch {}
  },
};
