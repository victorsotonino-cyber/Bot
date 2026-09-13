import discord
from discord.ext import commands
import os
import asyncio

intents = discord.Intents.default()
intents.message_content = True
intents.guilds = True
intents.members = True

bot = commands.Bot(command_prefix="!", intents=intents)

# IDs configurados
ROLE_TO_TAG = 1451204772672831564

# --- VISTA DENTRO DEL TICKET (Reclamar y Cerrar) ---
class TicketActionView(discord.ui.View):
    def __init__(self):
        super().__init__(timeout=None)

    @discord.ui.button(label="Reclamar", style=discord.ButtonStyle.primary, emoji="<:aprobado_cherrybox:1488944560775102544>")
    async def claim_ticket(self, interaction: discord.Interaction, button: discord.ui.Button):
        if not interaction.user.guild_permissions.manage_channels:
            return await interaction.response.send_message("❌ No tienes permisos para reclamar tickets.", ephemeral=True)
        
        button.disabled = True
        button.label = f"Reclamado por {interaction.user.name}"
        await interaction.message.edit(view=self)
        await interaction.response.send_message(f"✅ Este ticket ha sido reclamado por {interaction.user.mention}.")

    @discord.ui.button(label="Cerrar Ticket", style=discord.ButtonStyle.danger, emoji="<:viperfinder_viperfinde_558:1489283055746027760>")
    async def close_ticket(self, interaction: discord.Interaction, button: discord.ui.Button):
        await interaction.response.send_message("🔒 Cerrando este canal de ticket en 5 segundos...")
        await asyncio.sleep(5)
        await interaction.channel.delete()

# --- MENÚ DESPLEGABLE DEL PANEL ---
class TicketSelect(discord.ui.Select):
    def __init__(self):
        options = [
            discord.SelectOption(label="Soporte", description="Abre ticket para resolver tus dudas o preguntas.", emoji="<:md_mantenimiento:1489283103242457261>"),
            discord.SelectOption(label="Comprar", description="Abre ticket para comprar algún producto de la tienda.", emoji="<:boost_cherry:1488944553497989334>"),
            discord.SelectOption(label="Reclamar", description="Abre ticket para solicitar tu recompensa.", emoji="<:regalo_cherrybox:1488944546510409911>"),
            discord.SelectOption(label="Quejas", description="Abre ticket para reportar un problema o queja.", emoji="<:viperfinder_viperfinde_558:1489283055746027760>"),
            discord.SelectOption(label="Media", description="Abre ticket para solicitar el rol Team Media.", emoji="<:Crown:1488947497278902312>"),
            discord.SelectOption(label="Postulacion", description="Abre ticket para postularte a staff.", emoji="<:aprobado_cherrybox:1488944560775102544>")
        ]
        super().__init__(placeholder="Selecciona el tipo de ticket...", min_values=1, max_values=1, options=options)

    async def callback(self, interaction: discord.Interaction):
        ticket_type = self.values[0]
        guild = interaction.guild
        
        # Canal suelto sin categoría fija para evitar errores
        category = None

        overwrites = {
            guild.default_role: discord.PermissionOverwrite(view_channel=False),
            interaction.user: discord.PermissionOverwrite(view_channel=True, send_messages=True, read_message_history=True),
            guild.me: discord.PermissionOverwrite(view_channel=True, send_messages=True)
        }

        channel_name = f"ticket-{ticket_type.lower()}-{interaction.user.name}"
        ticket_channel = await guild.create_text_channel(name=channel_name, category=category, overwrites=overwrites)

        embed_ticket = discord.Embed(
            title=f"<:Crown:1488947497278902312> Ticket de {ticket_type}",
            description=f"Hola {interaction.user.mention}, bienvenido a tu ticket.\n\n> <@&{ROLE_TO_TAG}> Un miembro del staff te atenderá en breve. Por favor detalla tu duda o problema.",
            color=discord.Color.green()
        )

        await ticket_channel.send(content=f"<@&{ROLE_TO_TAG}> {interaction.user.mention}", embed=embed_ticket, view=TicketActionView())
        await interaction.response.send_message(f"¡Ticket creado con éxito! Ve a {ticket_channel.mention}", ephemeral=True)

class TicketView(discord.ui.View):
    def __init__(self):
        super().__init__(timeout=None)
        self.add_item(TicketSelect())

@bot.event
async def on_ready():
    print(f"Bot conectado como {bot.user}")

# --- COMANDO PARA ENVIAR EL PANEL ---
@bot.command()
@commands.has_permissions(administrator=True)
async def panel(ctx):
    embed = discord.Embed(
        title="<:Crown:1488947497278902312> 「 Centro de Soporte 」 <:Crown:1488947497278902312>",
        description=(
            "<:boost_cherry:1488944553497989334> **Usa los apartados según lo que necesites:**\n\n"
            "▫️ Para **comprar un artículo**, selecciona en el menú 💲\n"
            "▫️ Para **recibir tu recompensa**, selecciona <:regalo_cherrybox:1488944546510409911>\n"
            "▫️ Para **soporte / dudas**, selecciona <:md_mantenimiento:1489283103242457261>\n"
            "▫️ Para **postularte**, selecciona <:aprobado_cherrybox:1488944560775102544>\n\n"
            "<:viperfinder_viperfinde_558:1489283055746027760> **Normas:**\n"
            "• El mal uso de este sistema será motivo de **sanción inmediata**.\n"
            "• Los tickets deben abrirse **solo por motivos válidos**.\n\n"
            "> `Recuerda ser claro y respetuoso en tu mensaje.`"
        ),
        color=discord.Color.dark_green()
    )
    embed.set_footer(text="Sistema de Tickets Oficial")
    await ctx.send(embed=embed, view=TicketView())


# ==========================================
# --- COMANDOS DE MODERACIÓN Y SORTEOS (!) ---
# ==========================================

@bot.command()
@commands.has_permissions(kick_members=True)
async def kick(ctx, member: discord.Member, *, reason="Sin razón especificada"):
    await member.kick(reason=reason)
    await ctx.send(f"<:aprobado_cherrybox:1488944560775102544> El usuario **{member.name}** ha sido expulsado correctamente. Razón: *{reason}*")

@bot.command()
@commands.has_permissions(ban_members=True)
async def ban(ctx, member: discord.Member, *, reason="Sin razón especificada"):
    await member.ban(reason=reason)
    await ctx.send(f"<:aprobado_cherrybox:1488944560775102544> El usuario **{member.name}** ha sido baneado correctamente. Razón: *{reason}*")

@bot.command()
@commands.has_permissions(manage_messages=True)
async def clear(ctx, amount: int):
    await ctx.channel.purge(limit=amount + 1)
    msg = await ctx.send(f"<:aprobado_cherrybox:1488944560775102544> Se han borrado **{amount}** mensajes.")
    await asyncio.sleep(3)
    await msg.delete()

@bot.command()
@commands.has_permissions(manage_roles=True)
async def mute(ctx, member: discord.Member):
    role = discord.utils.get(ctx.guild.roles, name="Muted")
    if not role:
        try:
            role = await ctx.guild.create_role(name="Muted", reason="Para sistema de muteos")
            for channel in ctx.guild.channels:
                await channel.set_permissions(role, send_messages=False, speak=False)
        except Exception:
            return await ctx.send("❌ No se pudo crear el rol 'Muted' automáticamente.")
    
    await member.add_roles(role)
    await ctx.send(f"<:aprobado_cherrybox:1488944560775102544> El usuario **{member.name}** ha sido silenciado.")

@bot.command()
@commands.has_permissions(manage_guild=True)
async def sorteo(ctx, *, premio: str):
    embed = discord.Embed(
        title="<:regalo_cherrybox:1488944546510409911> ¡NUEVO SORTEO! <:regalo_cherrybox:1488944546510409911>",
        description=f"Premio: **{premio}**\n\nReacciona con <:regalo_cherrybox:1488944546510409911> para participar.",
        color=discord.Color.gold()
    )
    embed.set_footer(text=f"Sorteo organizado por {ctx.author.name}")
    
    msg = await ctx.send(embed=embed)
    await msg.add_reaction("<:regalo_cherrybox:1488944546510409911>")

bot.run(os.getenv("DISCORD_TOKEN"))
