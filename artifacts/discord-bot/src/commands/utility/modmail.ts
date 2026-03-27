import { Message, TextChannel } from "discord.js";
import { embed, errorEmbed } from "../../utils.js";
import { getDb } from "../../db.js";

export default {
  name: "modmailreply",
  aliases: ["mmreply", "mr"],
  description: "Reply to a modmail thread (use in the thread channel)",
  usage: ",mr <message>",
  async execute(message: Message, args: string[]) {
    if (!message.member?.permissions.has("ModerateMembers")) {
      return message.reply({ embeds: [errorEmbed("You don't have permission.")] });
    }

    const db = getDb();
    const thread = db.prepare(
      "SELECT user_id FROM modmail_threads WHERE guild_id = ? AND thread_channel_id = ? AND open = 1"
    ).get(message.guild!.id, message.channel.id) as any;

    if (!thread) {
      return message.reply({ embeds: [errorEmbed("This channel is not an active modmail thread.")] });
    }

    const replyContent = args.join(" ");
    if (!replyContent) return message.reply({ embeds: [errorEmbed("Please provide a message to send.")] });

    try {
      const user = await message.client.users.fetch(thread.user_id);
      await user.send({
        embeds: [embed("📬 Staff Reply", replyContent)
          .setFooter({ text: message.guild!.name })
          .setTimestamp()]
      });
      await message.reply({ embeds: [embed("✅ Reply Sent", `Your message was sent to the user.`)] });
    } catch {
      await message.reply({ embeds: [errorEmbed("Could not send message to user. They may have DMs disabled.")] });
    }
  },
};
