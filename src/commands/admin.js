const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { isAllowedAdmin } = require("../utils/permissions");
const { buildPunishEmbed } = require("../utils/logger");

function buildCommands() {
  const admin = new SlashCommandBuilder()
    .setName("zn4x")
    .setDescription("Admin commands for ZN4X-System")
    .addSubcommand((s) =>
      s.setName("status")
        .setDescription("Show bot status and config summary")
    )
    .addSubcommand((s) =>
      s.setName("testlog")
        .setDescription("Send a test punish log embed")
        .addStringOption((o) => o.setName("action").setDescription("Action text").setRequired(true))
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

  return [admin.toJSON()];
}

async function handleInteraction(interaction, config) {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== "zn4x") return;

  const allowed = isAllowedAdmin(interaction.user.id, config);
  if (!allowed) {
    await interaction.reply({ content: "You are not allowed to use this bot.", ephemeral: true }).catch(() => null);
    return;
  }

  const sub = interaction.options.getSubcommand();

  if (sub === "status") {
    const msg =
      `**Server:** ${interaction.guild?.name || "Unknown"}\n` +
      `**Anti bot-add:** ${config.antiRaid?.botAdd?.enabled ? "✅" : "❌"}\n` +
      `**Anti channel-delete:** ${config.antiRaid?.channelDelete?.enabled ? "✅" : "❌"} (threshold: ${config.antiRaid?.channelDelete?.threshold || 3})\n` +
      `**Anti channel-create:** ${config.antiRaid?.channelCreate?.enabled ? "✅" : "❌"} (threshold: ${config.antiRaid?.channelCreate?.threshold || 5})\n` +
      `**Anti mass-ban:** ${config.antiRaid?.massBan?.enabled ? "✅" : "❌"} (threshold: ${config.antiRaid?.massBan?.threshold || 3})\n` +
      `**Anti mass-role-delete:** ${config.antiRaid?.massRoleDelete?.enabled ? "✅" : "❌"} (threshold: ${config.antiRaid?.massRoleDelete?.threshold || 2})\n` +
      `**Filter links:** ${config.contentFilter?.blockLinks ? "✅" : "❌"}\n` +
      `**Filter exe/scripts:** ${(config.contentFilter?.blockExecutables || config.contentFilter?.blockScripts) ? "✅" : "❌"}\n` +
      `**Remove roles on kick:** ✅ (sempre ativo)`;
    await interaction.reply({ content: msg, ephemeral: true }).catch(() => null);
    return;
  }

  if (sub === "testlog") {
    const action = interaction.options.getString("action", true);
    const embed = buildPunishEmbed({
      serverName: interaction.guild?.name || "Unknown",
      userTag: interaction.user.tag || "Unknown",
      action,
      punishmentType: "Kick"
    });

    const chId = config.logs?.punishmentChannelId;
    const ch = chId ? await interaction.guild.channels.fetch(chId).catch(() => null) : null;
    if (!ch) {
      await interaction.reply({ content: "Punishment log channel is not set or not found.", ephemeral: true }).catch(() => null);
      return;
    }

    await ch.send({ embeds: [embed] }).catch(() => null);
    await interaction.reply({ content: "Sent.", ephemeral: true }).catch(() => null);
    return;
  }
}

module.exports = {
  buildCommands,
  handleInteraction
};
