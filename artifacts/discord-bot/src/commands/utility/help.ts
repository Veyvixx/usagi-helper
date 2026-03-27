import { Message, EmbedBuilder } from "discord.js";
import { EMBED_COLOR } from "../../config.js";

export default {
  name: "help",
  description: "Show all commands",
  usage: ",help",
  async execute(message: Message, args: string[]) {
    const e = new EmbedBuilder()
      .setColor(EMBED_COLOR)
      .setTitle("🥚 gegg boi — Command List")
      .setDescription("Prefix: `,`  |  All embeds in gold `#f4b729`")
      .addFields(
        {
          name: "⚠️ Moderation",
          value: [
            "`,warn @user [reason]` — Warn a user",
            "`,warnings @user` — View warning history",
            "`,history @user` — View mod action history",
            "`,timeout @user 10m [reason]` — Timeout a user",
            "`,untimeout @user` — Remove timeout",
            "`,mute @user 10m [reason]` — Mute (requires mute role)",
            "`,unmute @user` — Unmute",
            "`,imute @user` — Block media/embeds",
            "`,iunmute @user` — Unblock media/embeds",
            "`,rmute @user` — Block reactions/emojis",
            "`,runmute @user` — Unblock reactions/emojis",
            "`,kick @user [reason]` — Kick a user",
            "`,softban @user [reason]` — Ban + unban to wipe messages",
            "`,tempban @user 2d [reason]` — Temporary ban",
            "`,hardban @user [reason]` — Full ban (deletes 7d history)",
            "`,unban <userId> [reason]` — Unban a user",
            "`,jail @user 30m [reason]` — Jail a user",
            "`,unjail @user` — Unjail a user",
            "`,purge 100` — Bulk delete messages",
            "`,purge @user` — Delete user's recent messages",
            "`,slowmode 10s` — Set channel slowmode",
            "`,lockdown #channel` — Lock a channel",
            "`,unlock #channel` — Unlock a channel",
            "`,topic [text]` — Set channel topic",
            "`,nuke #channel` — Clone + wipe channel",
            "`,drag @user #vc` — Move user to VC",
            "`,revokefiles @user` — Revoke file access",
            "`,modstats @role` — View mod stats for role",
          ].join("\n"),
        },
        {
          name: "🎭 Roles",
          value: [
            "`,reactionrole <msgId> <emoji> @role` — Reaction role",
            "`,buttonrole @role [label]` — Button role",
          ].join("\n"),
        },
        {
          name: "📬 ModMail",
          value: [
            "DM the bot to open a modmail thread",
            "`,mr <message>` — Reply to a thread (in thread channel)",
          ].join("\n"),
        },
        {
          name: "⚙️ Setup (Manage Server)",
          value: [
            "`,setlogchannel #channel` — Set log channel",
            "`,setmodmailchannel #channel` — Set modmail channel",
            "`,setmuterole @role` — Set mute role",
            "`,setjailrole @role` — Set jail role",
          ].join("\n"),
        }
      )
      .setTimestamp();

    await message.reply({ embeds: [e] });
  },
};
