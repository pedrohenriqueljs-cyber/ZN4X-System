const { hasAnyRole } = require("../utils/permissions");

function hasLink(text) {
  if (!text) return false;
  const s = String(text);
  const urlRegex = /(https?:\/\/|www\.)\S+/i;
  const inviteRegex = /(discord\.gg\/|discord\.com\/invite\/)\S+/i;
  return urlRegex.test(s) || inviteRegex.test(s);
}

function getAttachmentName(attachment) {
  if (!attachment) return "";
  return (attachment.name || attachment.filename || "").toLowerCase();
}

function endsWithAny(name, extList) {
  if (!name) return false;
  const lower = name.toLowerCase();
  return extList.some((ext) => lower.endsWith(ext));
}

function createViolationTracker() {
  const map = new Map();
  return {
    bump(userId, windowMs) {
      const t = Date.now();
      const arr = map.get(userId) || [];
      const filtered = arr.filter((x) => t - x < windowMs);
      filtered.push(t);
      map.set(userId, filtered);
      return filtered.length;
    }
  };
}

const tracker = createViolationTracker();

async function handleContentFilter(message, config) {
  if (!config.contentFilter?.enabled) return;
  if (!message.guild) return;
  if (message.author?.bot) return;

  const member = message.member;
  const exempt = hasAnyRole(member, config.exemptRoleIds || []);
  if (exempt) return;

  const cf = config.contentFilter;

  const shouldBlockLink = cf.blockLinks && hasLink(message.content);
  let shouldBlockFile = false;

  if (message.attachments && message.attachments.size > 0) {
    for (const att of message.attachments.values()) {
      const name = getAttachmentName(att);
      if (cf.blockExecutables && endsWithAny(name, cf.blockedExecutableExtensions || [])) {
        shouldBlockFile = true;
        break;
      }
      if (cf.blockScripts && endsWithAny(name, cf.blockedScriptExtensions || [])) {
        shouldBlockFile = true;
        break;
      }
    }
  }

  if (!(shouldBlockLink || shouldBlockFile)) return;

  // Delete the offending message
  await message.delete().catch(() => null);

  // Discord does not support truly "only the user can see" messages in normal chat.
  // Best-effort: send a warning message tagging the user, then delete it quickly.
  const warning = shouldBlockLink
    ? "Links are not allowed for your roles."
    : "This file type is not allowed for your roles.";

  const warnMsg = await message.channel
    .send({ content: `${message.author} ${warning}`, allowedMentions: { users: [message.author.id], roles: [], repliedUser: false } })
    .catch(() => null);

  if (warnMsg) {
    setTimeout(() => warnMsg.delete().catch(() => null), 5000);
  }

  // Flood protection: kick if repeated violations
  const vk = cf.violationKick;
  if (vk?.enabled) {
    const windowMs = (vk.windowSeconds || 20) * 1000;
    const count = tracker.bump(message.author.id, windowMs);
    const threshold = vk.threshold || 5;

    if (count >= threshold) {
      const m = await message.guild.members.fetch(message.author.id).catch(() => null);
      if (m && m.kickable) {
        await m.kick("ZN4X-System: Content Flood").catch(() => null);
      }
    }
  }
}

module.exports = {
  handleContentFilter
};
