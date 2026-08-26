const { 
    Client, 
    GatewayIntentBits, 
    REST, 
    Routes, 
    SlashCommandBuilder, 
    ChannelType, 
    PermissionsBitField, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    StringSelectMenuBuilder, 
    EmbedBuilder,
    Events 
} = require('discord.js');

const TOKEN = process.env.TOKEN;
const STAFF_ROLE_ID = "1536191456694239271";
const TICKET_CATEGORY_ID = "1541179201648992296";
const TIENDA_URL = "https://blackmarket-sable.vercel.app/";

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// Comandos esenciales (Solo lo importante)
const commands = [
    new SlashCommandBuilder().setName('ayuda').setDescription('Muestra el centro de asistencia'),
    new SlashCommandBuilder().setName('tienda').setDescription('Enlace y acceso a la tienda web oficial'),
    new SlashCommandBuilder().setName('ticket').setDescription('Despliega el panel principal de soporte'),
    new SlashCommandBuilder().setName('ping').setDescription('Mide la latencia del bot')
].map(command => command.toJSON());

client.once(Events.ClientReady, async () => {
    console.log(`¡Bot Black Market conectado como ${client.user.tag}!`);

    const rest = new REST({ version: '10' }).setToken(TOKEN);
    try {
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
        console.log('¡Comandos esenciales registrados!');
    } catch (error) {
        console.error(error);
    }
});

client.on('interactionCreate', async interaction => {
    try {
        if (interaction.isChatInputCommand()) {
            const { commandName } = interaction;

            if (commandName === 'ayuda') {
                const embed = new EmbedBuilder()
                    .setColor('#5865F2')
                    .setTitle('🛠️ • Centro de Asistencia & Black Market')
                    .setDescription('Comandos principales disponibles:')
                    .addFields(
                        { name: '🎫 `/ticket`', value: 'Despliega el panel de soporte con menú desplegable.' },
                        { name: '🛍️ `/tienda`', value: 'Acceso directo a la tienda web y métodos de pago.' }
                    )
                    .setTimestamp();

                await interaction.reply({ embeds: [embed], ephemeral: true });
            } 
            else if (commandName === 'tienda') {
                const embed = new EmbedBuilder()
                    .setColor('#22c55e')
                    .setTitle('🛒 Tienda Oficial • Black Market')
                    .setDescription('Explora nuestro catálogo digital y adquiere tus productos de forma segura.\n\n🔗 ' + TIENDA_URL)
                    .setTimestamp();

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setLabel('Visitar Tienda Web')
                        .setStyle(ButtonStyle.Link)
                        .setURL(TIENDA_URL)
                        .setEmoji('🌐'),
                    new ButtonBuilder()
                        .setCustomId('btn_ver_colombia')
                        .setLabel('Ver Nequi')
                        .setStyle(ButtonStyle.Success)
                        .setEmoji('💳')
                );

                await interaction.reply({ embeds: [embed], components: [row] });
            }
            else if (commandName === 'ticket') {
                const embed = new EmbedBuilder()
                    .setColor('#2b2d31')
                    .setTitle('🎫 • Sistema de Soporte & Atención • 🎫')
                    .setDescription('Selecciona una categoría en el menú de abajo para abrir un ticket privado con el staff:\n\n' +
                        '📋 **- Soporte General**\n' +
                        '🛍️ **- Compras / Pagos**\n' +
                        '🎁 **- Reclamar Premios**\n' +
                        '⚠️ **- Reportes / Quejas**')
                    .setTimestamp();

                const row = new ActionRowBuilder().addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('select_ticket_category')
                        .setPlaceholder('Selecciona el motivo de tu ticket...')
                        .addOptions([
                            { label: 'Soporte General', value: 'cat_soporte', emoji: '📋' },
                            { label: 'Comprar / Pagos', value: 'cat_comprar', emoji: '🛍️' },
                            { label: 'Reclamar Recompensa', value: 'cat_reclamar', emoji: '🎁' },
                            { label: 'Quejas / Reportes', value: 'cat_quejas', emoji: '⚠️' }
                        ])
                );

                await interaction.reply({ embeds: [embed], components: [row] });
            }
            else if (commandName === 'ping') {
                await interaction.reply({ content: `🏓 Pong! \`${client.ws.ping}ms\``, ephemeral: true });
            }
        } 
        else if (interaction.isStringSelectMenu()) {
            if (interaction.customId === 'select_ticket_category') {
                const guild = interaction.guild;
                const user = interaction.user;
                const categoryValue = interaction.values[0];

                const categoryNames = {
                    'cat_soporte': 'soporte',
                    'cat_comprar': 'compras',
                    'cat_reclamar': 'premios',
                    'cat_quejas': 'reporte'
                };

                const channelName = `${categoryNames[categoryValue] || 'ticket'}-${user.username}`;

                const ticketChannel = await guild.channels.create({
                    name: channelName,
                    type: ChannelType.GuildText,
                    parent: TICKET_CATEGORY_ID || null,
                    permissionOverwrites: [
                        { id: guild.id, denied: [PermissionsBitField.Flags.ViewChannel] },
                        { id: user.id, allowed: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] },
                        { id: STAFF_ROLE_ID, allowed: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] }
                    ],
                });

                const closeRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('btn_close_ticket')
                        .setLabel('Cerrar Ticket')
                        .setStyle(ButtonStyle.Danger)
                        .setEmoji('🔒')
                );

                const welcomeEmbed = new EmbedBuilder()
                    .setColor('#5865F2')
                    .setTitle(`🎫 Ticket: ${user.username}`)
                    .setDescription('Describe tu situación detalladamente. Un miembro del Staff te atenderá pronto.')
                    .setTimestamp();

                await ticketChannel.send({ content: `¡Hola ${user} <@&${STAFF_ROLE_ID}>!`, embeds: [welcomeEmbed], components: [closeRow] });
                await interaction.reply({ content: `✅ ¡Canal creado: ${ticketChannel}!`, ephemeral: true });
            }
        }
        else if (interaction.isButton()) {
            if (interaction.customId === 'btn_ver_colombia') {
                await interaction.reply({ content: '🇨🇴 **Nequi Oficial:** `3216089454` (Juan Guzmán)', ephemeral: true });
            }
            else if (interaction.customId === 'btn_close_ticket') {
                await interaction.reply({ content: '🔒 Este ticket se cerrará en 5 segundos...' });
                setTimeout(() => { interaction.channel.delete().catch(() => {}); }, 5000);
            }
        }
    } catch (error) {
        console.error(error);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: '❌ Ocurrió un error.', ephemeral: true }).catch(() => {});
        }
    }
});

client.login(TOKEN);
