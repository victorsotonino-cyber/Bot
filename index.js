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
const TICKET_CATEGORY_ID = "1541179201648992296";

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
    // 1. Mostrar el panel de tickets al usar /ticket
    if (interaction.isChatInputCommand() && interaction.commandName === 'ticket') {
        const embed = new EmbedBuilder()
            .setColor('#57F287')
            .setDescription(
                '🎫 **| Panel de soporte**\n\n' +
                '🟢 Bienvenido al panel de soporte de **Black Market**, en este panel podrás resolver todas tus dudas y problemas.\n\n' +
                '<:emoji_12:1541198234372939806> **- Soporte**\n' +
                'Abre ticket para resolver tus dudas o preguntas.\n\n' +
                '<:SeekL_Money:1541133185432293488> **- Comprar**\n' +
                'Abre ticket para comprar algún producto de la tienda.\n\n' +
                '<:emoji_13:1541198277888835614> **- Media**\n' +
                'Abre ticket para solicitar el rol Team media.\n\n' +
                '<:emoji_14:1541198324160536696> **- Postulacion**\n' +
                'Abre ticket para postularte al staff.\n\n' +
                '💬 **- Otros**\n' +
                'Ninguno de los anteriores (Crea ticket para otros asuntos).'
            );

        // Fila 1 de botones con sus respectivos emojis personalizados
        const row1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('ticket_soporte').setLabel('Soporte').setStyle(ButtonStyle.Secondary).setEmoji('1541198234372939806'),
            new ButtonBuilder().setCustomId('ticket_comprar').setLabel('Comprar').setStyle(ButtonStyle.Secondary).setEmoji('1541133185432293488'),
            new ButtonBuilder().setCustomId('ticket_media').setLabel('Media').setStyle(ButtonStyle.Secondary).setEmoji('1541198277888835614')
        );

        // Fila 2 de botones
        const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('ticket_postulacion').setLabel('Postulación').setStyle(ButtonStyle.Secondary).setEmoji('1541198324160536696'),
            new ButtonBuilder().setCustomId('ticket_otros').setLabel('Otros').setStyle(ButtonStyle.Secondary)
        );

        await interaction.reply({ embeds: [embed], components: [row1, row2] });
    }

    // 2. Lógica para crear el canal privado cuando presionen un botón
    if (interaction.isButton()) {
        if (interaction.customId.startsWith('ticket_')) {
            await interaction.deferReply({ ephemeral: true });

            try {
                // Crear el canal dentro de tu categoría exacta
                const channel = await interaction.guild.channels.create({
                    name: `ticket-${interaction.user.username}`,
                    type: ChannelType.GuildText,
                    parent: TICKET_CATEGORY_ID,
                    permissionOverwrites: [
                        {
                            id: interaction.guild.id,
                            deny: [PermissionsBitField.Flags.ViewChannel],
                        },
                        {
                            id: interaction.user.id,
                            allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory],
                        },
                    ],
                });

                await interaction.editReply({ content: `¡Ticket creado con éxito! Ve al canal: ${channel}` });
            } catch (error) {
                console.error(error);
                await interaction.editReply({ content: 'Hubo un error al crear el canal de ticket.' });
            }
        }
    }
});

client.login(TOKEN);
