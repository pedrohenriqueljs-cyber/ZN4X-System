const { REST, Routes } = require("discord.js");
const config = require("../config/config");
const { buildCommands } = require("./commands/admin");

async function main() {
  if (!config.token || String(config.token).startsWith("COLOQUE_")) {
    console.error("Configure o token em config/config.js");
    process.exit(1);
  }
  if (!config.guildId || String(config.guildId).startsWith("COLOQUE_")) {
    console.error("Configure o guildId em config/config.js");
    process.exit(1);
  }

  const rest = new REST({ version: "10" }).setToken(config.token);
  const commands = buildCommands();

  const app = await rest.get(Routes.oauth2CurrentApplication());
  await rest.put(
    Routes.applicationGuildCommands(app.id, config.guildId),
    { body: commands }
  );

  console.log("Comandos registrados.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
