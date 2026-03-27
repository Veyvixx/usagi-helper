import { Client } from "discord.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function loadEvents(client: Client) {
  const eventsPath = path.join(__dirname, "../events");
  const files = fs.readdirSync(eventsPath).filter((f) => f.endsWith(".ts") || f.endsWith(".js"));

  for (const file of files) {
    const mod = await import(path.join(eventsPath, file));
    const event = mod.default;
    if (!event?.name) continue;
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args, client));
    } else {
      client.on(event.name, (...args) => event.execute(...args, client));
    }
  }

  console.log(`[Events] Loaded ${files.length} events.`);
}
