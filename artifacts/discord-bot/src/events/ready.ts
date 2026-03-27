import { Client, ActivityType, REST, Routes } from "discord.js";
import { GUILD_ID } from "../config.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default {
  name: "clientReady",
  once: true,
  async execute(client: Client) {
    console.log(`[Bot] Logged in as ${client.user?.tag}`);

    for (const [id, guild] of client.guilds.cache) {
      if (id !== GUILD_ID) {
        await guild.leave().catch(() => {});
      }
    }

    client.user?.setPresence({
      activities: [{ name: "your smile <3", type: ActivityType.Watching }],
      status: "online",
    });

    const commands: any[] = [];
    const commandsPath = path.join(__dirname, "../commands");
    const folders = fs.readdirSync(commandsPath);

    for (const folder of folders) {
      const folderPath = path.join(commandsPath, folder);
      if (!fs.statSync(folderPath).isDirectory()) continue;
      const files = fs
        .readdirSync(folderPath)
        .filter((f) => f.endsWith(".ts") || f.endsWith(".js"));
      for (const file of files) {
        const mod = await import(path.join(folderPath, file));
        const command = mod.default;
        if (command?.data) {
          commands.push(command.data.toJSON());
          (client as any).slashCommands.set(command.data.name, command);
        }
      }
    }

    const token = process.env.DISCORD_TOKEN!;
    const rest = new REST({ version: "10" }).setToken(token);
    try {
      await rest.put(
        Routes.applicationGuildCommands(client.user!.id, GUILD_ID),
        { body: commands }
      );
      console.log(`[Bot] Registered ${commands.length} slash commands.`);
    } catch (err) {
      console.error("[Bot] Failed to register slash commands:", err);
    }
  },
};
