import { Message, TextChannel } from "discord.js";
import { embed, errorEmbed, sendLog } from "../../utils.js";

export default {
  name: "purge",
  description: "Bulk delete messages",
  usage: ",purge 100  OR  ,purge @user",
  async execute(message: Message, args: string[]) {
    if (!message.member?.permissions.has("ManageMessages")) {
      return message.reply({ embeds: [errorEmbed("You don't have permission to purge messages.")] });
    }
    const channel = message.channel as TextChannel;

    // Check if arg is a user mention
    const targetUser = message.mentions.users.first();

    if (targetUser) {
      // Purge messages by user (last 100)
      const msgs = await channel.messages.fetch({ limit: 100 });
      const toDelete = msgs.filter(m => m.author.id === targetUser.id);
      if (toDelete.size === 0) return message.reply({ embeds: [errorEmbed("No recent messages found from that user.")] });
      await channel.bulkDelete(toDelete, true);

      const e = embed("🗑️ Purged User Messages")
        .addFields(
          { name: "User", value: `${targetUser.tag}`, inline: true },
          { name: "Deleted", value: `${toDelete.size}`, inline: true },
          { name: "Channel", value: `<#${channel.id}>`, inline: true }
        ).setTimestamp();
      const reply = await message.channel.send({ embeds: [e] });
      setTimeout(() => reply.delete().catch(() => {}), 5000);
      await sendLog(message.guild!, e);
    } else {
      const amount = parseInt(args[0]);
      if (isNaN(amount) || amount < 1 || amount > 100) {
        return message.reply({ embeds: [errorEmbed("Please provide a number between 1 and 100.")] });
      }
      // Delete including the command message
      const msgs = await channel.messages.fetch({ limit: amount + 1 });
      const deleted = await channel.bulkDelete(msgs, true);

      const e = embed("🗑️ Messages Purged")
        .addFields(
          { name: "Deleted", value: `${deleted.size}`, inline: true },
          { name: "Channel", value: `<#${channel.id}>`, inline: true },
          { name: "Moderator", value: message.author.tag, inline: true }
        ).setTimestamp();
      const reply = await message.channel.send({ embeds: [e] });
      setTimeout(() => reply.delete().catch(() => {}), 5000);
      await sendLog(message.guild!, e);
    }
  },
};
