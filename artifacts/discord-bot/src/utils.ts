import { EmbedBuilder } from "discord.js";
import { EMBED_COLOR } from "./config.js";
import { getDb } from "./db.js";

export function embed(title?: string, description?: string) {
  const e = new EmbedBuilder().setColor(EMBED_COLOR);
  if (title) e.setTitle(title);
  if (description) e.setDescription(description);
  return e;
}

export function errorEmbed(description: string) {
  return new EmbedBuilder().setColor(0xff4444).setDescription(`❌ ${description}`);
}

export function successEmbed(description: string) {
  return new EmbedBuilder().setColor(EMBED_COLOR).setDescription(`✅ ${description}`);
}

export function isThreadChannel(guildId: string, channelId: string): boolean {
  const db = getDb();
  const row = db.prepare(
    "SELECT 1 FROM thread_channels WHERE guild_id = ? AND channel_id = ?"
  ).get(guildId, channelId);
  return !!row;
}
