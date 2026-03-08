module.exports = {
  token: process.env.TOKEN,
  guildId: "1320188940057055326",
  allowedAdminIds: [
    "1253451183759163505"
  ],
  exemptRoleIds: [
    "1320205232784932864",
    "1398119598858960937",
    "1396698811832864809"
  ],
  logs: {
    punishmentChannelId: "1477351652116664512"
  },
  antiRaid: {
    botAdd: {
      enabled: true
    },
    channelDelete: {
      enabled: true,
      threshold: 3,
      windowSeconds: 10
    },
    channelCreate: {
      enabled: true,
      threshold: 5,
      windowSeconds: 10
    },
    // Proteção contra Mass Ban
    // Se alguém banir X membros em Y segundos → é expulso e cargos removidos
    massBan: {
      enabled: true,
      threshold: 3,       // bans para acionar
      windowSeconds: 10   // janela de tempo
    },
    // Proteção contra Mass Role Delete
    // Se alguém deletar X cargos em Y segundos → é expulso e cargos removidos
    massRoleDelete: {
      enabled: true,
      threshold: 2,       // deleções para acionar
      windowSeconds: 10   // janela de tempo
    }
  },
  contentFilter: {
    enabled: true,
    blockLinks: true,
    blockExecutables: true,
    blockScripts: true,
    blockedScriptExtensions: [
      ".js",
      ".mjs",
      ".cjs",
      ".ts",
      ".py",
      ".lua",
      ".bat",
      ".cmd",
      ".ps1",
      ".vbs",
      ".sh",
      ".jar",
      ".scr",
      ".msi"
    ],
    blockedExecutableExtensions: [
      ".exe",
      ".dll",
      ".com"
    ],
    violationKick: {
      enabled: true,
      threshold: 5,
      windowSeconds: 20
    }
  }
};
