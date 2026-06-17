require("dotenv").config({ quiet: true });

const { Client, GatewayIntentBits, SlashCommandBuilder } = require("discord.js");

const token = process.env.DISCORD_TOKEN;
const prefix = process.env.BOT_PREFIX || "!";
const projectName = process.env.PROJECT_NAME || "OpenBoard";

if (!token) {
  console.error("Missing DISCORD_TOKEN. Create .env from .env.example and add your bot token.");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
  ],
});

const commands = [
  new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Prueft, ob der Bot erreichbar ist."),
  new SlashCommandBuilder()
    .setName("project")
    .setDescription("Zeigt die Hackathon-Projektidee."),
  new SlashCommandBuilder()
    .setName("task")
    .setDescription("Formatiert eine neue Aufgabenidee.")
    .addStringOption((option) =>
      option
        .setName("text")
        .setDescription("Kurzer Aufgabentext")
        .setRequired(true)
    ),
].map((command) => command.toJSON());

client.once("ready", async () => {
  await client.application.commands.set(commands);
  console.log(`Discord bot logged in as ${client.user.tag}`);
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) {
    return;
  }

  if (interaction.commandName === "ping") {
    await interaction.reply("pong");
    return;
  }

  if (interaction.commandName === "project") {
    await interaction.reply(
      `${projectName}: ein einfaches Open-Source-Organisationssystem fuer Teams mit Projekten, Aufgaben, Kanban-Board und Dashboard.`
    );
    return;
  }

  if (interaction.commandName === "task") {
    const taskText = interaction.options.getString("text", true).trim();

    await interaction.reply(`Neue Aufgabenidee fuer ${projectName}: **${taskText}**`);
    return;
  }
});

client.login(token);
