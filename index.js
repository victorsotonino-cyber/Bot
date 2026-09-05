const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionsBitField, EmbedBuilder } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

const TOKEN = "MTU0MzY4OTI1Njk0NDI3MTM3MQ.G9el1G.AFI4IumgpGVH5JukKdlBJbZGLZ-s908TI3GTQo";

client.once('ready', () => {
    console.log(`¡Bot encendido y conectado como ${client.user.tag}!`);
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    if (message.content === '!ticket') {
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
                new ButtonBuilder()
                    .setCustomId('ticket_compras')
                    .setLabel('Compras y Pagos')
                    .setEmoji('1541133185432293488')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('ticket_soporte')
                    .setLabel('Soporte Técnico')
                    .setEmoji('1541131284942819581')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('ticket_dudas')
                    .setLabel('Dudas Generales')
                    .setEmoji('1541135707387732008')
                    .setStyle(ButtonStyle.Secondary)
            );

        await message.channel.send({ content: textContent, components: [row] });
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    const guild = interaction.guild;
    const member = interaction.member;

    const departmentMap = {
        'ticket_compras': 'Compras y Pagos',
        'ticket_soporte': 'Soporte Técnico',
        'ticket_dudas': 'Dudas Generales'
    };

    if (departmentMap[interaction.customId]) {
        const deptName = departmentMap[interaction.customId];

        const existingChannel = guild.channels.cache.find(c => c.name === `ticket-${member.user.username.toLowerCase()}`);
        if (existingChannel) {
            return interaction.reply({ content: '❌ Ya tienes un ticket abierto.', ephemeral: true });
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
                .setTitle(`Ticket de ${member.user.tag}`)
                .setDescription(`**Departamento:** ${deptName}\n\nUn miembro del **staff** te atenderá pronto. Explica el motivo de tu ticket aquí.\n\nUsa los botones de abajo para reclamar o cerrar el ticket.`)
                .setColor('#00ffcc');

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
            await interaction.editReply({ content: `✅ ¡Tu ticket ha sido creado! Dirígete a ${ticketChannel}.` });

        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: '❌ Hubo un error al crear el ticket.' });
        }
        return;
    }

    if (interaction.customId === 'claim_ticket') {
        await interaction.reply({ content: `🛠️ Ticket reclamado por ${member} (${member.user.tag}).` });
        return;
    }

    if (interaction.customId === 'close_ticket') {
        const channel = interaction.channel;
        await interaction.reply({ content: '🔒 Cerrando ticket en 5 segundos...' });
        setTimeout(() => {
            channel.delete().catch(() => {});
        }, 5000);
        return;
    }
});

client.login(TOKEN);
