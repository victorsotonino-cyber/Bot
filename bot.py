# ============================================================================
# Discord Bot Completo en Python (discord.py v2.0+)
# Módulos: Tickets, Tienda, Moderación y Utilidades
# ============================================================================
import discord
from discord import app_commands
from discord.ext import commands
import os

intents = discord.Intents.default()
intents.message_content = True
intents.members = True

bot = commands.Bot(command_prefix="!", intents=intents)
ACCENT_COLOR = int("06b6d4", 16)

class TicketView(discord.ui.View):
    def __init__(self):
        super().__init__(timeout=None)

    @discord.ui.button(label="Comprar", style=discord.ButtonStyle.success, emoji="💸")
    async def buy_button(self, interaction: discord.Interaction, button: discord.ui.Button):
        await interaction.response.send_message("Abriendo ticket de compra...", ephemeral=True)

    @discord.ui.button(label="Soporte", style=discord.ButtonStyle.primary, emoji="🗨️")
    async def support_button(self, interaction: discord.Interaction, button: discord.ui.Button):
        await interaction.response.send_message("Abriendo ticket de soporte...", ephemeral=True)

    @discord.ui.button(label="Quejas", style=discord.ButtonStyle.danger, emoji="🛑")
    async def complaint_button(self, interaction: discord.Interaction, button: discord.ui.Button):
        await interaction.response.send_message("Abriendo ticket de quejas...", ephemeral=True)

@bot.event
async def on_ready():
    print(f"✅ Bot conectado como {bot.user}")
    await bot.tree.sync()

@bot.tree.command(name="panel", description="Envía el panel de soporte y tienda")
@app_commands.checks.has_permissions(administrator=True)
async def panel(interaction: discord.Interaction):
    embed = discord.Embed(
        title="⛈️ 「 Centro de Soporte 」 ⛈️",
        description="✨ Usa los apartados según lo que necesites para recibir atención inmediata de nuestro equipo:",
        color=ACCENT_COLOR
    )
    embed.add_field(name="⏰ Normas 24h", value="Los tickets sin respuesta en 24h se cerrarán automáticamente.", inline=False)
    embed.set_footer(text="Sistema oficial v2.5 • NexusBot")
    await interaction.channel.send(embed=embed, view=TicketView())
    await interaction.response.send_message("Panel publicado.", ephemeral=True)

@bot.tree.command(name="tienda", description="Muestra los productos de la tienda")
async def tienda(interaction: discord.Interaction):
    embed = discord.Embed(title="🛒 Tienda Oficial", color=ACCENT_COLOR)
    embed.add_field(name="🚀 Nitro Boost 1M", value="$3.99 USD", inline=True)
    embed.add_field(name="👑 Rango VIP", value="$8.50 USD", inline=True)
    await interaction.response.send_message(embed=embed)

@bot.tree.command(name="ban", description="Banea a un usuario")
@app_commands.checks.has_permissions(ban_members=True)
async def ban(interaction: discord.Interaction, usuario: discord.Member, razon: str = "Sin motivo"):
    await usuario.ban(reason=razon)
    await interaction.response.send_message(f"🔨 {usuario.mention} ha sido baneado. Motivo: {razon}")

bot.run(os.getenv("DISCORD_TOKEN"))
