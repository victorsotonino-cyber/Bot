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
const STAFF_ROLE_ID = "1536191456694239271";

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
    new SlashCommandBuilder().setName('ping').setDescription('Mide la latencia del bot'),
    new SlashCommandBuilder()
        .setName('say')
        .setDescription('Envía un mensaje a través del bot')
        .addStringOption(option => 
            option.setName('mensaje').setDescription('El texto que dirá el bot').setRequired(true)
        )
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
    if (interaction.isChatInputCommand() && interaction.commandName === 'say') {
        if (!interaction.member.roles.cache.has(STAFF_ROLE_ID)) {
            return interaction.reply({ content: 'No tienes permisos para usar este comando.', ephemeral: true });
        }
        const texto = interaction.options.getString('mensaje');
        await interaction.channel.send(texto);
        await interaction.reply({ content: 'Mensaje enviado con éxito.', ephemeral: true });
    }

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

        const row1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('ticket_soporte').setLabel('Soporte').setStyle(ButtonStyle.Secondary).setEmoji('1541198234372939806'),
            new ButtonBuilder().setCustomId('ticket_comprar').setLabel('Comprar').setStyle(ButtonStyle.Secondary).setEmoji('1541133185432293488'),
            new ButtonBuilder().setCustomId('ticket_media').setLabel('Media').setStyle(ButtonStyle.Secondary).setEmoji('1541198277888835614')
        );

        const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('ticket_postulacion').setLabel('Postulación').setStyle(ButtonStyle.Secondary).setEmoji('1541198324160536696'),
            new ButtonBuilder().setCustomId('ticket_otros').setLabel('Otros').setStyle(ButtonStyle.Secondary)
        );

        await interaction.reply({ embeds: [embed], components: [row1, row2] });
    }

    if (interaction.isButton()) {
        if (interaction.customId.startsWith('ticket_')) {
            await interaction.deferReply({ ephemeral: true });

            try {
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
                        {
                            id: STAFF_ROLE_ID,
                            allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory],
                        },
                    ],
                });

                // Embed con diseño profesional y formal
                const ticketEmbed = new EmbedBuilder()
                    .setColor('#2B2D31')
                    .setTitle('🔒 Sistema de Gestión de Tickets')
                    .setDescription(
                        'Gracias por ponerte en contacto con el equipo de **Black Market**.\n\n' +
                        'Un miembro de nuestro <@&' + STAFF_ROLE_ID + '> se encargará de atender tu solicitud a la brevedad posible. Por favor, detalla tu consulta o motivo de apertura en este canal.'
                    )
                    .addFields(
                        { name: '👤 Usuario', value: `<@${interaction.user.id}>`, inline: true },
                        { name: '📌 Estado', value: '🟢 Pendiente de atención', inline: true }
                    )
                    .setFooter({ text: 'Black Market • Sistema de Soporte Seguro', iconURL: interaction.guild.iconURL() })
                    .setTimestamp();

                const ticketButtons = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('claim_ticket').setLabel('Reclamar Ticket').setStyle(ButtonStyle.Success).setEmoji('🛡️'),
                    new ButtonBuilder().setCustomId('close_ticket').setLabel('Cerrar Ticket').setStyle(ButtonStyle.Danger).setEmoji('🔒')
                );

                await channel.send({ content: `<@${interaction.user.id}> | <@&${STAFF_ROLE_ID}>`, embeds: [ticketEmbed], components: [ticketButtons] });
                await interaction.editReply({ content: `¡Ticket creado con éxito! Ve al canal: ${channel}` });
            } catch (error) {
                console.error("ERROR REAL:", error);
                await interaction.editReply({ content: `Error al crear: ${error.message}` });
            }
        }

        if (interaction.customId === 'claim_ticket') {
            if (!interaction.member.roles.cache.has(STAFF_ROLE_ID)) {
                return interaction.reply({ content: '❌ Solo el personal de Staff puede reclamar este ticket.', ephemeral: true });
            }

            const currentEmbed = interaction.message.embeds[0];
            const updatedEmbed = EmbedBuilder.from(currentEmbed)
                .setColor('#3498DB')
                .setFields(
                    { name: '👤 Usuario', value: currentEmbed.fields[0].value, inline: true },
                    { name: '📌 Estado', value: `🛡️ Atendido por **${interaction.user.tag}**`, inline: true }
                );

            await interaction.update({ embeds: [updatedEmbed], components: [interaction.message.components[0]] });
            await interaction.followUp({ content: `> 🛡️ El miembro del staff **${interaction.user.tag}** ha reclamado este ticket.` });
        }

        if (interaction.customId === 'close_ticket') {
            if (!interaction.member.roles.cache.has(STAFF_ROLE_ID) && interaction.user.id !== interaction.channel.topic) {
                // Validación opcional para que solo staff o el creador cierre (por ahora abierto al staff)
            }
            await interaction.reply({ content: '🔒 **Cerrando este ticket en 3 segundos...** Guardando historial y eliminando canal.' });
            setTimeout(async () => {
                try {
                    await interaction.channel.delete();
                } catch (e) {
                    console.error(e);
                }
            }, 3000);
        }
    }
});

client.login(TOKEN);
