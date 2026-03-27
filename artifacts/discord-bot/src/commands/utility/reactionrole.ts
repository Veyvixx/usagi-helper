import { Message } from "discord.js";
import { embed, errorEmbed } from "../../utils.js";
import { getDb } from "../../db.js";

export default {
  name: "reactionrole",
  aliases: ["rr"],
  description: "Create a reaction role on a message",
  usage: ",reactionrole <messageId> <emoji> @role",
  async execute(message: Message, args: string[]) {
    if (!message.member?.permissions.has("ManageRoles")) {
      return message.reply({ embeds: [errorEmbed("You need Manage Roles permission.")] });
    }

    const [messageId, emojiRaw] = args;
    const role = message.mentions.roles.first();

    if (!messageId || !emojiRaw || !role) {
      return message.reply({
        embeds: [embed("📖 Reaction Role Usage",
          "`,reactionrole <messageId> <emoji> @role`\n\n" +
          "**Example:**\n`,reactionrole 123456789 🎮 @Gamer`\n\n" +
          "React to the target message first, then run this command."
        )]
      });
    }

    let targetMsg;
    try {
      targetMsg = await message.channel.messages.fetch(messageId);
    } catch {
      return message.reply({ embeds: [errorEmbed("Could not find that message in this channel.")] });
    }

    // Normalize emoji
    const emojiMatch = emojiRaw.match(/^<a?:(\w+):(\d+)>$/);
    const emojiKey = emojiMatch ? emojiRaw : emojiRaw;

    const db = getDb();
    db.prepare(
      "INSERT INTO reaction_roles (guild_id, channel_id, message_id, emoji, role_id) VALUES (?, ?, ?, ?, ?)"
    ).run(message.guild!.id, message.channel.id, messageId, emojiKey, role.id);

    // Add the reaction to the target message
    try {
      await targetMsg.react(emojiKey);
    } catch {
      return message.reply({ embeds: [errorEmbed("Could not react with that emoji. Make sure the bot has access to it.")] });
    }

    await message.reply({
      embeds: [embed("✅ Reaction Role Created",
        `Reacting with ${emojiKey} on [that message](${targetMsg.url}) will give the ${role} role.`
      )]
    });
  },
};
