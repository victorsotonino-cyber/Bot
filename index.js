const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder, REST, Routes, PermissionsBitField } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// Mapa para rastrear inactividad: { channelId: { userId, hoursInactive } }
const ticketInactivity = new Map();

client.once('ready', async () => {
    console.log(`¡Bot conectado como ${client.user.tag}!`);
    client.user.setActivity('Black Market | /ticket', { type: 3 });

    // Registro de comandos de barra (Slash Commands)
    const commands = [
        new SlashCommandBuilder()
            .setName('setup-ticket')
            .setDescription('Envía el panel para abrir tickets de Black Market')
            .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
        new SlashCommandBuilder()
            .setName('cerrar')
            .setDescription('Cierra el ticket actual'),
        new SlashCommandBuilder()
            .setName('rename')
            .setDescription('Cambia el nombre del canal del ticket')
            .addStringOption(option => 
                option.setName('nombre')
                    .setDescription('Nuevo nombre para el ticket')
                    .setRequired(true)),
        new SlashCommandBuilder()
            .setName('añadir')
            .setDescription('Añade a un usuario al ticket actual')
            .addUserOption(option => 
                option.setName('usuario')
                    .setDescription('Usuario a añadir')
                    .setRequired(true)),
        new SlashCommandBuilder()
            .setName('remover')
            .setDescription('Saca a un usuario del ticket actual')
            .addUserOption(option => 
                option.setName('usuario')
                    .setDescription('Usuario a remover')
                    .setRequired(true)),
        new SlashCommandBuilder()
            .setName('ayuda')
            .setDescription('Muestra la lista de comandos de tickets disponibles')
    ].map(command => command.toJSON());

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

    try {
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands },
        );
        console.log('¡Comandos barra (/) registrados correctamente!');
    } catch (error) {
        console.error(error);
    }

    // Tarea en segundo plano: corre cada hora y a las 24 horas cierra el ticket por inactividad
    setInterval(async () => {
        for (const [channelId, data] of ticketInactivity.entries()) {
            const channel = client.channels.cache.get(channelId);
            if (!channel) {
                ticketInactivity.delete(channelId);
                continue;
            }

            data.hoursInactive += 1;

            if (data.hoursInactive >= 24) {
                await channel.send('🔒 Este ticket se ha cerrado automáticamente por inactividad (24 horas sin respuesta del usuario).');
                setTimeout(() => channel.delete().catch(() => {}), 5000);
                ticketInactivity.delete(channelId);
            } else {
                // Etiqueta al usuario cada hora informándole de las horas acumuladas sin contestar
                await channel.send(`⚠️ <@${data.userId}>, llevas ${data.hoursInactive} hora(s) sin responder en este ticket. Si cumples 24 horas sin contestar, el ticket se cerrará automáticamente.`);
            }
        }
    }, 3600000); // Cada 1 hora
});

// Reiniciar contador de inactividad si el usuario del ticket escribe un mensaje
client.on('messageCreate', async message => {
    if (message.author.bot) return;

    if (ticketInactivity.has(message.channel.id)) {
        const data = ticketInactivity.get(message.channel.id);
        if (message.author.id === data.userId) {
            data.hoursInactive = 0; // Resetea el contador a 0 porque ya contestó
        }
    }
});

// Manejador de Comandos Barra (/) y Botones
client.on('interactionCreate', async interaction => {
    if (interaction.isChatInputCommand()) {
        const { commandName, options, channel, member, user, guild } = interaction;

        // /setup-ticket
        if (commandName === 'setup-ticket') {
            const embed = new EmbedBuilder()
                .setTitle('🛒 Black Market - Sistema de Soporte')
                .setDescription('Haz clic en el botón de abajo para abrir un ticket de compra o soporte técnico.')
                .setColor('#000000')
                .setFooter({ text: 'Black Market Tienda Premium' });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('crear_ticket')
                    .setLabel('📩 Abrir Ticket')
                    .setStyle(ButtonStyle.Primary)
            );

            await channel.send({ embeds: [embed], components: [row] });
            return interaction.reply({ content: '✅ Panel de tickets enviado correctamente.', ephemeral: true });
        }

        // Comprobación para comandos exclusivos de tickets
        if (!channel.name.startsWith('ticket-')) {
            return interaction.reply({ content: '❌ Este comando solo se puede usar dentro de un canal de ticket.', ephemeral: true });
        }

        // /cerrar
        if (commandName === 'cerrar') {
            ticketInactivity.delete(channel.id);
            await interaction.reply('🔒 Este ticket se cerrará en 5 segundos...');
            setTimeout(() => channel.delete().catch(() => {}), 5000);
        }

        // /rename
        if (commandName === 'rename') {
            const nuevoNombre = options.getString('nombre');
            try {
                await channel.setName(`ticket-${nuevoNombre}`);
                await interaction.reply(`✅ Canal renombrado exitosamente a: \`ticket-${nuevoNombre}\``);
            } catch (error) {
                await interaction.reply({ content: '❌ Hubo un error al cambiar el nombre (puede ser por el límite de cambios de Discord).', ephemeral: true });
            }
        }

        // /añadir
        if (commandName === 'añadir') {
            const usuario = options.getMember('usuario');
            await channel.permissionOverwrites.create(usuario, {
                ViewChannel: true,
                SendMessages: true,
                ReadMessageHistory: true
            });
            await interaction.reply(`✅ Se ha añadido correctamente a ${usuario} al ticket.`);
        }

        // /remover
        if (commandName === 'remover') {
            const usuario = options.getMember('usuario');
            await channel.permissionOverwrites.delete(usuario);
            await interaction.reply(`✅ Se ha retirado el acceso a ${usuario} del ticket.`);
        }

        // /ayuda
        if (commandName === 'ayuda') {
            const ayudaEmbed = new EmbedBuilder()
                .setTitle('📌 Comandos de Tickets - Black Market')
                .setDescription('Lista de comandos de barra disponibles:')
                .addFields(
                    { name: '/setup-ticket', value: 'Envía el panel de creación (Solo administradores).' },
                    { name: '/rename <nombre>', value: 'Cambia el nombre del ticket actual.' },
                    { name: '/cerrar', value: 'Cierra y borra el ticket.' },
                    { name: '/añadir @usuario', value: 'Añade a un usuario al canal.' },
                    { name: '/remover @usuario', value: 'Quita el acceso a un usuario.' }
                )
                .setColor('#2b2d31');
            
            await interaction.reply({ embeds: [ayudaEmbed], ephemeral: true });
        }
    }

    // Manejo de Botones
    if (interaction.isButton()) {
        // Crear Ticket
        if (interaction.customId === 'crear_ticket') {
            const guild = interaction.guild;
            const user = interaction.user;

            const canalExistente = guild.channels.cache.find(c => c.name === `ticket-${user.username.toLowerCase()}`);
            if (canalExistente) {
                return interaction.reply({ content: `❌ Ya tienes un ticket abierto en ${canalExistente}`, ephemeral: true });
            }

            await interaction.deferReply({ ephemeral: true });

            const ticketChannel = await guild.channels.create({
                name: `ticket-${user.username}`,
                type: 0,
                permissionOverwrites: [
                    {
                        id: guild.id,
                        deny: [PermissionsBitField.Flags.ViewChannel]
                    },
                    {
                        id: user.id,
                        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory]
                    },
                    {
                        id: client.user.id,
                        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
                    }
                ]
            });

            // Registramos el ticket con 0 horas inactivas
            ticketInactivity.set(ticketChannel.id, { userId: user.id, hoursInactive: 0 });

            const embedTicket = new EmbedBuilder()
                .setTitle(`🎫 Ticket de Soporte - ${user.tag}`)
                .setDescription('¡Gracias por contactar con **Black Market**! Un staff te atenderá pronto.\n\n⚠️ **Aviso:** Si dejas de responder por **24 horas**, este ticket se cerrará automáticamente.')
                .setColor('#5865F2');

            const rowTicket = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('reclamar_ticket')
                    .setLabel('🙋‍♂️ Reclamar Ticket')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('cerrar_ticket_btn')
                    .setLabel('🔒 Cerrar Ticket')
                    .setStyle(ButtonStyle.Danger)
            );

            await ticketChannel.send({ content: `${user} ¡Bienvenido a tu ticket!`, embeds: [embedTicket], components: [rowTicket] });
            await interaction.editReply({ content: `✅ ¡Tu ticket ha sido creado con éxito! Entra aquí: ${ticketChannel}` });
        }

        // Reclamar Ticket (Bloqueo de 1 solo reclamo)
        if (interaction.customId === 'reclamar_ticket') {
            const staff = interaction.user;
            const message = interaction.message;

            const botonReclamar = message.components[0].components.find(c => c.customId === 'reclamar_ticket');
            if (botonReclamar && botonReclamar.disabled) {
                return interaction.reply({ content: '❌ Este ticket ya ha sido reclamado anteriormente.', ephemeral: true });
            }

            const rowModificada = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('reclamar_ticket')
                    .setLabel(`Reclamado por ${staff.username}`)
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true),
                new ButtonBuilder()
                    .setCustomId('cerrar_ticket_btn')
                    .setLabel('🔒 Cerrar Ticket')
                    .setStyle(ButtonStyle.Danger)
            );

            await message.edit({ components: [rowModificada] });
            await interaction.reply({ content: `✅ <@${staff.id}> ha reclamado este ticket y se hará cargo de la atención.` });
        }

        // Botón Cerrar Rápido
        if (interaction.customId === 'cerrar_ticket_btn') {
            ticketInactivity.delete(interaction.channel.id);
            await interaction.reply('🔒 Este ticket se cerrará en 3 segundos...');
            setTimeout(() => interaction.channel.delete().catch(() => {}), 3000);
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
