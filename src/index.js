require("dotenv").config();
const { Client, GatewayIntentBits, Partials } = require("discord.js");
const config = require("../config/config");
const { handleContentFilter } = require("./handlers/contentFilter");
const {
  handleBotAdded,
  setupAntiRaidChannelCreate,
  setupAntiNukeChannelDelete,
  setupAntiMassBan,
  setupAntiMassRoleDelete
} = require("./handlers/antiRaid");
const { handleInteraction } = require("./commands/admin");
const { buildErrorEmbed } = require("./utils/logger");

function must(value, name) {
  if (!value || String(value).startsWith("COLOQUE_")) {
    console.error(`Config inválida: ${name}`);
    process.exit(1);
  }
}

must(config.token, "token");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildModeration  // necessário para guildBanAdd
  ],
  partials: [Partials.Channel]
});

async function sendErrorLog(where, err, guild, user) {
  try {
    const channelId = config.logs?.punishmentChannelId;
    if (!channelId || !guild) return;
    const ch = await guild.channels.fetch(channelId).catch(() => null);
    if (!ch) return;
    const embed = buildErrorEmbed({
      where,
      error: err,
      guildName: guild.name,
      userTag: user?.tag || "Unknown"
    });
    await ch.send({ embeds: [embed] }).catch(() => null);
  } catch {
    return;
  }
}

client.once("ready", () => {
  console.log(`ZN4X-System online: ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  try {
    await handleContentFilter(message, config);
  } catch (err) {
    await sendErrorLog("messageCreate/contentFilter", err, message.guild, message.author);
  }
});

client.on("guildMemberAdd", async (member) => {
  try {
    await handleBotAdded(member, config);
  } catch (err) {
    await sendErrorLog("guildMemberAdd/antiRaid", err, member.guild, member.user);
  }
});

client.on("interactionCreate", async (interaction) => {
  try {
    await handleInteraction(interaction, config);
  } catch (err) {
    await sendErrorLog("interactionCreate/commands", err, interaction.guild, interaction.user);
  }
});

// Proteções anti-nuke
setupAntiRaidChannelCreate(client, config);
setupAntiNukeChannelDelete(client, config);
setupAntiMassBan(client, config);
setupAntiMassRoleDelete(client, config);

process.on("unhandledRejection", (reason) => {
  console.error("unhandledRejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("uncaughtException:", err);
});

client.login(config.token);

const express = require("express")
const app = express()

app.get("/", (req, res) => {
  res.send("ZN4X-System online")
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log("Web server rodando na porta " + PORT)
})
