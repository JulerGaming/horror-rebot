const { REST, Routes, SlashCommandBuilder } = require("discord.js");
// Info needed for slash commands (so we don't have to use "!" before commands)
const botID = "1369007178664378429"; // Do not include serverID here
const botToken = process.env.token;

const rest = new REST().setToken(botToken);
const slashRegister = async () => {
  try {
    await rest.put(Routes.applicationCommands(botID), {
      body: [
        new SlashCommandBuilder()
          .setName("ping")
          .setDescription("most basic command on a bot"),

        new SlashCommandBuilder()
          .setName("balls")
          .setDescription("sends a random ball gif from tenor"),

        new SlashCommandBuilder()
          .setName("avatar")
          .setDescription("sends your avatar or the avatar of the user you provide")
          .addUserOption((option) =>
            option
              .setName("user")
              .setDescription("the user you want to get the avatar of")
              .setRequired(false)
          ),

        new SlashCommandBuilder()
          .setName("randommention")
          .setDescription("finds someone in this guild and mentions them (like a surprise!)"),

        new SlashCommandBuilder()
          .setName("8ball")
          .setDescription("answers your question")
          .addStringOption((option) =>
            option
              .setName("question")
              .setDescription("the question you want to ask")
              .setRequired(true)
          ),
        new SlashCommandBuilder()
          .setName("tenor")
          .setDescription("sends a random gif from tenor")
          .addStringOption((option) =>
            option
              .setName("query")
              .setDescription("the query you want to search for")
              .setRequired(true)
          )
      ]
    });
    console.log("Successfully registered the slash commands globally");
  } catch (error) {
    console.error(error);
  }
};

slashRegister();