const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, SlashCommandBuilder, REST, Routes, PermissionsBitField } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// ID de la categoría para los tickets
const CATEGORIA_TICKETS_ID = '1541179201648992296';

// Mapa para rastrear inactividad: { channelId: { userId, hoursInactive } }
const ticketInactivity = new Map();

client.once('ready', async () => {
    console.log(`¡Bot conectado como ${client.user.tag}!`);
    client.user.setActivity('Black Market | /setup-ticket', { type: 3 });

    // Registro completo de comandos profesionales
    const commands = [
        new SlashCommandBuilder()
            .setName('setup-ticket')
            .setDescription('Envía el panel colorido de tickets de Black Market')
            .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
        new SlashCommandBuilder()
            .setName('emojis')
            .setDescription('Muestra todos los emojis oficiales de la tienda')
            .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
        new SlashCommandBuilder()
            .setName('cerrar')
            .setDescription('Cierra el ticket actual de forma inmediata'),
        new SlashCommandBuilder()
            .setName('alerta')
            .setDescription('Envía un aviso oficial del staff dentro del ticket')
            .addStringOption(option =>
                option.setName('mensaje')
                    .setDescription('Mensaje de alerta para el usuario')
                    .setRequired(true))
            .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageChannels),
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
            .setDescription('Muestra el panel definitivo de control y comandos')
    ].map(command => command.toJSON());

    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

    try {
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands },
        );
        console.log('¡Comandos globales de Black Market registrados con éxito!');
    } catch (error) {
        console.error('Error al registrar comandos:', error);
    }

    // Tarea en segundo plano: control de inactividad de 24 horas
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

// Manejador central de interacciones
client.on('interactionCreate', async interaction => {
    try {
        if (interaction.isChatInputCommand()) {
            const { commandName, options, channel, user, guild } = interaction;

            // /setup-ticket
            if (commandName === 'setup-ticket') {
                const embed = new EmbedBuilder()
                    .setTitle('<:SeekL_Money:1541133185432293488>  BLACK MARKET • CENTRO DE SOPORTE  <:SeekL_Money:1541133185432293488>')
                    .setDescription(
                        '¡Bienvenido al sistema oficial de atención al cliente de **Black Market**! <:emoji_13:1541198277888835614>\n\n' +
                        'Para brindarte una atención rápida y ordenada, selecciona el departamento adecuado en el menú desplegable de abajo. <:emoji_17:1541450983366987977>\n\n' +
                        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
                    )
                    .addFields(
                        { name: '<:SeekL_Money:1541133185432293488>  Compras y Pagos', value: 'Adquiere productos exclusivos o reporta transacciones.', inline: false },
                        { name: '<:emoji_3:1541134633033539664>  Soporte Técnico', value: 'Problemas al recibir artículos o fallas con algún servicio.', inline: false },
                        { name: '<:emoji_18:1542545895608942602>  Dudas Generales', value: 'Consultas sobre stock, precios o información de la tienda.', inline: false }
                    )
                    .setColor('#5865F2')
                    .setImage('https://i.imgur.com/37m4xJ9.png')
                    .setThumbnail(guild.iconURL({ dynamic: true }))
                    .setFooter({ text: 'Black Market • Todos los derechos reservados', iconURL: client.user.displayAvatarURL() });

                const selectMenu = new StringSelectMenuBuilder()
                    .setCustomId('seleccionar_seccion_ticket')
                    .setPlaceholder('✨ Haz clic aquí para elegir una categoría...')
                    .addOptions([
                        {
                            label: 'Compras y Pagos',
                            description: 'Atención exclusiva para compras y pagos',
                            value: 'categoria_compras',
                            emoji: { name: 'SeekL_Money', id: '1541133185432293488' }
                        },
                        {
                            label: 'Soporte Técnico',
                            description: 'Ayuda con problemas de entrega o fallas',
                            value: 'categoria_soporte',
                            emoji: { name: 'emoji_3', id: '1541134633033539664' }
                        },
                        {
                            label: 'Dudas Generales',
                            description: 'Preguntas sobre la tienda y productos',
                            value: 'categoria_dudas',
                            emoji: { name: 'emoji_18', id: '1542545895608942602' }
                        }
                    ]);

                const row = new ActionRowBuilder().addComponents(selectMenu);

                await channel.send({ embeds: [embed], components: [row] });
                return interaction.reply({ content: '✅ ¡Panel colorido de tickets enviado con éxito!', ephemeral: true });
            }

            // /emojis (Muestra todos los emojis de la tienda en un panel elegante)
            if (commandName === 'emojis') {
                const embedEmojis = new EmbedBuilder()
                    .setTitle('<:SeekL_Money:1541133185432293488> CATÁLOGO DE EMOJIS - BLACK MARKET <:SeekL_Money:1541133185432293488>')
                    .setDescription('Aquí tienes la lista oficial de emojis implementados en los sistemas de la tienda:')
                    .addFields(
                        { name: 'Moneda / Dinero', value: '<:SeekL_Money:1541133185432293488> `(SeekL_Money)`', inline: true },
                        { name: 'Soporte / Utilidad', value: '<:emoji_3:1541134633033539664> `(emoji_3)`', inline: true },
                        { name: 'General / Tienda', value: '<:emoji_18:1542545895608942602> `(emoji_18)`', inline: true },
                        { name: 'Verificación', value: '<:emoji_13:1541198277888835614> `(emoji_13)`', inline: true },
                        { name: 'Alerta / Información', value: '<:emoji_17:1541450983366987977> `(emoji_17)`', inline: true },
                        { name: 'Gestión / Opciones', value: '<:emoji_14:1541198324160536696> `(emoji_14)`', inline: true }
                    )
                    .setColor('#00FFCC')
                    .setFooter({ text: 'Black Market • Emojis Oficiales', iconURL: client.user.displayAvatarURL() });

                return interaction.reply({ embeds: [embedEmojis], ephemeral: true });
            }

            // Comandos exclusivos dentro de tickets
            if (!channel.name.startsWith('ticket-')) {
                return interaction.reply({ content: '❌ Este comando solo se puede usar dentro de un canal de ticket.', ephemeral: true });
            }

            if (commandName === 'cerrar') {
                ticketInactivity.delete(channel.id);
                await interaction.reply('🔒 *Cerrando ticket y eliminando canal en 3 segundos...*');
                setTimeout(() => channel.delete().catch(() => {}), 3000);
                return;
            }

            if (commandName === 'alerta') {
                const textoAlerta = options.getString('mensaje');
                const embedAlerta = new EmbedBuilder()
                    .setTitle('🚨 AVISO OFICIAL DEL STAFF')
                    .setDescription(textoAlerta)
                    .setColor('#FF0000')
                    .setFooter({ text: `Alerta enviada por ${user.username}`, iconURL: user.displayAvatarURL() });

                await interaction.reply({ embeds: [embedAlerta] });
                return;
            }

            if (commandName === 'rename') {
                const nuevoNombre = options.getString('nombre');
                try {
                    await channel.setName(`ticket-${nuevoNombre}`);
                    await interaction.reply(`✅ Canal renombrado a: \`ticket-${nuevoNombre}\``);
                } catch (error) {
                    await interaction.reply({ content: '❌ Error al cambiar el nombre (límite de cambios de Discord alcanzado).', ephemeral: true });
                }
                return;
            }

            if (commandName === 'añadir') {
                const usuario = options.getMember('usuario');
                await channel.permissionOverwrites.create(usuario, {
                    ViewChannel: true,
                    SendMessages: true,
                    ReadMessageHistory: true
                });
                await interaction.reply(`✅ Se ha añadido a ${usuario} al ticket.`);
                return;
            }

            if (commandName === 'remover') {
                const usuario = options.getMember('usuario');
                await channel.permissionOverwrites.delete(usuario);
                await interaction.reply(`✅ Se ha retirado el acceso a ${usuario}.`);
                return;
            }

            if (commandName === 'ayuda') {
                const ayudaEmbed = new EmbedBuilder()
                    .setTitle('<:emoji_14:1541198324160536696> Panel Definitivo de Ayuda • Black Market')
                    .setDescription('Lista maestra con todos los mejores comandos del bot funcionando al 100%:')
                    .addFields(
                        { name: '/setup-ticket', value: 'Despliega el panel principal con menú y emojis de la tienda (Admin).' },
                        { name: '/emojis', value: 'Muestra el listado visual con todos los emojis oficiales de Black Market.' },
                        { name: '/alerta <mensaje>', value: 'Envía un aviso oficial del staff dentro del ticket.' },
                        { name: '/cerrar', value: 'Cierra y elimina el ticket actual de inmediato.' },
                        { name: '/rename <nombre>', value: 'Modifica el nombre del canal actual.' },
                        { name: '/añadir @usuario', value: 'Da acceso a un usuario al ticket.' },
                        { name: '/remover @usuario', value: 'Quita el acceso a un usuario del ticket.' },
                        { name: 'Protección Antoinactividad', value: 'Cierre automático tras 24 horas sin respuesta.' }
                    )
                    .setColor('#2b2d31')
                    .setFooter({ text: 'Sistema optimizado y sin errores', iconURL: client.user.displayAvatarURL() });
                
                await interaction.reply({ embeds: [ayudaEmbed], ephemeral: true });
                return;
            }
        }

        // Manejo del Menú Desplegable de Secciones
        if (interaction.isStringSelectMenu()) {
            if (interaction.customId === 'seleccionar_seccion_ticket') {
                const guild = interaction.guild;
                const user = interaction.user;
                const seleccion = interaction.values[0];

                let nombreCategoria = 'soporte';
                let tituloCategoria = 'Soporte General';
                let emojiCategoria = '<:emoji_3:1541134633033539664>';

                if (seleccion === 'categoria_compras') {
                    nombreCategoria = 'compras';
                    tituloCategoria = 'Compras y Pagos';
                    emojiCategoria = '<:SeekL_Money:1541133185432293488>';
                } else if (seleccion === 'categoria_soporte') {
                    nombreCategoria = 'tecnico';
                    tituloCategoria = 'Soporte Técnico';
                    emojiCategoria = '<:emoji_3:1541134633033539664>';
                } else if (seleccion === 'categoria_dudas') {
                    nombreCategoria = 'dudas';
                    tituloCategoria = 'Dudas Generales';
                    emojiCategoria = '<:emoji_18:1542545895608942602>';
                }

                const canalExistente = guild.channels.cache.find(c => c.name === `ticket-${nombreCategoria}-${user.username.toLowerCase()}`);
                if (canalExistente) {
                    return interaction.reply({ content: `❌ Ya tienes un ticket abierto de esta categoría en ${canalExistente}`, ephemeral: true });
                }

                await interaction.deferReply({ ephemeral: true });

                const ticketChannel = await guild.channels.create({
                    name: `ticket-${nombreCategoria}-${user.username}`,
                    type: 0,
                    parent: CATEGORIA_TICKETS_ID,
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
                    .setTitle(`${emojiCategoria} TICKET • ${tituloCategoria.toUpperCase()} ${emojiCategoria}`)
                    .setDescription(
                        `¡Hola <@${user.id}>! Gracias por abrir un ticket en **Black Market**.\n\n` +
                        `Has seleccionado la sección: **${tituloCategoria}** <:emoji_13:1541198277888835614>\n\n` +
                        `> 📌 **Instrucciones:** Explica detalladamente tu caso, envía comprobantes si es necesario y espera pacientemente. Un miembro del equipo te atenderá lo antes posible.`
                    )
                    .setImage('https://i.ibb.co/68H187d/blackmarket.png')
                    .addFields(
                        { name: '<:emoji_17:1541450983366987977> Estado del Canal', value: '`Activo y en espera`', inline: true },
                        { name: '<:emoji_14:1541198324160536696> Aviso de Inactividad', value: 'Si dejas de responder por **24 horas**, el canal se cerrará automáticamente.', inline: false }
                    )
                    .setColor('#00FFCC')
                    .setFooter({ text: 'Black Market • Sistema de Tickets Seguro', iconURL: client.user.displayAvatarURL() });

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

                await ticketChannel.send({ content: `<:emoji_13:1541198277888835614> <@${user.id}> ¡Tu espacio privado ha sido creado con éxito!`, embeds: [embedTicket], components: [rowTicket] });
                await interaction.editReply({ content: `✅ ¡Ticket creado exitosamente en tu categoría! Dirígete aquí: ${ticketChannel}` });
            }
        }

        // Manejo de Botones (Reclamar / Cerrar)
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
                        .setLabel(`✨ Atendido por ${staff.username}`)
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId('cerrar_ticket_btn')
                        .setLabel('🔒 Cerrar Ticket')
                        .setStyle(ButtonStyle.Danger)
                );

                await message.edit({ components: [rowModificada] });
                await interaction.reply({ content: `✅ El staff <@${staff.id}> ha tomado oficialmente este ticket.` });
            }

            if (interaction.customId === 'cerrar_ticket_btn') {
                ticketInactivity.delete(interaction.channel.id);
                await interaction.reply('🔒 *Cerrando ticket y eliminando canal en 3 segundos...*');
                setTimeout(() => interaction.channel.delete().catch(() => {}), 3000);
            }
        }
    } catch (error) {
        console.error('Error al procesar la interacción:', error);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: '❌ Ocurrió un error inesperado al procesar esta acción.', ephemeral: true }).catch(() => {});
        }
    }
});

client.login(process.env.TOKEN);
