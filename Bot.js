// ============================================================================
// NexusBot Pro - Bot Multiuso para Discord (Discord.js v14)
// Módulos: Tickets (Flashy + Ghost), Tienda & Economía, Moderación, Bienvenidas y Sorteos
// ============================================================================

require('dotenv').config();
const {
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ChannelType,
  PermissionFlagsBits,
  Collection,
} = require('discord.js');
const fs = require('fs');
const path = require('path');

// Cargar configuración sincronizada
const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: [Partials.Channel, Partials.Message, Partials.GuildMember],
});

// Estructuras en memoria para tickets, economía y warns
const activeTickets = new Map();
const userBalances = new Map(); // userId -> number
const userWarns = new Map();    // userId -> Array of reasons
const activeGiveaways = new Map();

client.once('ready', () => {
  console.log(`✅ ${client.user.tag} iniciado con éxito en ${client.guilds.cache.size} servidores.`);
  client.user.setActivity(config.bot.activity || 'Viendo /tienda | /panel', { type: 3 });

  // Tarea de inactividad de 24 horas para tickets
  setInterval(checkInactiveTickets, 1000 * 60 * 30);
});

// ============================================================================
// EVENTO: BIENVENIDAS & AUTO-ROLES (guildMemberAdd)
// ============================================================================
client.on('guildMemberAdd', async (member) => {
  if (!config.welcome || !config.welcome.enabled) return;

  try {
    // 1. Asignar Auto-Rol si está configurado
    if (config.welcome.autoRoleId && config.welcome.autoRoleId !== 'TU_ROL_ID') {
      const role = member.guild.roles.cache.get(config.welcome.autoRoleId);
      if (role) await member.roles.add(role);
    }

    // 2. Enviar embed al canal de bienvenidas
    const channel = member.guild.channels.cache.find(
      (c) => c.name === config.welcome.channelName || c.name === 'bienvenidas'
    );

    if (channel) {
      const welcomeEmbed = new EmbedBuilder()
        .setColor('#06b6d4')
        .setTitle('👋 ¡Nuevo Miembro en el Servidor!')
        .setDescription(
          config.welcome.message
            .replace('{user}', `<@${member.id}>`)
            .replace('{server}', member.guild.name)
            .replace('{members}', member.guild.memberCount.toString())
        )
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: `ID de usuario: ${member.id}` })
        .setTimestamp();

      await channel.send({ embeds: [welcomeEmbed] });
    }
  } catch (error) {
    console.error('Error en guildMemberAdd:', error);
  }
});

// ============================================================================
// EVENTO: AUTOMOD (Anti-Invites y Anti-Spam en messageCreate)
// ============================================================================
client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;

  const modConf = config.moderation;
  if (!modConf || !modConf.enabled) return;

  // Filtro Anti-Invitaciones
  if (modConf.antiInvites) {
    const inviteRegex = /(discord\.(gg|io|me|li)|discordapp\.com\/invite)\/.+/i;
    if (inviteRegex.test(message.content) && !message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      await message.delete().catch(() => {});
      const warnMsg = await message.channel.send(`⚠️ <@${message.author.id}>, no está permitido compartir enlaces de invitación a otros servidores.`);
      setTimeout(() => warnMsg.delete().catch(() => {}), 5000);
      return;
    }
  }
});

// ============================================================================
// GESTOR DE COMANDOS SLASH (interactionCreate)
// ============================================================================
client.on('interactionCreate', async (interaction) => {
  if (interaction.isChatInputCommand()) {
    const { commandName } = interaction;

    // --- MÓDULO TICKETS ---
    if (commandName === 'panel') {
      await handlePanelCommand(interaction);
    } else if (commandName === 'ticket') {
      await handleTicketSubcommands(interaction);
    }

    // --- MÓDULO TIENDA Y ECONOMÍA ---
    else if (commandName === 'tienda') {
      await handleShopCommand(interaction);
    } else if (commandName === 'comprar') {
      await handleBuyCommand(interaction);
    } else if (commandName === 'metodos') {
      await handlePaymentMethodsCommand(interaction);
    } else if (commandName === 'balance') {
      const user = interaction.options.getUser('usuario') || interaction.user;
      const bal = userBalances.get(user.id) || 1000;
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#06b6d4')
            .setTitle(`🪙 Monedero de ${user.username}`)
            .setDescription(`Saldo actual: **${bal.toLocaleString()} Monedas**`)
            .setThumbnail(user.displayAvatarURL())
        ],
        ephemeral: true
      });
    } else if (commandName === 'pagar') {
      const target = interaction.options.getUser('usuario');
      const amount = interaction.options.getInteger('cantidad');
      if (amount <= 0) return interaction.reply({ content: '❌ La cantidad debe ser mayor a 0.', ephemeral: true });
      
      const current = userBalances.get(interaction.user.id) || 1000;
      if (current < amount) return interaction.reply({ content: '❌ Saldo insuficiente.', ephemeral: true });

      userBalances.set(interaction.user.id, current - amount);
      userBalances.set(target.id, (userBalances.get(target.id) || 1000) + amount);

      await interaction.reply({
        content: `✅ Has transferido **${amount} Monedas** a <@${target.id}>.`
      });
    }

    // --- MÓDULO MODERACIÓN ---
    else if (commandName === 'ban') {
      const user = interaction.options.getUser('usuario');
      const reason = interaction.options.getString('razon') || 'Sin motivo especificado';
      await interaction.guild.members.ban(user.id, { reason });
      await interaction.reply({ content: `🔨 **${user.tag}** ha sido baneado permanentemente. Motivo: ${reason}` });
    } else if (commandName === 'kick') {
      const member = interaction.options.getMember('usuario');
      const reason = interaction.options.getString('razon') || 'Sin motivo';
      await member.kick(reason);
      await interaction.reply({ content: `👢 **${member.user.tag}** ha sido expulsado del servidor.` });
    } else if (commandName === 'timeout') {
      const member = interaction.options.getMember('usuario');
      const durationStr = interaction.options.getString('duracion');
      const reason = interaction.options.getString('razon') || 'Sanción temporal';
      
      // Parsear 10m, 1h, etc.
      let ms = 10 * 60 * 1000; // default 10m
      if (durationStr.endsWith('m')) ms = parseInt(durationStr) * 60 * 1000;
      if (durationStr.endsWith('h')) ms = parseInt(durationStr) * 60 * 60 * 1000;
      if (durationStr.endsWith('d')) ms = parseInt(durationStr) * 24 * 60 * 60 * 1000;

      await member.timeout(ms, reason);
      await interaction.reply({ content: `🔇 **${member.user.tag}** ha sido silenciado por ${durationStr}. Motivo: ${reason}` });
    } else if (commandName === 'clear') {
      const amount = interaction.options.getInteger('cantidad');
      const messages = await interaction.channel.bulkDelete(amount, true);
      await interaction.reply({ content: `🧹 Se han eliminado **${messages.size}** mensajes con éxito.`, ephemeral: true });
    } else if (commandName === 'warn') {
      const user = interaction.options.getUser('usuario');
      const reason = interaction.options.getString('razon');
      const current = userWarns.get(user.id) || [];
      current.push(reason);
      userWarns.set(user.id, current);

      await interaction.reply({
        content: `⚠️ Se ha advertido a <@${user.id}> (Advertencia #${current.length}). Motivo: ${reason}`
      });
    }

    // --- MÓDULO SORTEOS (GIVEAWAYS) ---
    else if (commandName === 'giveaway') {
      const sub = interaction.options.getSubcommand();
      if (sub === 'start') {
        const prize = interaction.options.getString('premio');
        const winners = interaction.options.getInteger('ganadores');
        const duration = interaction.options.getString('duracion');

        const gEmbed = new EmbedBuilder()
          .setColor('#f59e0b')
          .setTitle(`🎉 ¡SORTEO: ${prize}! 🎉`)
          .setDescription(`¡Reacciona con el botón abajo para participar!\n\n**Ganadores:** ${winners}\n**Duración:** ${duration}\n**Organizado por:** <@${interaction.user.id}>`)
          .setFooter({ text: 'Termina en ' + duration })
          .setTimestamp();

        const btn = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('giveaway_enter')
            .setLabel('Participar (0)')
            .setEmoji('🎉')
            .setStyle(ButtonStyle.Success)
        );

        await interaction.channel.send({ embeds: [gEmbed], components: [btn] });
        await interaction.reply({ content: '✅ Sorteo iniciado correctamente.', ephemeral: true });
      }
    }

    // --- MÓDULO UTILIDAD ---
    else if (commandName === 'serverinfo') {
      const sEmbed = new EmbedBuilder()
        .setColor('#06b6d4')
        .setTitle(`📊 Información de ${interaction.guild.name}`)
        .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
        .addFields(
          { name: '👑 Dueño', value: `<@${interaction.guild.ownerId}>`, inline: true },
          { name: '👥 Miembros', value: `${interaction.guild.memberCount}`, inline: true },
          { name: '💬 Canales', value: `${interaction.guild.channels.cache.size}`, inline: true },
          { name: '🛡️ Roles', value: `${interaction.guild.roles.cache.size}`, inline: true },
          { name: '🚀 Boosts', value: `Nivel ${interaction.guild.premiumTier} (${interaction.guild.premiumSubscriptionCount || 0} boosts)`, inline: true }
        )
        .setFooter({ text: `ID del Servidor: ${interaction.guild.id}` });

      await interaction.reply({ embeds: [sEmbed] });
    } else if (commandName === 'ping') {
      await interaction.reply({
        content: `🏓 Pong! Latencia del WebSocket: **${client.ws.ping}ms**`,
        ephemeral: true
      });
    }
  }

  // --- INTERACCIÓN DE BOTONES Y DESPLEGABLES ---
  if (interaction.isButton()) {
    const id = interaction.customId;

    if (id.startsWith('ticket_open_')) {
      const catId = id.replace('ticket_open_', '');
      await initiateTicketCreation(interaction, catId);
    } else if (id === 'ticket_action_close') {
      await handleTicketClose(interaction.channel, interaction.user, 'Cerrado mediante botón');
    } else if (id === 'ticket_action_claim') {
      await interaction.reply({ content: `🙋 Ticket reclamado por <@${interaction.user.id}>.` });
    } else if (id === 'ticket_action_transcript') {
      await generateTicketTranscript(interaction.channel, interaction.user);
    } else if (id === 'giveaway_enter') {
      await interaction.reply({ content: '🎉 ¡Has entrado al sorteo exitosamente!', ephemeral: true });
    } else if (id.startsWith('buy_item_')) {
      const productId = id.replace('buy_item_', '');
      await initiateTicketCreation(interaction, 'comprar', productId);
    }
  }

  if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_category_select') {
    const selected = interaction.values[0].replace('ticket_cat_', '');
    await initiateTicketCreation(interaction, selected);
  }

  if (interaction.isModalSubmit() && interaction.customId.startsWith('modal_ticket_')) {
    const catId = interaction.customId.replace('modal_ticket_', '');
    await finalizeTicketCreationWithModal(interaction, catId);
  }
});

// ============================================================================
// FUNCIONES DE SOPORTE & PANEL DE TICKETS (Flashy Store + Ghost Market)
// ============================================================================

async function handlePanelCommand(interaction) {
  const targetChannel = interaction.options.getChannel('canal') || interaction.channel;
  const tConf = config.tickets;

  // 1. Mensaje de normas / anuncio previo (Estilo Flashy Store)
  if (tConf.announcement && tConf.announcement.enabled) {
    let annText = `**${tConf.announcement.title}**\n\n`;
    tConf.announcement.rules.forEach((r) => {
      annText += `• ${r}\n`;
    });
    annText += `\n`;
    tConf.announcement.channels.forEach((ch) => {
      annText += `${ch.icon} <#${ch.name}> `;
    });
    annText += `\n\n${tConf.announcement.tag || '@everyone'}`;

    await targetChannel.send(annText);
  }

  // 2. Embed Principal de Tickets
  const mainEmbed = new EmbedBuilder()
    .setColor('#06b6d4')
    .setTitle(tConf.embed.title)
    .setDescription(tConf.embed.descriptionHeader);

  if (tConf.embed.showRulesSection) {
    mainEmbed.addFields({
      name: tConf.embed.rulesTitle,
      value: tConf.embed.rules.join('\n'),
      inline: false,
    });
  }

  if (tConf.embed.quoteNote) {
    mainEmbed.addFields({
      name: '💡 Recordatorio:',
      value: `> ${tConf.embed.quoteNote}`,
      inline: false,
    });
  }

  mainEmbed.setFooter({
    text: `${tConf.embed.footerText} • ${tConf.embed.footerPendingNotice}`,
  });

  // 3. Componentes interactivos (Botones y/o Select Menu)
  const components = buildPanelComponents();
  await targetChannel.send({ embeds: [mainEmbed], components });

  await interaction.reply({
    content: `✅ Panel de tickets publicado exitosamente en <#${targetChannel.id}>.`,
    ephemeral: true,
  });
}

function buildPanelComponents() {
  const rows = [];
  const tConf = config.tickets;
  const mode = tConf.layoutMode; // 'buttons' | 'select' | 'hybrid'

  // Select Menu (Flashy Store)
  if (mode === 'select' || mode === 'hybrid') {
    const selectOptions = tConf.categories.map((cat) => ({
      label: cat.buttonLabel || cat.name.slice(0, 25),
      description: cat.description.slice(0, 50),
      value: `ticket_cat_${cat.id}`,
      emoji: cat.emoji || '🎫',
    }));

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('ticket_category_select')
      .setPlaceholder('Elige una categoría para abrir tu ticket...')
      .addOptions(selectOptions);

    rows.push(new ActionRowBuilder().addComponents(selectMenu));
  }

  // Botones (Ghost Market)
  if (mode === 'buttons' || mode === 'hybrid') {
    const buttonRow1 = new ActionRowBuilder();
    const buttonRow2 = new ActionRowBuilder();

    tConf.categories.forEach((cat, index) => {
      let style = ButtonStyle.Secondary;
      if (cat.buttonColor === 'Success') style = ButtonStyle.Success;
      if (cat.buttonColor === 'Primary') style = ButtonStyle.Primary;
      if (cat.buttonColor === 'Danger') style = ButtonStyle.Danger;

      const btn = new ButtonBuilder()
        .setCustomId(`ticket_open_${cat.id}`)
        .setLabel(cat.buttonLabel)
        .setEmoji(cat.emoji)
        .setStyle(style);

      if (index < 4) {
        buttonRow1.addComponents(btn);
      } else if (index < 8) {
        buttonRow2.addComponents(btn);
      }
    });

    if (buttonRow1.components.length > 0) rows.push(buttonRow1);
    if (buttonRow2.components.length > 0) rows.push(buttonRow2);
  }

  return rows;
}

// Inicia el flujo de apertura de ticket (abre modal si la categoría lo requiere)
async function initiateTicketCreation(interaction, categoryId, extraItem) {
  const cat = config.tickets.categories.find((c) => c.id === categoryId);
  if (!cat) return interaction.reply({ content: '❌ Categoría no encontrada.', ephemeral: true });

  if (cat.requireModal && cat.modalFields && cat.modalFields.length > 0) {
    const modal = new ModalBuilder()
      .setCustomId(`modal_ticket_${cat.id}`)
      .setTitle(`Ticket: ${cat.buttonLabel}`.slice(0, 45));

    cat.modalFields.forEach((field) => {
      const input = new TextInputBuilder()
        .setCustomId(field.id)
        .setLabel(field.label.slice(0, 45))
        .setPlaceholder(field.placeholder.slice(0, 100))
        .setRequired(field.required)
        .setStyle(field.style === 'paragraph' ? TextInputStyle.Paragraph : TextInputStyle.Short);

      modal.addComponents(new ActionRowBuilder().addComponents(input));
    });

    return await interaction.showModal(modal);
  }

  await createTicketChannel(interaction, cat, {});
}

async function finalizeTicketCreationWithModal(interaction, categoryId) {
  const cat = config.tickets.categories.find((c) => c.id === categoryId);
  const answers = {};
  if (cat && cat.modalFields) {
    cat.modalFields.forEach((f) => {
      answers[f.label] = interaction.fields.getTextInputValue(f.id);
    });
  }
  await createTicketChannel(interaction, cat, answers);
}

async function createTicketChannel(interaction, category, answers) {
  const guild = interaction.guild;
  const user = interaction.user;

  await interaction.deferReply({ ephemeral: true });

  const channelName = `${category.ticketChannelPrefix || 'ticket'}-${user.username.slice(0, 10)}`.toLowerCase().replace(/[^a-z0-9]/g, '-');

  const permissionOverwrites = [
    { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
    { id: user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles] },
    { id: client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels] },
  ];

  if (category.staffRoleId && category.staffRoleId !== 'TU_ROL_DE_STAFF_ID') {
    permissionOverwrites.push({
      id: category.staffRoleId,
      allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
    });
  }

  const ticketChannel = await guild.channels.create({
    name: channelName,
    type: ChannelType.GuildText,
    permissionOverwrites,
  });

  activeTickets.set(ticketChannel.id, {
    authorId: user.id,
    categoryId: category.id,
    createdAt: Date.now(),
    lastActivity: Date.now(),
  });

  const welcomeEmbed = new EmbedBuilder()
    .setColor('#06b6d4')
    .setTitle(`${category.emoji} ${category.name}`)
    .setDescription(
      `¡Hola <@${user.id}>! Gracias por comunicarte con nosotros.\n${category.welcomeMessage}\n\n**Norma 24h:** Recuerda que los tickets con 24 horas de inactividad se cerrarán automáticamente.`
    )
    .setTimestamp();

  Object.entries(answers).forEach(([question, answer]) => {
    if (answer) {
      welcomeEmbed.addFields({ name: `📋 ${question}`, value: answer, inline: false });
    }
  });

  const actionRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('ticket_action_claim').setLabel('Reclamar').setEmoji('🙋').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('ticket_action_close').setLabel('Cerrar Ticket').setEmoji('🔒').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('ticket_action_transcript').setLabel('Transcript').setEmoji('📜').setStyle(ButtonStyle.Secondary)
  );

  await ticketChannel.send({
    content: `<@${user.id}> bienvenido a tu ticket. <@&${category.staffRoleId || guild.roles.everyone.id}>`,
    embeds: [welcomeEmbed],
    components: [actionRow],
  });

  await interaction.editReply({
    content: `✅ Tu ticket ha sido creado correctamente en <#${ticketChannel.id}>.`,
  });
}

async function handleTicketClose(channel, closedBy, reason) {
  const closeEmbed = new EmbedBuilder()
    .setColor('#ef4444')
    .setTitle('🔒 Ticket Cerrado')
    .setDescription(`Este ticket ha sido cerrado por <@${closedBy.id}>.\n**Motivo:** ${reason}\n\nEl canal será eliminado en **5 segundos**.`)
    .setTimestamp();

  await channel.send({ embeds: [closeEmbed] });

  setTimeout(async () => {
    try {
      activeTickets.delete(channel.id);
      await channel.delete('Ticket finalizado');
    } catch (e) {
      console.error('Error al borrar canal:', e);
    }
  }, 5000);
}

async function generateTicketTranscript(channel, requestedBy) {
  const messages = await channel.messages.fetch({ limit: 100 });
  const log = messages
    .reverse()
    .map((m) => `[${new Date(m.createdTimestamp).toLocaleString()}] ${m.author.tag}: ${m.cleanContent}`)
    .join('\n');

  const buffer = Buffer.from(log, 'utf-8');
  await channel.send({
    content: `📜 Transcript generado a petición de <@${requestedBy.id}>:`,
    files: [{ attachment: buffer, name: `transcript-${channel.name}.txt` }],
  });
}

function checkInactiveTickets() {
  const now = Date.now();
  const maxInactiveMs = 24 * 60 * 60 * 1000;

  activeTickets.forEach(async (data, channelId) => {
    if (now - data.lastActivity > maxInactiveMs) {
      const channel = client.channels.cache.get(channelId);
      if (channel) {
        await channel.send('⏰ Ticket cerrado por 24h de inactividad.');
        activeTickets.delete(channelId);
        setTimeout(() => channel.delete('24h inactividad').catch(() => {}), 5000);
      }
    }
  });
}

// ============================================================================
// TIENDA & MÉTODOS DE PAGO
// ============================================================================
async function handleShopCommand(interaction) {
  const sProducts = config.store.products;
  const sEmbed = new EmbedBuilder()
    .setColor('#06b6d4')
    .setTitle('🛒 Catálogo Oficial de la Tienda')
    .setDescription('Haz clic en el botón correspondiente para adquirir cualquiera de nuestros productos o abre un ticket de compra.')
    .setFooter({ text: 'Pagos protegidos y entrega inmediata' });

  sProducts.forEach((p) => {
    sEmbed.addFields({
      name: `${p.emoji} ${p.name} — $${p.price} ${p.currency}`,
      value: `${p.description}\n*Stock:* ${p.stock === 'unlimited' ? 'Infinito' : p.stock + ' disponibles'}`,
      inline: false,
    });
  });

  const row = new ActionRowBuilder();
  sProducts.slice(0, 4).forEach((p) => {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`buy_item_${p.id}`)
        .setLabel(`Comprar ${p.name.slice(0, 15)}`)
        .setEmoji(p.emoji || '🛒')
        .setStyle(ButtonStyle.Success)
    );
  });

  await interaction.reply({ embeds: [sEmbed], components: [row] });
}

async function handleBuyCommand(interaction) {
  const productName = interaction.options.getString('producto');
  await initiateTicketCreation(interaction, 'comprar', productName);
}

async function handlePaymentMethodsCommand(interaction) {
  const methods = config.store.paymentMethods;
  const mEmbed = new EmbedBuilder()
    .setColor('#06b6d4')
    .setTitle('🏦 Métodos de Pago Aceptados')
    .setDescription('Aceptamos las siguientes vías de pago seguras para todos nuestros servicios:')
    .setFooter({ text: 'Verifica siempre que estás pagando a las cuentas oficiales' });

  methods.forEach((m) => {
    mEmbed.addFields({
      name: `${m.icon} ${m.name}`,
      value: `**Datos:** ${m.details}\n*${m.feeNotice}*`,
      inline: false,
    });
  });

  await interaction.reply({ embeds: [mEmbed] });
}

client.login(process.env.DISCORD_TOKEN);
