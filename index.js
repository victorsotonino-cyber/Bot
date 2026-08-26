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

// Comandos esenciales
const commands = [
    new SlashCommandBuilder().setName('ayuda').setDescription('Muestra el centro de ayuda'),
    new SlashCommandBuilder().setName('tienda').setDescription('Enlace y acceso a la tienda'),
    new SlashCommandBuilder().setName('ticket').setDescription('Despliega el panel principal de tickets'),
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
    // 1. Manejo del comando /ticket para enviar el panel visual
    if (interaction.isChatInputCommand() && interaction.commandName === 'ticket') {
        // Creamos el Embed con la línea lateral verde
        const embed = new EmbedBuilder()
            .setColor('#57F287') // Color verde estilo Discord
            .setDescription(
                '🎫 **| Panel de soporte**\n\n' +
                '🟢 Bienvenido al panel de soporte de **Black Market**, en este panel podrás resolver todas tus dudas y problemas.\n\n' +
                '<:emoji_12:123456789012345678> **- Soporte**\n' +
                'Abre ticket para resolver tus dudas o preguntas.\n\n' +
                '<:SeekL_Money:123456789012345678> **- Comprar**\n' +
                'Abre ticket para comprar algún producto de la tienda.\n\n' +
                '<:emoji_11:123456789012345678> **- Reclamar**\n' +
                'Abre ticket para solicitar tu recompensa.\n\n' +
                '<:emoji_13:123456789012345678> **- Media**\n' +
                'Abre ticket para solicitar el rol Team media.\n\n' +
                '<:emoji_1:123456789012345678> **- Postulacion**\n' +
                'Abre ticket para postularte al staff.\n\n' +
                '💬 **- Otros**\n' +
                'Ninguno de los anteriores (Crea ticket para otros asuntos).'
            );

        // Creamos los botones interactivos uno debajo del otro o en filas
        const row1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('ticket_soporte').setLabel('Soporte').setStyle(ButtonStyle.Secondary).setEmoji('123456789012345678'), // Reemplaza con el ID numérico de tu emoji :emoji_12:
            new ButtonBuilder().setCustomId('ticket_comprar').setLabel('Comprar').setStyle(ButtonStyle.Secondary).setEmoji('123456789012345678'),
            new ButtonBuilder().setCustomId('ticket_reclamar').setLabel('Reclamar').setStyle(ButtonStyle.Secondary).setEmoji('123456789012345678')
        );

        const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('ticket_media').setLabel('Media').setStyle(ButtonStyle.Secondary).setEmoji('123456789012345678'),
            new ButtonBuilder().setCustomId('ticket_postulacion').setLabel('Postulacion').setStyle(ButtonStyle.Secondary).setEmoji('123456789012345678'),
            new ButtonBuilder().setCustomId('ticket_otros').setLabel('Otros').setStyle(ButtonStyle.Secondary).setEmoji('123456789012345678')
        );

        await interaction.reply({ embeds: [embed], components: [row1, row2] });
    }

    // 2. Manejo cuando presionan los botones de tickets
    if (interaction.isButton()) {
        if (interaction.customId.startsWith('ticket_')) {
            await interaction.reply({ content: '¡Pronto se abrirá tu canal de ticket privado!', ephemeral: true });
        }
    }
});

client.login(TOKEN);
