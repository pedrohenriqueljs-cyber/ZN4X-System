# ZN4X-System

Bot geral com Anti-Raid + Proteção de Conteúdo.

## Funções
- Anti-raid ao adicionar bot/app: expulsa o usuário que adicionou e expulsa o bot imediatamente.
- Anti-nuke ao deletar muitos canais: expulsa quem estiver deletando canais em massa (exceto dono do servidor).
- Proteção de conteúdo: bloqueia links e bloqueia arquivos perigosos (exe + scripts) para quem não tiver cargos permitidos.
- Logs no canal (embed igual ao estilo da foto: "User Punished" + campos).
- DM para o dono do servidor quando alguém tentar adicionar bot/app e for punido.
- Comandos admin (slash) e somente IDs permitidos no config podem usar.

## Instalação
1) Instale Node.js 18+.
2) No terminal dentro da pasta do projeto:
   - `npm install`
3) Configure `config/config.js` (token, ids, cargos, canal de logs, etc).
4) Registre os comandos no seu servidor:
   - `npm run deploy`
5) Inicie:
   - `npm start`

## Permissões do bot
- View Audit Log
- Kick Members
- Read Messages / Send Messages / Embed Links
- Read Message History


## Aviso importante
O Discord não permite mensagem realmente invisível para os outros no chat normal (isso só existe como ephemeral em interações). O bot apaga a mensagem proibida e envia um aviso no canal que é removido em poucos segundos.
