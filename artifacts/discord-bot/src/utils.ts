import { EmbedBuilder, Guild, GuildMember, TextChannel, User } from "discord.js";
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

export function parseDuration(str: string): number | null {
  const match = str.match(/^(\d+)(s|m|h|d)$/);
  if (!match) return null;
  const val = parseInt(match[1]);
  const unit = match[2];
  const multipliers: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
  return val * multipliers[unit] * 1000;
}

export function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

export async function sendLog(guild: Guild, embedData: EmbedBuilder) {
  const db = getDb();
  const config = db.prepare("SELECT log_channel_id FROM guild_config WHERE guild_id = ?").get(guild.id) as any;
  if (!config?.log_channel_id) return;
  try {
    const channel = await guild.channels.fetch(config.log_channel_id) as TextChannel;
    if (channel?.isTextBased()) await channel.send({ embeds: [embedData] });
  } catch {}
}

export function logAction(guildId: string, action: string, userId: string, modId: string, reason?: string, extra?: string) {
  const db = getDb();
  db.prepare(
    "INSERT INTO mod_actions (guild_id, action, user_id, moderator_id, reason, extra) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(guildId, action, userId, modId, reason ?? null, extra ?? null);
}

export function getConfig(guildId: string): any {
  const db = getDb();
  return db.prepare("SELECT * FROM guild_config WHERE guild_id = ?").get(guildId) as any;
}

export function ensureConfig(guildId: string) {
  const db = getDb();
  db.prepare("INSERT OR IGNORE INTO guild_config (guild_id) VALUES (?)").run(guildId);
}
