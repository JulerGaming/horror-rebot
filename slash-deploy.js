const { REST, Routes, SlashCommandBuilder } = require("discord.js");
// Info needed for slash commands (so we don't have to use "!" before commands)
// Read environment variables from .env file
require("dotenv").config();
const botID = "1369007178664378429"; // Do not include serverID here
const botToken = process.env.BOT_TOKEN; // Your bot token here
// Make sure to keep your bot token secret and never share it with anyone!
// If you need to reset your token, go to https://discord.com/developers/applications and select your bot application.
// Then go to the "Bot" tab and click on "Reset Token" to generate a new token.
// Update the botToken variable with the new token after resetting it
// Incase the bot token is compromised, please reset it immediately so the bot doesn't give everyone admin permissions or something like that. (Or worse, nuke your server. Theres a security bot so that doesn't happen.)

const rest = new REST().setToken(botToken);
const slashRegister = async () => {
  try {
    await rest.put(Routes.applicationCommands(botID), {
      body: [
        new SlashCommandBuilder()
          .setName("ping")
          .setDescription("most basic command on a bot")
          .setIntegrationTypes(0, 1)
          .setContexts(0, 1, 2),

        new SlashCommandBuilder()
          .setName("balls")
          .setDescription("sends a random ball gif from tenor")
          .setIntegrationTypes(0, 1)
          .setContexts(0, 1, 2),

        new SlashCommandBuilder()
          .setName("avatar")
          .setDescription("sends your avatar or the avatar of the user you provide")
          .setIntegrationTypes(0, 1)
          .setContexts(0, 1, 2)
          .addUserOption((option) =>
            option
              .setName("user")
              .setDescription("the user you want to get the avatar of")
              .setRequired(false)
          ),

        new SlashCommandBuilder()
          .setName("randommention")
          .setDescription("finds someone in this guild and mentions them (like a surprise!)")
          .setIntegrationTypes(0)
          .setContexts(0, 1, 2),

        new SlashCommandBuilder()
          .setName("8ball")
          .setDescription("answers your question")
          .setIntegrationTypes(0, 1)
          .setContexts(0, 1, 2)
          .addStringOption((option) =>
            option
              .setName("question")
              .setDescription("the question you want to ask")
              .setRequired(true)
          ),
        new SlashCommandBuilder()
          .setName("tenor")
          .setDescription("sends a random gif from tenor")
          .setIntegrationTypes(0, 1)
          .setContexts(0, 1, 2)
          .addStringOption((option) =>
            option
              .setName("query")
              .setDescription("the query you want to search for")
              .setRequired(true)
          ),
        new SlashCommandBuilder()
          .setName("base64encode")
          .setDescription("encodes text to base64")
          .setIntegrationTypes(0, 1)
          .setContexts(0, 1, 2)
          .addStringOption((option) =>
            option
              .setName("input")
              .setDescription("the text you want to encode")
              .setRequired(true)
          ),
        new SlashCommandBuilder()
          .setName("base64decode")
          .setDescription("decodes base64 text")
          .setIntegrationTypes(0, 1)
          .setContexts(0, 1, 2)
          .addStringOption((option) =>
            option
              .setName("input")
              .setDescription("the base64 text you want to decode")
              .setRequired(true)
          ),
        new SlashCommandBuilder()
          .setName("broadcast")
          .setDescription("broadcasts a message to all direct messages")
          .setIntegrationTypes(0)
          .setContexts(0) // Servers only
          .addStringOption((option) =>
            option
              .setName("message")
              .setDescription("the message you want to broadcast")
              .setRequired(true)
          ),
        new SlashCommandBuilder()
          .setName("broadcast-update")
          .setDescription("broadcasts an update message to all direct messages")
          .setIntegrationTypes(0)
          .setContexts(0) // Servers only
          .addStringOption((option) =>
            option
              .setName("title")
              .setDescription("the title of the update message")
              .setRequired(true)
          )
          .addStringOption((option) =>
            option
              .setName("message")
              .setDescription("the update message you want to broadcast")
              .setRequired(true)
          )
          .addAttachmentOption((option) =>
            option
              .setName("image")
              .setDescription("an image to attach to the broadcast message")
              .setRequired(false)
          )
          .addBooleanOption((option) =>
            option
              .setName("bold")
              .setDescription("whether you want the body to be bold or not")
              .setRequired(false)
          ),
        new SlashCommandBuilder()
          .setName("birthday")
          .setDescription("makes the bot wish you a happy birthday on your birthday")
          .setIntegrationTypes(0, 1)
          .setContexts(0, 1, 2)
          .addStringOption((option) =>
            option
              .setName("date")
              .setDescription("your birthday in the format MM-DD")
              .setRequired(true)
          )
          .addBooleanOption((option) =>
            option
              .setName("direct-message")
              .setDescription("whether you want your birthday to be public or not")
              .setRequired(false)
          ),
        new SlashCommandBuilder()
          .setName("petpet")
          .setDescription("sends a gif of you petting someone")
          .setIntegrationTypes(0, 1)
          .setContexts(0, 1, 2)
          .addUserOption((option) =>
            option
              .setName("user")
              .setDescription("the user you want to pet")
              .setRequired(true)
          ),
        new SlashCommandBuilder()
          .setName("saveavatarall")
          .setDescription("saves the avatars of all members in the server (JulerGT only)")
          .setIntegrationTypes(0)
          .setContexts(0), // Servers only
        new SlashCommandBuilder()
          .setName("joinvoice")
          .setDescription("makes the bot join your voice channel")
          .setIntegrationTypes(0)
          .setContexts(0) // if the bot isnt in the server it may crash because it cant find the voice channel (it has to be added to the server first)
            .addStringOption((group) =>
            group
              .setName("audiofile")
              .setDescription("select the audio file to play")
              .setRequired(true)
              .setAutocomplete(true) // if not then how will they find the files??
            ),
              // choices managed by code — do not hardcode them here
        new SlashCommandBuilder()
          .setName("uploadaudioresource")
          .setDescription("uploads an audio resource to play in voice channels")
          .setIntegrationTypes(0)
          .setContexts(0) // Servers only
          .addAttachmentOption((option) =>
            option
              .setName("audiofile")
              .setDescription("the audio file you want to upload")
              .setRequired(true)
          ),
        new SlashCommandBuilder()
          .setName("openurlstream")
          .setDescription("opens a URL stream in a voice channel")
          .setIntegrationTypes(0, 1)
          .setContexts(0, 1, 2)
          .addStringOption((option) =>
            option
              .setName("url")
              .setDescription("the URL of the stream you want to open")
              .setRequired(true)
          ),
        new SlashCommandBuilder()
          .setName("about")
          .setDescription("information about the bot")
          .setIntegrationTypes(0, 1)
          .setContexts(0, 1, 2),
        new SlashCommandBuilder()
          .setName("percentagemembers")
          .setDescription("shows the percentage of adults and minors in the server")
          .setIntegrationTypes(0)
          .setContexts(0), // Servers only
        new SlashCommandBuilder()
          .setName("pfpcheck")
          .setDescription("checks if a user's profile picture is appropriate")
          .setIntegrationTypes(0, 1)
          .setContexts(0, 1, 2),
      ]
    });
    console.log("Successfully registered the slash commands globally");
  } catch (error) {
    console.error(error);
  }
};

slashRegister();