const { AuditLogEvent } = require("discord.js");
const { buildPunishEmbed } = require("../utils/logger");

function userTag(user) {
  if (!user) return "Unknown";
  return user.tag || `${user.username || "Unknown"}#${user.discriminator || "0000"}`;
}

async function sendPunishLog(guild, channelId, payload) {
  if (!guild || !channelId) return;
  const ch = await guild.channels.fetch(channelId).catch(() => null);
  if (!ch) return;
  const embed = buildPunishEmbed(payload);
  await ch.send({ embeds: [embed] }).catch(() => null);
}

async function dmOwner(guild, text) {
  if (!guild) return;
  const ownerId = guild.ownerId;
  if (!ownerId) return;
  const owner = await guild.client.users.fetch(ownerId).catch(() => null);
  if (!owner) return;
  await owner.send(text).catch(() => null);
}

// Remove todos os cargos do membro antes do kick
// Garante que o usuário não volta com cargos ao ser re-adicionado
async function removeAllRoles(member) {
  try {
    const rolesToRemove = member.roles.cache.filter((r) => r.id !== member.guild.id);
    if (rolesToRemove.size === 0) return;
    await member.roles.remove(rolesToRemove, "ZN4X-System: Pre-kick role removal").catch(() => null);
  } catch {
    // silenciar erros de permissão
  }
}

async function kickMemberSafe(guild, memberId, reason) {
  const member = await guild.members.fetch(memberId).catch(() => null);
  if (!member) return false;
  if (!member.kickable) return false;

  // Remove todos os cargos ANTES do kick
  await removeAllRoles(member);

  await member.kick(reason).catch(() => null);
  return true;
}

function createTracker() {
  const map = new Map();
  return {
    bump(executorId, windowMs) {
      const t = Date.now();
      const arr = map.get(executorId) || [];
      const filtered = arr.filter((x) => t - x < windowMs);
      filtered.push(t);
      map.set(executorId, filtered);
      return filtered.length;
    },
    reset(executorId) {
      map.delete(executorId);
    }
  };
}

// ─── Bot Add ───────────────────────────────────────────────────────────────────

async function handleBotAdded(member, config) {
  if (!config.antiRaid?.botAdd?.enabled) return;
  if (!member?.guild) return;
  if (!member.user?.bot) return;

  const guild = member.guild;
  const ownerId = guild.ownerId;

  const logs = await guild.fetchAuditLogs({ type: AuditLogEvent.BotAdd, limit: 5 }).catch(() => null);
  if (!logs) return;
  const entry = logs.entries.find((e) => e.target?.id === member.id) || logs.entries.first();
  if (!entry) return;

  const executor = entry.executor;
  if (!executor) return;
  if (executor.id === ownerId) return;
  if (executor.id === guild.client.user.id) return;

  await kickMemberSafe(guild, member.id, "ZN4X-System: Bot Added");
  await kickMemberSafe(guild, executor.id, "ZN4X-System: Adding Bots");

  await sendPunishLog(guild, config.logs?.punishmentChannelId, {
    serverName: guild.name,
    userTag: userTag(executor),
    action: "Adding Bots",
    punishmentType: "Kick"
  });

  await dmOwner(
    guild,
    `ZN4X-System punished a user.\nServer: ${guild.name}\nUser: ${userTag(executor)}\nAction: Adding Bots\nPunishment Type: Kick`
  );
}

// ─── Anti Channel Create ───────────────────────────────────────────────────────

function setupAntiRaidChannelCreate(client, config) {
  const tracker = createTracker();
  client.on("channelCreate", async (channel) => {
    try {
      if (!config.antiRaid?.channelCreate?.enabled) return;
      const guild = channel.guild;
      if (!guild) return;

      const ownerId = guild.ownerId;
      const logs = await guild.fetchAuditLogs({ type: AuditLogEvent.ChannelCreate, limit: 5 }).catch(() => null);
      if (!logs) return;

      const entry = logs.entries.first();
      if (!entry) return;

      const executor = entry.executor;
      if (!executor) return;
      if (executor.id === ownerId) return;
      if (executor.id === guild.client.user.id) return;

      const windowMs = (config.antiRaid.channelCreate.windowSeconds || 10) * 1000;
      const count = tracker.bump(executor.id, windowMs);
      const threshold = config.antiRaid.channelCreate.threshold || 5;

      if (count >= threshold) {
        tracker.reset(executor.id);
        await kickMemberSafe(guild, executor.id, "ZN4X-System: Creating Channels");

        await sendPunishLog(guild, config.logs?.punishmentChannelId, {
          serverName: guild.name,
          userTag: userTag(executor),
          action: "Creating Channels",
          punishmentType: "Kick"
        });

        await dmOwner(
          guild,
          `ZN4X-System punished a user.\nServer: ${guild.name}\nUser: ${userTag(executor)}\nAction: Creating Channels\nPunishment Type: Kick`
        );
      }
    } catch {
      return;
    }
  });
}

// ─── Anti Channel Delete ───────────────────────────────────────────────────────

function setupAntiNukeChannelDelete(client, config) {
  const tracker = createTracker();
  client.on("channelDelete", async (channel) => {
    try {
      if (!config.antiRaid?.channelDelete?.enabled) return;
      const guild = channel.guild;
      if (!guild) return;

      const ownerId = guild.ownerId;
      const logs = await guild.fetchAuditLogs({ type: AuditLogEvent.ChannelDelete, limit: 5 }).catch(() => null);
      if (!logs) return;

      const entry = logs.entries.first();
      if (!entry) return;

      const executor = entry.executor;
      if (!executor) return;
      if (executor.id === ownerId) return;
      if (executor.id === guild.client.user.id) return;

      const windowMs = (config.antiRaid.channelDelete.windowSeconds || 10) * 1000;
      const count = tracker.bump(executor.id, windowMs);
      const threshold = config.antiRaid.channelDelete.threshold || 3;

      if (count >= threshold) {
        tracker.reset(executor.id);
        await kickMemberSafe(guild, executor.id, "ZN4X-System: Deleting Channels");

        await sendPunishLog(guild, config.logs?.punishmentChannelId, {
          serverName: guild.name,
          userTag: userTag(executor),
          action: "Deleting Channels",
          punishmentType: "Kick"
        });

        await dmOwner(
          guild,
          `ZN4X-System punished a user.\nServer: ${guild.name}\nUser: ${userTag(executor)}\nAction: Deleting Channels\nPunishment Type: Kick`
        );
      }
    } catch {
      return;
    }
  });
}

// ─── Anti Mass Ban ─────────────────────────────────────────────────────────────
// Detecta bans em massa (ex: 3 bans em 10 segundos) e expulsa o executor

function setupAntiMassBan(client, config) {
  const tracker = createTracker();
  client.on("guildBanAdd", async (ban) => {
    try {
      if (!config.antiRaid?.massBan?.enabled) return;
      const guild = ban.guild;
      if (!guild) return;

      const ownerId = guild.ownerId;
      const logs = await guild.fetchAuditLogs({ type: AuditLogEvent.MemberBanAdd, limit: 5 }).catch(() => null);
      if (!logs) return;

      const entry = logs.entries.first();
      if (!entry) return;

      const executor = entry.executor;
      if (!executor) return;
      if (executor.id === ownerId) return;
      if (executor.id === guild.client.user.id) return;

      const windowMs = (config.antiRaid.massBan.windowSeconds || 10) * 1000;
      const count = tracker.bump(executor.id, windowMs);
      const threshold = config.antiRaid.massBan.threshold || 3;

      if (count >= threshold) {
        tracker.reset(executor.id);
        await kickMemberSafe(guild, executor.id, "ZN4X-System: Mass Banning Members");

        await sendPunishLog(guild, config.logs?.punishmentChannelId, {
          serverName: guild.name,
          userTag: userTag(executor),
          action: "Mass Ban",
          punishmentType: "Kick"
        });

        await dmOwner(
          guild,
          `ZN4X-System punished a user.\nServer: ${guild.name}\nUser: ${userTag(executor)}\nAction: Mass Ban\nPunishment Type: Kick`
        );
      }
    } catch {
      return;
    }
  });
}

// ─── Anti Mass Role Delete ─────────────────────────────────────────────────────
// Detecta deleção de cargos em sequência e expulsa o executor

function setupAntiMassRoleDelete(client, config) {
  const tracker = createTracker();
  client.on("roleDelete", async (role) => {
    try {
      if (!config.antiRaid?.massRoleDelete?.enabled) return;
      const guild = role.guild;
      if (!guild) return;

      const ownerId = guild.ownerId;
      const logs = await guild.fetchAuditLogs({ type: AuditLogEvent.RoleDelete, limit: 5 }).catch(() => null);
      if (!logs) return;

      const entry = logs.entries.first();
      if (!entry) return;

      const executor = entry.executor;
      if (!executor) return;
      if (executor.id === ownerId) return;
      if (executor.id === guild.client.user.id) return;

      const windowMs = (config.antiRaid.massRoleDelete.windowSeconds || 10) * 1000;
      const count = tracker.bump(executor.id, windowMs);
      const threshold = config.antiRaid.massRoleDelete.threshold || 2;

      if (count >= threshold) {
        tracker.reset(executor.id);
        await kickMemberSafe(guild, executor.id, "ZN4X-System: Mass Role Delete");

        await sendPunishLog(guild, config.logs?.punishmentChannelId, {
          serverName: guild.name,
          userTag: userTag(executor),
          action: "Mass Role Delete",
          punishmentType: "Kick"
        });

        await dmOwner(
          guild,
          `ZN4X-System punished a user.\nServer: ${guild.name}\nUser: ${userTag(executor)}\nAction: Mass Role Delete\nPunishment Type: Kick`
        );
      }
    } catch {
      return;
    }
  });
}

module.exports = {
  handleBotAdded,
  setupAntiRaidChannelCreate,
  setupAntiNukeChannelDelete,
  setupAntiMassBan,
  setupAntiMassRoleDelete
};
