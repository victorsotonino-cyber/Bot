const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, SlashCommandBuilder, REST, Routes, PermissionsBitField } = require('discord.js');

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
            .setDescription('Envía el panel con secciones y emojis de Black Market')
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

        // /setup-ticket (Panel con tus emojis personalizados)
        if (commandName === 'setup-ticket') {
            const embed = new EmbedBuilder()
                .setTitle('🛒 Black Market — Centro de Soporte')
                .setDescription('Selecciona una categoría en el menú desplegable de abajo según el motivo de tu consulta para abrir un ticket privado con nuestro equipo.')
                .addFields(
                    { name: ' <:SeekL_Money:1541133185432293488> Compras y Pagos', value: 'Adquiere productos o reporta inconvenientes con pagos.', inline: false },
                    { name: ' <:emoji_3:1541134633033539664> Soporte Técnico', value: 'Problemas al recibir artículos o fallas con servicios.', inline: false },
                    { name: ' <:emoji_18:1542545895608942602> Dudas Generales', value: 'Consultas sobre la tienda o stock disponible.', inline: false }
                )
                .setColor('#111111')
                .setThumbnail(guild.iconURL({ dynamic: true }))
                .setFooter({ text: 'Black Market • Tienda Premium', iconURL: client.user.displayAvatarURL() });

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('seleccionar_seccion_ticket')
                .setPlaceholder('📂 Selecciona el tipo de ticket...')
                .addOptions([
                    {
                        label: 'Compras y Pagos',
                        description: 'Abrir un ticket para compras o pagos',
                        value: 'categoria_compras',
                        emoji: { name: 'SeekL_Money', id: '1541133185432293488' }
                    },
                    {
                        label: 'Soporte Técnico',
                        description: 'Abrir un ticket por fallas o ayuda técnica',
                        value: 'categoria_soporte',
                        emoji: { name: 'emoji_3', id: '1541134633033539664' }
                    },
                    {
                        label: 'Dudas Generales',
                        description: 'Abrir un ticket para preguntas generales',
                        value: 'categoria_dudas',
                        emoji: { name: 'emoji_18', id: '1542545895608942602' }
                    }
                ]);

            const row = new ActionRowBuilder().addComponents(selectMenu);

            await channel.send({ embeds: [embed], components: [row] });
            return interaction.reply({ content: '✅ Panel de tickets configurado correctamente con tus secciones y emojis.', ephemeral: true });
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

    // Manejo del Menú Desplegable (Creación según la sección elegida)
    if (interaction.isStringSelectMenu()) {
        if (interaction.customId === 'seleccionar_seccion_ticket') {
            const guild = interaction.guild;
            const user = interaction.user;
            const seleccion = interaction.values[0];

            let nombreCategoria = 'soporte';
            let tituloCategoria = 'Soporte General';

            if (seleccion === 'categoria_compras') {
                nombreCategoria = 'compras';
                tituloCategoria = 'Compras y Pagos';
            } else if (seleccion === 'categoria_soporte') {
                nombreCategoria = 'tecnico';
                tituloCategoria = 'Soporte Técnico';
            } else if (seleccion === 'categoria_dudas') {
                nombreCategoria = 'dudas';
                tituloCategoria = 'Dudas Generales';
            }

            const canalExistente = guild.channels.cache.find(c => c.name === `ticket-${nombreCategoria}-${user.username.toLowerCase()}`);
            if (canalExistente) {
                return interaction.reply({ content: `❌ Ya tienes un ticket abierto de esta categoría en ${canalExistente}`, ephemeral: true });
            }

            await interaction.deferReply({ ephemeral: true });

            const ticketChannel = await guild.channels.create({
                name: `ticket-${nombreCategoria}-${user.username}`,
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

            const embedTicket = new EmbedBuilder()
                .setTitle(`🎫 Ticket • ${tituloCategoria}`)
                .setDescription(`Gracias por contactar con **Black Market**. Has seleccionado la sección de **${tituloCategoria}**.\n\n> Detalla tu solicitud con calma y un miembro del staff te atenderá en breve.`)
                .addFields(
                    { name: '📌 Departamento', value: `\`${tituloCategoria}\``, inline: true },
                    { name: '⚠️ Aviso', value: 'Si dejas de responder por 24 horas, el ticket se cerrará automáticamente.', inline: false }
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
            await interaction.editReply({ content: `✅ ¡Tu ticket de **${tituloCategoria}** ha sido creado! Entra aquí: ${ticketChannel}` });
        }
    }

    // Manejo de Botones (Reclamar y Cerrar)
    if (interaction.isButton()) {
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
            await interaction.reply({ content: `✅ El staff <@${staff.id}> ha tomado este ticket.` });
        }

        if (interaction.customId === 'cerrar_ticket_btn') {
            ticketInactivity.delete(interaction.channel.id);
            await interaction.reply('🔒 *Este ticket se eliminará en 3 segundos...*');
            setTimeout(() => interaction.channel.delete().catch(() => {}), 3000);
        }
    }
});

client.login(process.env.TOKEN);
