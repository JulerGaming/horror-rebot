const express = require("express");
const app = express();

// Error handling
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
});

// Bind to 0.0.0.0 to make it accessible
app.listen(3000, "0.0.0.0", () => {
  console.log("Project is running!");
});

// Keep the process alive
const http = require("http");

// Keep the process alive by sending periodic requests
setInterval(() => {
  http.get("http://localhost:3000"); // Change to your service's address if needed
}, 20000); // Send a request every 60 seconds

app.get("/", (req, res) => {
  res.send("Hello World!");
});

const { Client, GatewayIntentBits, ActivityType } = require("discord.js");

const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  getVoiceConnection,
  entersState,
  StreamType,
} = require("@discordjs/voice");
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
});

client.once("ready", () => {
  client.user.setActivity("with your mom", {
    type: ActivityType.Playing,
    status: "dnd", // online, idle, dnd, invisible
  });
  console.log("Bot is ready and status set!");
});

const fs = require("fs");
const { markAsUncloneable } = require("worker_threads");
const { TIMEOUT } = require("dns");
const { channel } = require("diagnostics_channel");
const badWords = fs.readFileSync("bad-words.txt", "utf-8").split("\n");

client.on("messageCreate", async (message) => {
  const words = message.content.split(" ");
  for (const word of words) {
    if (badWords.includes(word.toLowerCase())) {
      message.delete();
      try {
        await message.member.timeout(600000, "Using inappropriate language.");
      } catch (error) {
        if (error.code === 50013) {
          console.log(`Bad word detected: ${word}`);
          console.log(
            "Missing permissions to timeout user, message was still deleted",
          );
          message.channel.send(
            `${message.author}, your message has been deleted.`,
          );
        } else {
          message.channel.send(
            `${message.author} has been timed out for 10 minutes for using inappropriate language.`,
          );
        }
      }
      break;
    }
  }
});

const cheatsWords = fs.readFileSync("cheat-words.txt", "utf-8").split("\n");

client.on("messageCreate", (message) => {
  const words = message.content.split(" ");
  for (const word of words) {
    if (cheatsWords.includes(word.toLowerCase())) {
      message.reply(
        "# No cheats in Horror Remake! \nWe know that modding is fun, but it can ruin the game for others. Please don't do it.",
      );
    }
  }
});

const ballGifTenor = [
  "https://tenor.com/view/maxeff-who-dropped-the-ball-gif-7728732350967487396",
  "https://tenor.com/view/bouncing-blue-ball-boy-gif-12378937218633738106",
  "https://tenor.com/view/basketball-activity-joypixels-ball-orange-ball-gif-17197142",
  "https://tenor.com/view/pepeballs-gif-7861594524755615584",
];
const ffmpegPath = require("ffmpeg-static");

client.on("interactionCreate", async (interaction) => {
  try {
    if (interaction.isCommand()) {
      if (interaction.commandName === "ping") {
        console.log(
          `Recieved interaction request for ping by ${interaction.user.displayName}`,
        );
        interaction.reply({
          content: "pong! " + client.ws.ping + " ms",
          flags: ["Ephemeral"],
        });
      }

      if (interaction.commandName === "balls") {
        console.log(
          `Recieved interaction request for balls by ${interaction.user.displayName}`,
        );
        const ballGif =
          ballGifTenor[Math.floor(Math.random() * ballGifTenor.length)];
        console.log(
          "Sending " + ballGif + " to " + interaction.user.displayName,
        );
        interaction.reply(ballGif);
      }
      if (interaction.commandName === "avatar") {
        console.log(
          `Recieved interaction request for avatar by ${interaction.user.displayName}`,
        );
        if (interaction.options.getUser("user")) {
          const user = interaction.options.getUser("user");
          interaction.reply(
            user.displayAvatarURL({
              size: 1024,
              dynamic: true,
              format: "png",
              ephemeral: true,
            }),
          );
        } else {
          interaction.reply(
            interaction.user.displayAvatarURL({
              size: 1024,
              dynamic: true,
              format: "png",
              ephemeral: true,
            }),
          );
        }
      }
      if (interaction.commandName === "randommention") {
        console.log(
          `Received interaction request for randommention by ${interaction.user.displayName}`,
        );
        const limit = 1000; // Corrected limit for Discord API fetch
        console.time("FetchMembers");
        interaction.guild.members
          .list({ limit: limit })
          .then((members) => {
            console.timeEnd("FetchMembers");
            console.log(`Fetched ${members.size} members.`);
            const membersArray = Array.from(members.values());

            if (membersArray.length > 0) {
              const randomIndex = Math.floor(
                Math.random() * membersArray.length,
              );
              const randomMember = membersArray[randomIndex];
              console.log("Bot chose " + randomMember.user.displayName);
              const pokemonAhhMessage = [
                `<@${randomMember.user.id}>, I choose you!`,
                `*kisses* <@${randomMember.user.id}>`,
                `Woah woah <@${randomMember.user.id}> be lookin' sexy!`,
                `ooh, i love you, <@${randomMember.user.id}>!`,
              ];
              const message =
                pokemonAhhMessage[
                  Math.floor(Math.random() * pokemonAhhMessage.length)
                ];
              interaction.reply(message);
            } else {
              console.log("No members available.");
              interaction.reply("Could not find any members to mention.");
            }
          })
          .catch((error) => {
            console.error("Failed to fetch members:", error);
            interaction.reply(
              "Failed to fetch members. Please try again later. (Maybe the bot can't search the guild?)",
            );
          });
      }
      if (interaction.commandName === "8ball") {
        const question = interaction.options.getString("question")
        const eightBallResponses = [
          "Yes",
          "No",
          "Maybe",
          "Ask again later",
          "I don't know",
          "I'm not sure",
          "I can't tell you",
          "I don't want to tell you",
          "I don't want to say",
          "I don't want to say that",
          "I don't want to say that to you",
          "I don't want to say that to you right now",
        ];
        const nintendo = ["mario", "luigi", "peach", "yoshi", "toad", "bowser", "wario", "waluigi", "donkey kong", "diddy kong", "link", "zelda"]
        const response =
          eightBallResponses[
            Math.floor(Math.random() * eightBallResponses.length)
          ];
        console.log(
          "Recieved interaction request for 8ball by " + interaction.user.displayName,
        );
        console.log("The 8 ball says " + response);
        interaction.reply(interaction.user.displayName + " asked: " + question + "\nThe 8 ball said: " + response)
            
      }
      if(interaction.commandName === "tenor") {
        console.log("Recieved interaction request for tenor by " + interaction.user.displayName)
        const tenorQuery = interaction.options.getString("query")
        const cmdTenorGifs = `https://tenor.googleapis.com/v2/search?q=${tenorQuery}&key=${process.env.TENOR_KEY}&client_key=${process.env.TENOR_PROJ}&limit=8`
        try {
          const response = await fetch(cmdTenorGifs);
          const data = await response.json();

          if (data.results && data.results.length > 0) {
            const randomIndex = Math.floor(Math.random() * data.results.length);
            const randomGif = data.results[randomIndex].media_formats.gif.url;
            console.log("Bot chose " + randomGif + " for " + interaction.user.displayName + ", sending...")
            interaction.reply(randomGif);
          } else {
            interaction.reply("No GIFs found for that query.");
          }
        } catch (error) {
          console.error("Error fetching GIF:", error);
          interaction.reply("Failed to fetch GIF. Please try again later.");
        }
      }
    }
  } catch (error) {
    console.error(
      "I GOT AN ERROR WHILE USING THIS COMMAND WITH " +
        interaction.user.displayName +
        "!!!: " +
        error,
    );
    interaction.reply("This command caught an error. Please try again later.");
  }
});

client.login(process.env.token);

process.on("exit", (code) => {
  console.log(`About to exit with code: ${code}`);
  client.guilds.cache.forEach((guild) => {
    if (guild.voiceAdapterCreator) {
      const voiceConnection = getVoiceConnection(guild.id);
      if (voiceConnection) {
        console.log(`Disconnecting from voice channel in guild: ${guild.name}`);
        voiceConnection.destroy();
      }
    }
  });
  client.destroy();
});
