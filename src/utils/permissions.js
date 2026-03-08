function hasAnyRole(member, roleIds = []) {
  if (!member || !member.roles) return false;
  return roleIds.some((id) => member.roles.cache.has(id));
}

function isAllowedAdmin(userId, config) {
  return Array.isArray(config.allowedAdminIds) && config.allowedAdminIds.includes(userId);
}

module.exports = {
  hasAnyRole,
  isAllowedAdmin
};
