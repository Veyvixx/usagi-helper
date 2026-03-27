import { DatabaseSync } from "node:sqlite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "../data");
const dbPath = path.join(dataDir, "bot.db");

let db: DatabaseSync;

export function initDb() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  db = new DatabaseSync(dbPath);
  db.exec("PRAGMA journal_mode = WAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS warnings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      moderator_id TEXT NOT NULL,
      reason TEXT NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS mod_actions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      action TEXT NOT NULL,
      user_id TEXT NOT NULL,
      moderator_id TEXT NOT NULL,
      reason TEXT,
      extra TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS guild_config (
      guild_id TEXT PRIMARY KEY,
      log_channel_id TEXT,
      modmail_channel_id TEXT,
      jail_role_id TEXT,
      mute_role_id TEXT,
      prefix TEXT DEFAULT ','
    );

    CREATE TABLE IF NOT EXISTS reaction_roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      channel_id TEXT NOT NULL,
      message_id TEXT NOT NULL,
      emoji TEXT NOT NULL,
      role_id TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS button_roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      channel_id TEXT NOT NULL,
      message_id TEXT NOT NULL,
      custom_id TEXT NOT NULL,
      role_id TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS modmail_threads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      thread_channel_id TEXT NOT NULL,
      open INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS jailed_users (
      guild_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      previous_roles TEXT NOT NULL,
      expires_at INTEGER,
      PRIMARY KEY (guild_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS temp_bans (
      guild_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      PRIMARY KEY (guild_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS imute_users (
      guild_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      PRIMARY KEY (guild_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS rmute_users (
      guild_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      PRIMARY KEY (guild_id, user_id)
    );
  `);

  return db;
}

export function getDb(): DatabaseSync {
  return db;
}
