const {
    Client,
    GatewayIntentBits,
    REST,
    Routes,
    SlashCommandBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    Events
} = require('discord.js');

const TOKEN = process.env.TOKEN;

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

const commands = [
    new SlashCommandBuilder().setName('ayuda').setDescription('Muestra el centro de asistencia'),
    new SlashCommandBuilder().setName('tienda').setDescription('Enlace y acceso a la tienda'),
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
    if (interaction.isChatInputCommand() && interaction.commandName === 'ticket') {
        const embed = new EmbedBuilder()
            .setColor('#57F287')
            .setDescription(
                '🎫 **| Panel de soporte**\n\n' +
                '🟢 Bienvenido al panel de soporte de **Black Market**, en este panel podrás resolver todas tus dudas y problemas.\n\n' +
                '🎟️ **- Soporte**\n' +
                'Abre ticket para resolver tus dudas o preguntas.\n\n' +
                '🛒 **- Comprar**\n' +
                'Abre ticket para comprar algún producto de la tienda.\n\n' +
                '🎁 **- Reclamar**\n' +
                'Abre ticket para solicitar tu recompensa.\n\n' +
                '📸 **- Media**\n' +
                'Abre ticket para solicitar el rol Team media.\n\n' +
                '📝 **- Postulacion**\n' +
                'Abre ticket para postularte al staff.\n\n' +
                '💬 **- Otros**\n' +
                'Ninguno de los anteriores (Crea ticket para otros asuntos).'
            );

        const row1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('ticket_soporte').setLabel('Soporte').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('ticket_comprar').setLabel('Comprar').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('ticket_reclamar').setLabel('Reclamar').setStyle(ButtonStyle.Secondary)
        );

        const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('ticket_media').setLabel('Media').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('ticket_postulacion').setLabel('Postulación').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('ticket_otros').setLabel('Otros').setStyle(ButtonStyle.Secondary)
        );

        await interaction.reply({ embeds: [embed], components: [row1, row2] });
    }

    if (interaction.isButton()) {
        if (interaction.customId.startsWith('ticket_')) {
            await interaction.reply({ content: '¡Pronto se abrirá tu canal de ticket privado!', ephemeral: true });
        }
    }
});

client.login(TOKEN);
