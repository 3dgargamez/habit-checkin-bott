import 'dotenv/config';
import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } from 'discord.js';
import axios from 'axios';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Register slash command at start
const commands = [
  new SlashCommandBuilder()
    .setName('checkin')
    .setDescription('Log a habit check-in')
    .addStringOption(o =>
      o.setName('habit').setDescription('e.g., read 10 pages').setRequired(true)
    )
].map(c => c.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    if (process.env.GUILD_ID) {
      await rest.put(
        Routes.applicationGuildCommands(process.env.DISCORD_APP_ID, process.env.GUILD_ID),
        { body: commands }
      );
    } else {
      await rest.put(
        Routes.applicationCommands(process.env.DISCORD_APP_ID),
        { body: commands }
      );
    }
    console.log('✅ Slash command registered');
  } catch (e) {
    console.error('Command register error:', e);
  }
})();

// Handle interactions
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== 'checkin') return;

  const habit = interaction.options.getString('habit');
  await interaction.deferReply({ ephemeral: true });

  try {
    await axios.post(process.env.N8N_CHECKIN_URL, {
      user_id: interaction.user.id,
      username: interaction.user.username,
      habit,
      timestamp: new Date().toISOString()
    });
    await interaction.editReply(`💪 Check-in saved for **${habit}**. Nice!`);
  } catch (err) {
    console.error(err?.response?.data || err.message);
    await interaction.editReply('⚠️ Could not save that. Try again in a minute.');
  }
});

client.once('ready', () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);
});

client.login(process.env.DISCORD_TOKEN);
