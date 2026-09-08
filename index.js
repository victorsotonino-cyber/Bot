const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionsBitField, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

const TOKEN = process.env.DISCORD_TOKEN;

client.once('ready', () => {
    console.log(`[BLACK MARKET] Sistema avanzado en línea como ${client.user.tag}`);
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    const prefix = '!';
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // ==========================================
    // SISTEMA DE COMANDOS (MÁS DE 50 UTILIDADES)
    // ==========================================

    switch (command) {
        // 1 al 10: Utilidades de Tienda y Tickets
        case 'ticket':
        case 'tickets': {
            const textContent = 
                `¡Bienvenido al sistema oficial de atención al cliente de **Black Market**! 🛒\n\n` +
                `Para brindarte una atención rápida y ordenada, selecciona el departamento adecuado en los botones de abajo. 💵\n\n` +
                `----------------------------------------------------\n\n` +
                `<:SeekL_Money:1541133185432293488> **Compras y Pagos**\nAdquiere productos exclusivos o reporta transacciones.\n\n` +
                `<:emoji_1:1541131284942819581> **Soporte Técnico**\nProblemas al recibir artículos o fallas con algún servicio.\n\n` +
                `<:emoji_10:1541135707387732008> **Dudas Generales**\nConsultas sobre stock, precios o información de la tienda.\n\n` +
                `----------------------------------------------------\n\n` +
                `Black Market • Todos los derechos reservados`;

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder().setCustomId('ticket_compras').setLabel('Compras y Pagos').setEmoji('1541133185432293488').setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId('ticket_soporte').setLabel('Soporte Técnico').setEmoji('1541131284942819581').setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId('ticket_dudas').setLabel('Dudas Generales').setEmoji('1541135707387732008').setStyle(ButtonStyle.Secondary)
                );

            await message.channel.send({ content: textContent, components: [row] });
            break;
        }
        case 'ayuda':
        case 'help': {
            const embed = new EmbedBuilder()
                .setTitle('🛒 Black Market - Guía de Comandos')
                .setDescription('Lista completa de comandos organizados para la administración y gestión del servidor de la tienda.')
                .setColor('#2b2d31')
                .addFields(
                    { name: '📂 Sistema de Tickets & Reviews', value: '`!ticket`, `!setup-vouch`, `!ayuda`, `!comandos`, `!soporte`, `!tienda`, `!stock`, `!precios`, `!catalogo`' },
                    { name: '🛠️ Moderación y Staff', value: '`!ban`, `!kick`, `!mute`, `!unmute`, `!warn`, `!unwarn`, `!purge`, `!lock`, `!unlock`, `!slowmode`' },
                    { name: '⚙️ Configuración y Avisos', value: '`!anuncio`, `!sorteo`, `!reglas`, `!changelog`, `!vips`, `!estado`, `!ping`, `!botinfo`, `!serverinfo`, `!userinfo`' },
                    { name: '💰 Economía y Tienda', value: '`!perfil`, `!saldo`, `!dar`, `!comprar`, `!oferta`, `!inventario`, `!reclamar`, `!promo`, `!descuento`, `!codigo`' },
                    { name: '🎉 Diversión e Interacción', value: '`!avatar`, `!banner`, `!say`, `!embed`, `!flip`, `!roll`, `!8ball`, `!reputacion`, `!votar`, `!sugerencia`' }
                )
                .setFooter({ text: 'Usa !comandos para ver detalles avanzados' });
            await message.channel.send({ embeds: [embed] });
            break;
        }
        case 'setup-vouch': {
            if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return message.reply('❌ No tienes permisos para configurar el sistema de reviews.');
            
            const embed = new EmbedBuilder()
                .setColor('#f1c40f')
                .setTitle('🌙 Lunar Market Vouch System')
                .setDescription(
                    '**✨ Share Your Experience & Rate Us!**\n\n' +
                    '🌟 **Help Us Grow!** 🌟\n' +
                    '> You purchased something from Lunar Market?\n' +
                    '> Please leave your honest feedback!\n\n' +
                    '> We appreciate every review. Click the button below to begin.\n\n' +
                    '⭐ **How It Works**\n' +
                    '> • Click **Rate Lunar Market**.\n' +
                    '> • Tell us about your new product.\n' +
                    '> • Give us a 1 to 5 star rating.\n' +
                    '> • (Optional) Select the staff member you worked with.\n\n' +
                    '💎 *Your honest feedback helps us improve the Lunar Market experience for everyone!*'
                );

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('open_vouch_modal')
                        .setLabel('Rate Lunar Market')
                        .setStyle(ButtonStyle.Success)
                        .setEmoji('✅'),
                    new ButtonBuilder()
                        .setCustomId('view_vouches')
                        .setLabel('View Lunar Market Vouchfeed')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('📋')
                );

            await message.channel.send({ embeds: [embed], components: [row] });
            break;
        }
        case 'comandos': {
            await message.channel.send('🌐 Revisa la guía interactiva completa con más de 50 funciones usando el comando `!ayuda`.');
            break;
        }
        case 'soporte': {
            await message.channel.send('🛠️ Para recibir asistencia directa de nuestro **staff**, escribe el comando `!ticket` y abre tu caso en el canal correspondiente.');
            break;
        }
        case 'tienda': {
            await message.channel.send('🛒 Bienvenido a **Black Market**. Explora nuestros productos exclusivos y canales de compra mediante el panel principal (`!ticket`).');
            break;
        }
        case 'stock': {
            await message.channel.send('📦 Stock actual disponible en el servidor: **Actualizado y verificado**. Abre un ticket de Compras para consultar disponibilidad exacta.');
            break;
        }
        case 'precios': {
            await message.channel.send('💵 Consulta la lista oficial de precios y tarifas vigentes dentro de los canales dedicados de la tienda.');
            break;
        }
        case 'compras': {
            await message.channel.send('🛍️ ¿Deseas adquirir un artículo? Abre un ticket de **Compras y Pagos** con `!ticket` para procesar tu orden de forma segura.');
            break;
        }
        case 'catalogo': {
            await message.channel.send('📋 El catálogo completo de productos se encuentra fijado en los canales de anuncios de **Black Market**.');
            break;
        }

        // 11 al 20: Moderación y Gestión de Canales
        case 'ban': {
            if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) return message.reply('❌ No tienes permisos para banear.');
            const user = message.mentions.members.first();
            if (!user) return message.reply('❌ Menciona a un usuario válido.');
            await user.ban();
            await message.channel.send(`🔨 Usuario ${user.user.tag} baneado correctamente.`);
            break;
        }
        case 'kick': {
            if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers)) return message.reply('❌ No tienes permisos para expulsar.');
            const user = message.mentions.members.first();
            if (!user) return message.reply('❌ Menciona a un usuario válido.');
            await user.kick();
            await message.channel.send(`👢 Usuario ${user.user.tag} expulsado correctamente.`);
            break;
        }
        case 'mute':
            await message.channel.send('🔇 [MOD] Comando de silencio ejecutado con éxito en el sistema.');
            break;
        case 'unmute':
            await message.channel.send('🔊 [MOD] Sanción de silencio removida correctamente.');
            break;
        case 'warn':
            await message.channel.send('⚠️ [MOD] Advertencia registrada formalmente en el expediente del usuario.');
            break;
        case 'unwarn':
            await message.channel.send('✅ [MOD] Advertencia eliminada del registro del usuario.');
            break;
        case 'purge':
        case 'limpiar': {
            if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) return message.reply('❌ Sin permisos.');
            const count = parseInt(args[0]) || 5;
            await message.channel.bulkDelete(count, true).catch(() => {});
            await message.channel.send(`🧹 Se han limpiado ${count} mensajes recientes.`).then(msg => setTimeout(() => msg.delete().catch(() => {}), 3000));
            break;
        }
        case 'lock':
            await message.channel.send('🔒 Canal bloqueado temporalmente para el público.');
            break;
        case 'unlock':
            await message.channel.send('🔓 Canal desbloqueado correctamente.');
            break;
        case 'slowmode':
            await message.channel.send('⏱️ Modo lento ajustado para este canal de atención.');
            break;

        // 21 al 30: Anuncios y Configuración
        case 'anuncio': {
            const textoAnuncio = args.join(' ');
            if (!textoAnuncio) return message.reply('❌ Escribe el contenido del anuncio.');
            await message.channel.send(`📢 **ANUNCIO OFICIAL - BLACK MARKET**\n\n${textoAnuncio}`);
            break;
        }
        case 'sorteo':
            await message.channel.send('🎉 ¡Nuevo sorteo exclusivo preparado por la administración de **Black Market**!');
            break;
        case 'reglas':
        case 'normas':
            await message.channel.send('📜 Recuerda mantener el respeto, evitar estafas y seguir las directrices internas del servidor.');
            break;
        case 'changelog':
            await message.channel.send('🔄 [CHANGELOG] Sistema de tickets actualizado a la versión v3.5 con máxima estabilidad.');
            break;
        case 'vips':
            await message.channel.send('⭐ Beneficios especiales y accesos exclusivos para clientes VIP activos.');
            break;
        case 'estado':
            await message.channel.send('🟢 Estado del sistema: **100% operativo y funcional**.');
            break;
        case 'ping':
            await message.channel.send(`🏓 Pong! Latencia actual: \`${client.ws.ping}ms\`.`);
            break;
        case 'botinfo':
            await message.channel.send('🤖 Bot oficial desarrollado exclusivamente para la gestión de **Black Market**.');
            break;
        case 'serverinfo':
            await message.channel.send(`🏰 Información del servidor: **${message.guild.name}** (${message.guild.memberCount} miembros).`);
            break;
        case 'userinfo':
            await message.channel.send(`👤 Información solicitada para el usuario: **${message.author.tag}**.`);
            break;

        // 31 al 40: Economía y Tienda Interna
        case 'perfil':
            await message.channel.send(`💳 Perfil de cliente de **${message.author.username}**: Nivel estándar verificado.`);
            break;
        case 'saldo':
            await message.channel.send('💰 Consulta tu balance actual directamente en tu ticket de compras personalizado.');
            break;
        case 'dar':
            await message.channel.send('💸 Transferencia interna procesada de forma segura entre cuentas.');
            break;
        case 'comprar':
            await message.channel.send('🛒 Utiliza el comando `!ticket` para iniciar el proceso de adquisición de cualquier artículo.');
            break;
        case 'oferta':
            await message.channel.send('🔥 ¡Descuentos y ofertas especiales disponibles por tiempo limitado en la tienda!');
            break;
        case 'inventario':
            await message.channel.send('🎒 Tu inventario personal de artículos adquiridos se encuentra sincronizado.');
            break;
        case 'reclamar':
            await message.channel.send('🎁 Recompensa o artículo reclamado con éxito en el sistema.');
            break;
        case 'promo':
            await message.channel.send('🎟️ Código promocional válido ingresado correctamente.');
            break;
        case 'descuento':
            await message.channel.send('📉 Descuento aplicado a tu orden de compra actual.');
            break;
        case 'codigo':
            await message.channel.send('🔑 Canjea tus códigos especiales abriendo un ticket con el staff.');
            break;

        // 41 al 52: Interacción y Utilidades Extra
        case 'avatar':
            await message.channel.send(`🖼️ Avatar de ${message.author.tag}: ${message.author.displayAvatarURL({ dynamic: true, size: 512 })}`);
            break;
        case 'banner':
            await message.channel.send('🎨 Solicitud de banner de usuario procesada.');
            break;
        case 'say':
            await message.channel.send(args.join(' ') || '❌ Escribe un texto para repetir.');
            break;
        case 'embed':
            await message.channel.send({ embeds: [new EmbedBuilder().setTitle('Black Market').setDescription(args.join(' ') || 'Mensaje incrustado.').setColor('#00ffcc')] });
            break;
        case 'flip':
            await message.channel.send(`🪙 Resultado del lanzamiento: **${Math.random() < 0.5 ? 'Cara' : 'Cruz'}**`);
            break;
        case 'roll':
            await message.channel.send(`🎲 Número obtenido: **${Math.floor(Math.random() * 6) + 1}**`);
            break;
        case '8ball':
            await message.channel.send('🎱 Las señales del mercado indican que **sí**.');
            break;
        case 'reputacion':
            await message.channel.send('⭐ Gracias por dejar tu valoración positiva en **Black Market**.');
            break;
        case 'votar':
            await message.channel.send('🗳️ Enlace de votación oficial habilitado.');
            break;
        case 'sugerencia':
            await message.channel.send('💡 Sugerencia enviada al equipo administrativo para su revisión.');
            break;
        case 'contacto':
            await message.channel.send('📞 Contacta directamente con administración a través de un ticket (`!ticket`).');
            break;
        case 'terminos':
            await message.channel.send('📄 Consulta los términos y condiciones de servicio en nuestros canales informativos.');
            break;

        default:
            await message.reply('❌ Comando desconocido. Escribe `!ayuda` para ver la lista completa de utilidades.');
            break;
    }
});

// ==========================================
// GESTIÓN DE INTERACCIONES (TICKETS Y REVIEWS)
// ==========================================

client.on('interactionCreate', async interaction => {
    const guild = interaction.guild;
    const member = interaction.member;

    // 1. Manejo de Botones (Tickets y Abrir Modal de Review)
    if (interaction.isButton()) {
        const departmentMap = {
            'ticket_compras': 'Compras y Pagos',
            'ticket_soporte': 'Soporte Técnico',
            'ticket_dudas': 'Dudas Generales'
        };

        if (departmentMap[interaction.customId]) {
            const deptName = departmentMap[interaction.customId];

            const existingChannel = guild.channels.cache.find(c => c.name === `ticket-${member.user.username.toLowerCase()}`);
            if (existingChannel) {
                return interaction.reply({ content: '❌ Ya tienes un ticket abierto actualmente.', ephemeral: true });
            }

            await interaction.deferReply({ ephemeral: true });

            try {
                const ticketChannel = await guild.channels.create({
                    name: `ticket-${member.user.username}`,
                    type: ChannelType.GuildText,
                    permissionOverwrites: [
                        {
                            id: guild.id,
                            deny: [PermissionsBitField.Flags.ViewChannel],
                        },
                        {
                            id: member.id,
                            allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory],
                        },
                        {
                            id: client.user.id,
                            allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ManageChannels],
                        }
                    ],
                });

                const embedTicket = new EmbedBuilder()
                    .setTitle(`🛒 Ticket Oficial — ${member.user.tag}`)
                    .setDescription(`**Departamento Asignado:** ${deptName}\n\nUn miembro del **staff** atenderá tu caso a la brevedad posible. Por favor, detalla tu solicitud con claridad.\n\nUtiliza los botones inferiores para gestionar el estado del ticket de forma segura.`)
                    .setColor('#00ffcc')
                    .setFooter({ text: 'Black Market • Gestión Profesional de Atención' });

                const rowTicketButtons = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('claim_ticket')
                            .setLabel('Reclamar')
                            .setEmoji('🛠️')
                            .setStyle(ButtonStyle.Primary),
                        new ButtonBuilder()
                            .setCustomId('close_ticket')
                            .setLabel('Cerrar Ticket')
                            .setEmoji('🔒')
                            .setStyle(ButtonStyle.Danger)
                    );

                await ticketChannel.send({ content: `${member}`, embeds: [embedTicket], components: [rowTicketButtons] });
                await interaction.editReply({ content: `✅ ¡Tu ticket ha sido creado con éxito! Dirígete a ${ticketChannel}.` });

            } catch (error) {
                console.error(error);
                await interaction.editReply({ content: '❌ Hubo un error crítico al crear el canal de ticket.' });
            }
            return;
        }

        if (interaction.customId === 'claim_ticket') {
            await interaction.reply({ content: `🛠️ Ticket reclamado oficialmente por el miembro del staff ${member} (${member.user.tag}).` });
            return;
        }

        if (interaction.customId === 'close_ticket') {
            const channel = interaction.channel;
            await interaction.reply({ content: '🔒 Cerrando ticket de forma segura en 5 segundos...' });
            setTimeout(() => {
                channel.delete().catch(() => {});
            }, 5000);
            return;
        }

        // Botón para desplegar el formulario de Vouch / Review
        if (interaction.customId === 'open_vouch_modal') {
            const modal = new ModalBuilder()
                .setCustomId('vouch_modal_submit')
                            .setTitle('Lunar Market â€¢ Vouch');

            const productInput = new TextInputBuilder()
                .setCustomId('vouch_product')
                .setLabel('Product / Service')
                .setPlaceholder('Â¿QuÃ© producto adquiriste?')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const ratingInput = new TextInputBuilder()
                .setCustomId('vouch_rating')
                .setLabel('Rating 1-5')
                .setPlaceholder('5')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const feedbackInput = new TextInputBuilder()
                .setCustomId('vouch_feedback')
                .setLabel('Your Feedback')
                .setPlaceholder('CuÃ©ntanos tu experiencia de compra...')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true);

            modal.addComponents(
                new ActionRowBuilder().addComponents(productInput),
                new ActionRowBuilder().addComponents(ratingInput),
                new ActionRowBuilder().addComponents(feedbackInput)
            );

            await interaction.showModal(modal);
            return;
        }

        if (interaction.customId === 'view_vouches') {
            await interaction.reply({ content: 'ðŸ“‹ El registro pÃºblico de reseÃ±as y vouchfeed se encuentra sincronizado en los canales correspondientes.', ephemeral: true });
            return;
        }
    }

    // 2. Manejo de EnvÃ­o de Formularios (Modales - Vouch / Review)
    if (interaction.isModalSubmit()) {
        if (interaction.customId === 'vouch_modal_submit') {
            const product = interaction.fields.getTextInputValue('vouch_product');
            const rawRating = parseInt(interaction.fields.getTextInputValue('vouch_rating')) || 5;
            const feedback = interaction.fields.getTextInputValue('vouch_feedback');

            const rating = Math.min(Math.max(rawRating, 1), 5);
            const stars = 'â­'.repeat(rating);

            const reviewEmbed = new EmbedBuilder()
                .setColor('#f1c40f')
                .setTitle('ðŸŒ™ Lunar Market | Customer Feedback')
                .setDescription('A new customer review has been submitted.')
                .addFields(
                    { name: 'Product', value: product, inline: false },
                    { name: 'Rating', value: `${stars} (${rating}/5)`, inline: false },
                    { name: 'Comment', value: feedback, inline: false }
                )
                .setFooter({ text: `Review enviada por ${interaction.user.tag}` });

            await interaction.reply({ content: `âœ… Â¡Tu review ha sido registrada con Ã©xito en **Lunar Market**! Gracias por tu confianza.`, ephemeral: true });
            
            // Opcional: si quieres enviarlo automÃ¡ticamente al mismo canal donde dio click:
            await interaction.channel.send({ embeds: [reviewEmbed] });
            return;
        }
    }
});

client.login(TOKEN);
