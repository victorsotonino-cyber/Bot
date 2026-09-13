// deploy-commands.js
// Registra todos los comandos Slash del bot en Discord (Discord.js v14)
require('dotenv').config();
const { REST, Routes, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

const commands = [
  // TICKETS
  new SlashCommandBuilder()
    .setName('panel')
    .setDescription('Envía el panel interactivo de soporte en el canal')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption((opt) => opt.setName('canal').setDescription('Canal donde publicar el panel').setRequired(false))
    .addStringOption((opt) => opt.setName('modo_visual').setDescription('Formato del panel (buttons, select o hybrid)').setRequired(false)),
  
  new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Comandos de gestión de tickets')
    .addSubcommand((sub) =>
      sub.setName('close').setDescription('Cierra el ticket actual')
        .addStringOption((o) => o.setName('razon').setDescription('Motivo de cierre'))
    )
    .addSubcommand((sub) => sub.setName('claim').setDescription('Reclama el ticket actual para ti'))
    .addSubcommand((sub) => sub.setName('unclaim').setDescription('Libera el ticket reclamado'))
    .addSubcommand((sub) =>
      sub.setName('add').setDescription('Añade un usuario al ticket')
        .addUserOption((o) => o.setName('usuario').setDescription('Usuario a añadir').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub.setName('remove').setDescription('Remueve un usuario del ticket')
        .addUserOption((o) => o.setName('usuario').setDescription('Usuario a remover').setRequired(true))
    )
    .addSubcommand((sub) => sub.setName('transcript').setDescription('Genera el archivo con el historial del ticket')),

  // TIENDA & ECONOMÍA
  new SlashCommandBuilder().setName('tienda').setDescription('Muestra el catálogo interactivo de la tienda'),
  new SlashCommandBuilder().setName('metodos').setDescription('Muestra los métodos de pago aceptados'),
  new SlashCommandBuilder()
    .setName('comprar')
    .setDescription('Inicia el ticket de compra de un producto')
    .addStringOption((o) => o.setName('producto').setDescription('Nombre o ID del artículo').setRequired(true)),
  new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Consulta tu balance de monedas virtuales')
    .addUserOption((o) => o.setName('usuario').setDescription('Usuario a consultar')),
  new SlashCommandBuilder()
    .setName('pagar')
    .setDescription('Transfiere monedas virtuales a otro usuario')
    .addUserOption((o) => o.setName('usuario').setDescription('Destinatario').setRequired(true))
    .addIntegerOption((o) => o.setName('cantidad').setDescription('Monto a transferir').setRequired(true)),

  // MODERACIÓN
  new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Banea a un miembro del servidor')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption((o) => o.setName('usuario').setDescription('Usuario a banear').setRequired(true))
    .addStringOption((o) => o.setName('razon').setDescription('Motivo del baneo')),
  new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Expulsa a un miembro del servidor')
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption((o) => o.setName('usuario').setDescription('Usuario a expulsar').setRequired(true))
    .addStringOption((o) => o.setName('razon').setDescription('Motivo de expulsión')),
  new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Aísla temporalmente a un miembro')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((o) => o.setName('usuario').setDescription('Usuario a sancionar').setRequired(true))
    .addStringOption((o) => o.setName('duracion').setDescription('Ej: 10m, 1h, 1d').setRequired(true))
    .addStringOption((o) => o.setName('razon').setDescription('Motivo')),
  new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Aplica una advertencia formal')
    .addUserOption((o) => o.setName('usuario').setDescription('Usuario a advertir').setRequired(true))
    .addStringOption((o) => o.setName('razon').setDescription('Motivo').setRequired(true)),
  new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Elimina mensajes masivamente')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addIntegerOption((o) => o.setName('cantidad').setDescription('Número de mensajes (1-100)').setRequired(true)),

  // BIENVENIDAS & ROLES
  new SlashCommandBuilder().setName('welcome').setDescription('Comandos del módulo de bienvenida')
    .addSubcommand((sub) => sub.setName('test').setDescription('Prueba el mensaje de bienvenida')),
  new SlashCommandBuilder()
    .setName('autorole')
    .setDescription('Configura el rol automático de bienvenida')
    .addRoleOption((o) => o.setName('rol').setDescription('Rol automático').setRequired(true)),

  // SORTEOS (GIVEAWAYS)
  new SlashCommandBuilder()
    .setName('giveaway')
    .setDescription('Gestiona sorteos en el servidor')
    .addSubcommand((sub) =>
      sub.setName('start').setDescription('Inicia un sorteo interactivo')
        .addStringOption((o) => o.setName('premio').setDescription('Premio a sortear').setRequired(true))
        .addIntegerOption((o) => o.setName('ganadores').setDescription('Cantidad de ganadores').setRequired(true))
        .addStringOption((o) => o.setName('duracion').setDescription('Ej: 10m, 24h').setRequired(true))
    ),

  // UTILIDADES
  new SlashCommandBuilder().setName('serverinfo').setDescription('Muestra información y estadísticas del servidor'),
  new SlashCommandBuilder().setName('ping').setDescription('Muestra la latencia del bot'),
].map((command) => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log('⏳ Registrando comandos slash en Discord API v10...');
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands }
    );
    console.log(`✅ ¡Éxito! ${commands.length} comandos Slash registrados para el servidor.`);
  } catch (error) {
    console.error('❌ Error al registrar comandos:', error);
  }
})();
  
