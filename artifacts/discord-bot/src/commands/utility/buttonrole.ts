import {
  Message,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  TextChannel,
} from "discord.js";
import { embed, errorEmbed } from "../../utils.js";
import { getDb } from "../../db.js";

export default {
  name: "buttonrole",
  aliases: ["br"],
  description: "Send a button-role message",
  usage: ",buttonrole @role [button label]",
  async execute(message: Message, args: string[]) {
    if (!message.member?.permissions.has("ManageRoles")) {
      return message.reply({ embeds: [errorEmbed("You need Manage Roles permission.")] });
    }
    const role = message.mentions.roles.first();
    if (!role) return message.reply({ embeds: [errorEmbed("Please mention a role.")] });

    const label = args.slice(1).join(" ") || `Get ${role.name}`;
    const customId = `brole_${role.id}_${Date.now()}`;

    const btn = new ButtonBuilder()
      .setCustomId(customId)
      .setLabel(label)
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(btn);

    const sent = await (message.channel as TextChannel).send({
      embeds: [embed("🎭 Role Menu", `Click the button below to get/remove the **${role.name}** role.`)],
      components: [row],
    });

    const db = getDb();
    db.prepare(
      "INSERT INTO button_roles (guild_id, channel_id, message_id, custom_id, role_id) VALUES (?, ?, ?, ?, ?)"
    ).run(message.guild!.id, message.channel.id, sent.id, customId, role.id);

    await message.reply({ embeds: [embed("✅ Button Role Created", `Users can click the button to toggle the ${role} role.`)] });
    await message.delete().catch(() => {});
  },
};
