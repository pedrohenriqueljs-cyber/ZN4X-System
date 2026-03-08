const { EmbedBuilder } = require("discord.js");

function clamp(text, max = 3800) {
  if (!text) return "";
  const s = String(text);
  if (s.length <= max) return s;
  return s.slice(0, max - 3) + "...";
}

function buildPunishEmbed({ serverName, userTag, action, punishmentType }) {
  return new EmbedBuilder()
    .setTitle("User Punished")
    .setDescription("Anti Raid has punished a user, details:")
    .addFields(
      { name: "Server:", value: serverName || "Unknown", inline: false },
      { name: "User:", value: userTag || "Unknown", inline: false },
      { name: "Action", value: action || "Unknown", inline: false },
      { name: "Punishment Type", value: punishmentType || "Kick", inline: false }
    )
    .setTimestamp(new Date());
}

function buildErrorEmbed({ where, error, guildName, userTag }) {
  const errText = clamp(error && (error.stack || error.message || String(error)), 3800);
  return new EmbedBuilder()
    .setTitle("Error")
    .setDescription("A runtime error occurred.")
    .addFields(
      { name: "Where", value: where || "Unknown", inline: false },
      { name: "Server", value: guildName || "Unknown", inline: false },
      { name: "User", value: userTag || "Unknown", inline: false },
      { name: "Details", value: "```" + clamp(errText, 3900) + "```", inline: false }
    )
    .setTimestamp(new Date());
}

module.exports = {
  buildPunishEmbed,
  buildErrorEmbed
};
