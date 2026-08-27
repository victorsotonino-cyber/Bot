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

    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

    try {
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands },
        );
        console.log('¡Comandos barra (/) registrados correctamente!');
    } catch (error) {
        console.error(error);
    }

    // Tarea en segundo plano: inactividad de 24 horas
    setInterval(async () => {
        for (const [channelId, data] of ticketInactivity.entries()) {
            const channel = client.channels.cache.get(channelId);
            if (!channel) {
                ticketInactivity.delete(channelId);
                continue;
            }

            data.hoursInactive += 1;

            if (data.hoursInactive >= 24) {
                await channel.send('🔒 *Este ticket se ha cerrado automáticamente por inactividad prolongada (24 horas sin respuesta).*');
                setTimeout(() => channel.delete().catch(() => {}), 5000);
                ticketInactivity.delete(channelId);
            } else {
                await channel.send(`⚠️ <@${data.userId}>, llevas **${data.hoursInactive} hora(s)** sin responder en este ticket. Si cumples 24 horas sin actividad, se cerrará automáticamente.`);
            }
        }
    }, 3600000); 
});

// Reiniciar contador si el usuario escribe
client.on('messageCreate', async message => {
    if (message.author.bot) return;

    if (ticketInactivity.has(message.channel.id)) {
        const data = ticketInactivity.get(message.channel.id);
        if (message.author.id === data.userId) {
            data.hoursInactive = 0; 
        }
    }
});

// Manejador de interacciones
client.on('interactionCreate', async interaction => {
    if (interaction.isChatInputCommand()) {
        const { commandName, options, channel, member, user, guild } = interaction;

        // /setup-ticket (Panel Moderno)
        if (commandName === 'setup-ticket') {
            const embed = new EmbedBuilder()
                .setTitle('🛒 Black Market — Centro de Soporte')
                .setDescription('Bienvenido al sistema de atención oficial de **Black Market**.\n\nSi deseas realizar una compra, tienes dudas sobre algún producto o requieres soporte técnico, haz clic en el botón inferior para abrir un ticket privado con nuestro equipo.')
                .addFields(
                    { name: '🕒 Horarios de Atención', value: 'Disponibles 24/7 para procesar tus solicitudes.', inline: false },
                    { name: '⚠️ Aviso Importante', value: 'No abras tickets por motivos innecesarios o podrías ser sancionado.', inline: false }
                )
                .setColor('#111111')
                .setThumbnail(guild.iconURL({ dynamic: true }))
                .setFooter({ text: 'Black Market • Tienda Premium', iconURL: client.user.displayAvatarURL() });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('crear_ticket')
                    .setLabel('📩 Crear Ticket')
                    .setStyle(ButtonStyle.Secondary) // Estilo elegante gris oscuro/neutral
            );

            await channel.send({ embeds: [embed], components: [row] });
            return interaction.reply({ content: '✅ Panel de tickets rediseñado enviado correctamente.', ephemeral: true });
        }

        if (!channel.name.startsWith('ticket-')) {
            return interaction.reply({ content: '❌ Este comando solo se puede usar dentro de un canal de ticket.', ephemeral: true });
        }

        if (commandName === 'cerrar') {
            ticketInactivity.delete(channel.id);
            await interaction.reply('🔒 *Cerrando ticket en 5 segundos...*');
            setTimeout(() => channel.delete().catch(() => {}), 5000);
        }

        if (commandName === 'rename') {
            const nuevoNombre = options.getString('nombre');
            try {
                await channel.setName(`ticket-${nuevoNombre}`);
                await interaction.reply(`✅ Canal renombrado a: \`ticket-${nuevoNombre}\``);
            } catch (error) {
                await interaction.reply({ content: '❌ Error al cambiar el nombre (límite de cambios de Discord alcanzado).', ephemeral: true });
            }
        }

        if (commandName === 'añadir') {
            const usuario = options.getMember('usuario');
            await channel.permissionOverwrites.create(usuario, {
                ViewChannel: true,
                SendMessages: true,
                ReadMessageHistory: true
            });
            await interaction.reply(`✅ Se ha añadido a ${usuario} al ticket.`);
        }

        if (commandName === 'remover') {
            const usuario = options.getMember('usuario');
            await channel.permissionOverwrites.delete(usuario);
            await interaction.reply(`✅ Se ha retirado el acceso a ${usuario}.`);
        }

        if (commandName === 'ayuda') {
            const ayudaEmbed = new EmbedBuilder()
                .setTitle('📌 Comandos de Gestión - Tickets')
                .setDescription('Lista de comandos disponibles para el manejo interno:')
                .addFields(
                    { name: '/setup-ticket', value: 'Envía el panel principal (Admin).' },
                    { name: '/rename <nombre>', value: 'Modifica el nombre del canal actual.' },
                    { name: '/cerrar', value: 'Inicia el cierre y borrado del ticket.' },
                    { name: '/añadir @usuario', value: 'Da acceso a un usuario.' },
                    { name: '/remover @usuario', value: 'Quita el acceso a un usuario.' }
                )
                .setColor('#2b2d31');
            
            await interaction.reply({ embeds: [ayudaEmbed], ephemeral: true });
        }
    }

    // Manejo de Botones
    if (interaction.isButton()) {
        if (interaction.customId === 'crear_ticket') {
            const guild = interaction.guild;
            const user = interaction.user;

            const canalExistente = guild.channels.cache.find(c => c.name === `ticket-${user.username.toLowerCase()}`);
            if (canalExistente) {
                return interaction.reply({ content: `❌ Ya posees un ticket abierto en ${canalExistente}`, ephemeral: true });
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

            ticketInactivity.set(ticketChannel.id, { userId: user.id, hoursInactive: 0 });

            // Embed interno del ticket mucho más limpio y formal
            const embedTicket = new EmbedBuilder()
                .setTitle(`🎫 Ticket Privado • ${user.username}`)
                .setDescription('Gracias por abrir un ticket en **Black Market**. Por favor, detalla con calma tu solicitud, duda o compra que deseas realizar.\n\n> Un miembro del equipo de staff te atenderá a la brevedad posible.')
                .addFields(
                    { name: '📌 Estado', value: '`Pendiente de atención`', inline: true },
                    { name: '⚠️ Nota de Inactividad', value: 'Si el canal pasa 24 horas sin mensajes tuyos, se cerrará automáticamente.', inline: false }
                )
                .setColor('#2f3136');

            const rowTicket = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('reclamar_ticket')
                    .setLabel('🙋‍♂️ Reclamar')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('cerrar_ticket_btn')
                    .setLabel('🔒 Cerrar')
                    .setStyle(ButtonStyle.Danger)
            );

            await ticketChannel.send({ content: `${user} 👋 ¡Canal establecido con éxito!`, embeds: [embedTicket], components: [rowTicket] });
            await interaction.editReply({ content: `✅ ¡Tu ticket ha sido creado correctamente! Dirígete aquí: ${ticketChannel}` });
        }

        if (interaction.customId === 'reclamar_ticket') {
            const staff = interaction.user;
            const message = interaction.message;

            const botonReclamar = message.components[0].components.find(c => c.customId === 'reclamar_ticket');
            if (botonReclamar && botonReclamar.disabled) {
                return interaction.reply({ content: '❌ Este ticket ya fue reclamado por otro miembro del staff.', ephemeral: true });
            }

            const rowModificada = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('reclamar_ticket')
                    .setLabel(`Atendido por ${staff.username}`)
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true),
                new ButtonBuilder()
                    .setCustomId('cerrar_ticket_btn')
                    .setLabel('🔒 Cerrar')
                    .setStyle(ButtonStyle.Danger)
            );

            await message.edit({ components: [rowModificada] });
            await interaction.reply({ content: `✅ El staff <@${staff.id}> ha tomado la batuta de este ticket.` });
        }

        if (interaction.customId === 'cerrar_ticket_btn') {
            ticketInactivity.delete(interaction.channel.id);
            await interaction.reply('🔒 *Este ticket se eliminará en 3 segundos...*');
            setTimeout(() => interaction.channel.delete().catch(() => {}), 3000);
        }
    }
});

client.login(process.env.TOKEN);
