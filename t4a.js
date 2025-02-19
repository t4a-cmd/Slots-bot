const { Client, GatewayIntentBits, REST, Routes, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { token, guildId, clientId, embedcolour, customStatus } = require('./config.json'); // Ajoutez customStatus ici
const startCheckingSlots = require('./checkExpiredSlots');
const trackPings = require('./tracking');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

// ASCII Logo function
function printLogo() {
    console.clear();
    console.log(`
███████╗██╗      ██████╗ ████████╗    ██████╗  ██████╗ ████████╗
██╔════╝██║     ██╔═══██╗╚══██╔══╝    ██╔══██╗██╔═══██╗╚══██╔══╝
███████╗██║     ██║   ██║   ██║       ██████╔╝██║   ██║   ██║   
╚════██║██║     ██║   ██║   ██║       ██╔══██╗██║   ██║   ██║   
███████║███████╗╚██████╔╝   ██║       ██████╔╝╚██████╔╝   ██║   
╚══════╝╚══════╝ ╚═════╝    ╚═╝       ╚═════╝  ╚═════╝    ╚═╝   

                By t4a     discord.gg/t4a
                                                                
    `);
}

client.commands = new Collection();
const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(path.join(__dirname, 'commands', file));
  client.commands.set(command.data.name, command);
}

const deployCommands = async () => {
  const commands = [];
  for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    commands.push(command.data.toJSON());
  }

  const rest = new REST({ version: '10' }).setToken(token);

  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: commands },
    );

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
};

client.once('ready', async () => {
  printLogo();  // Print the ASCII logo when the bot starts
  console.log(`Logged in as ${client.user.tag}!`);
  
  await client.user.setPresence({
    activities: [{ name: customStatus, type: 'WATCHING' }], 
    status: 'dnd' //  'idle', 'dnd', or 'invisible'
  });

  await deployCommands();
  startCheckingSlots(client);
});

client.on('messageCreate', async message => {
  trackPings(client, message);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({ content: 'There was an error executing that command!', ephemeral: true });
  }
});

client.login(token);
