import { Client, Collection } from "discord.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function loadCommands(client: Client) {
  const commands = new Collection<string, any>();
  const commandsPath = path.join(__dirname, "../commands");
  const folders = fs.readdirSync(commandsPath);

  for (const folder of folders) {
    const folderPath = path.join(commandsPath, folder);
    if (!fs.statSync(folderPath).isDirectory()) continue;
    const files = fs.readdirSync(folderPath).filter((f) => f.endsWith(".ts") || f.endsWith(".js"));
    for (const file of files) {
      const mod = await import(path.join(folderPath, file));
      const command = mod.default;
      if (command?.name) {
        commands.set(command.name, command);
        if (command.aliases) {
          for (const alias of command.aliases) {
            commands.set(alias, command);
          }
        }
      }
    }
  }

  (client as any).commands = commands;
  console.log(`[Commands] Loaded ${commands.size} commands.`);
}
