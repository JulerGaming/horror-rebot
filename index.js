const express = require("express");
const app = express();
const keep_alive = require("./keep_alive.js");

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

const {
  Client,
  GatewayIntentBits,
  ActivityType
} = require("discord.js");

const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  getVoiceConnection,
  entersState,
  StreamType
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
          console.log(`Bad word detected: ${word}`)
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

const cheatsWords = fs.readFileSync("cheat-words.txt", "utf-8").split("\n")

client.on("messageCreate", (message) => {
  const words = message.content.split(" ");
  for (const word of words) {
    if (cheatsWords.includes(word.toLowerCase())) {
      message.reply("# No cheats in Horror Remake! \nWe know that modding is fun, but it can ruin the game for others. Please don't do it.");
    }
  }
});

const ballGifTenor = ["https://tenor.com/view/maxeff-who-dropped-the-ball-gif-7728732350967487396", "https://tenor.com/view/bouncing-blue-ball-boy-gif-12378937218633738106", "https://tenor.com/view/basketball-activity-joypixels-ball-orange-ball-gif-17197142", "https://tenor.com/view/pepeballs-gif-7861594524755615584"]
const ffmpegPath = require('ffmpeg-static');

client.on("interactionCreate", async (interaction) => {
  try {
    if(interaction.isCommand()) {
      if(interaction.commandName === "ping") {
        console.log(`Recieved interaction request for ping by ${interaction.user.displayName}`)
        interaction.reply({ content: "pong! " + client.ws.ping + " ms", flags: ['Ephemeral'] });
      }

      if(interaction.commandName === "balls") {
        console.log(`Recieved interaction request for balls by ${interaction.user.displayName}`)
        const ballGif = ballGifTenor[Math.floor(Math.random() * ballGifTenor.length)]
        console.log("Sending " + ballGif + " to " + interaction.user.displayName)
        interaction.reply(ballGif);
      }
      if(interaction.commandName === "avatar") {
        console.log(`Recieved interaction request for avatar by ${interaction.user.displayName}`)
        if(interaction.options.getUser("user")) {
          const user = interaction.options.getUser("user")
          interaction.reply(user.displayAvatarURL({ size: 1024, dynamic: true, format: "png", ephemeral: true }))
        }
        else {
          interaction.reply(interaction.user.displayAvatarURL({ size: 1024, dynamic: true, format: "png", ephemeral: true }))
        }
      }
      if(interaction.commandName === "randommention") {
        console.log(`Received interaction request for randommention by ${interaction.user.displayName}`);
        const limit = 1000; // Corrected limit for Discord API fetch
        console.time("FetchMembers");
        interaction.guild.members.list({ limit: limit })
        .then(members => {
          console.timeEnd("FetchMembers");
          console.log(`Fetched ${members.size} members.`);
          const membersArray = Array.from(members.values());

          if (membersArray.length > 0) {
            const randomIndex = Math.floor(Math.random() * membersArray.length);
            const randomMember = membersArray[randomIndex];
            console.log("Bot chose " + randomMember.user.displayName);
            const pokemonAhhMessage = [
              `<@${randomMember.user.id}>, I choose you!`,
              `*kisses* <@${randomMember.user.id}>`,
              `Woah woah <@${randomMember.user.id}> be lookin' sexy!`,
              `ooh, i love you, <@${randomMember.user.id}>!`
            ];
            const message = pokemonAhhMessage[Math.floor(Math.random() * pokemonAhhMessage.length)];
            interaction.reply(message);
          } else {
            console.log("No members available.");
            interaction.reply("Could not find any members to mention.");
          }
        })
        .catch(error => {
          console.error("Failed to fetch members:", error);
          interaction.reply("Failed to fetch members. Please try again later. (Maybe the bot can't search the guild?)");
        });
      }
      if (interaction.commandName === "join") {
        const channelId = interaction.options.getString("channelid");
        const channel = interaction.guild.channels.cache.get(channelId);

        if (channel && channel.isVoiceBased()) {
          console.log(`Joining ${channel.name}`);
          const connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: interaction.guild.id,
            adapterCreator: interaction.guild.voiceAdapterCreator,
          });
          connection.on(VoiceConnectionStatus.Disconnected, async () => {
            try {
              await Promise.race([
                entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
                entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
              ]);
            } catch (error) {
              console.log('Disconnected from the voice channel, destroying connection.');
              connection.destroy();
            }
          });
          interaction.reply({ content: `Joining ${channel.name}`, flags: ['Ephemeral'] });
        } else {
          interaction.reply({ content: "Invalid voice channel ID.", flags: ['Ephemeral'] });
        }
      }

if (interaction.commandName === "playfile") {
  try {
    const songUrl = interaction.options.getString("url");
    if (!songUrl) {
      return interaction.reply({ content: "Please provide an audio URL.", flags: ['Ephemeral'] });
    }

    const channel = interaction.member.voice.channel;
    if (!channel) {
      return interaction.reply({ content: "You must be in a voice channel!", flags: ['Ephemeral'] });
    }

    await interaction.deferReply({ ephemeral: true });

    // Create temp directory if it doesn't exist
    await fs.promises.mkdir('temp', { recursive: true });
    const tempFilePath = `temp/${Date.now()}-audio.mp3`;

    // Download file
    const response = await fetch(songUrl);
    if (!response.ok) {
      throw new Error(`Failed to download: ${response.status} ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log(`Downloaded file size: ${buffer.length} bytes`);
    
    await fs.promises.writeFile(tempFilePath, buffer);
    const stats = await fs.promises.stat(tempFilePath);
    console.log(`Written file size: ${stats.size} bytes`);

    // Create connection
    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator,
    });

    // Create player
    const player = createAudioPlayer({
      behaviors: {
        noSubscriber: "stop",
      },
    });

    // Create resource with proper stream type and volume
    const resource = createAudioResource(tempFilePath, {
      inputType: StreamType.Arbitrary,
      inlineVolume: true,
      silencePaddingFrames: 5
    });
    
    if (!resource) {
      throw new Error("Failed to create audio resource");
    }
    
    if (!resource.playStream) {
      throw new Error("Resource stream is invalid");
    }
    
    resource.volume?.setVolume(1);
    
    // Add stream error handling
    resource.playStream.on('error', error => {
      console.error('Stream error:', error);
    });

    // Setup connection handling
    connection.on('stateChange', (oldState, newState) => {
      console.log(`Connection transitioned from ${oldState.status} to ${newState.status}`);
      if (newState.status === VoiceConnectionStatus.Disconnected) {
        try {
          connection.rejoin();
        } catch (error) {
          cleanup();
        }
      }
    });

    // Setup player handling
    player.on('stateChange', (oldState, newState) => {
      console.log(`Player transitioned from ${oldState.status} to ${newState.status}`);
      if (newState.status === AudioPlayerStatus.Playing) {
        console.log('Started playing audio');
      }
    });

    player.on('error', error => {
      console.error('Error:', error);
      interaction.followUp({ content: "An error occurred while playing!", ephemeral: true });
      cleanup();
    });

    // Cleanup function
    const cleanup = async () => {
      try {
        connection.destroy();
        if (fs.existsSync(tempFilePath)) {
          await fs.promises.unlink(tempFilePath);
        }
      } catch (err) {
        console.error('Cleanup error:', err);
      }
    };

    // Subscribe connection to player
    connection.subscribe(player);

    // Play the resource
    console.log('Starting playback...');
    player.play(resource);

    // Handle completion
    player.on('stateChange', (oldState, newState) => {
      console.log(`Player state: ${oldState.status} -> ${newState.status}`);
      
      if (oldState.status === AudioPlayerStatus.Playing && 
          newState.status === AudioPlayerStatus.Idle) {
        console.log('Playback naturally completed');
        setTimeout(() => {
          if (connection.state.status !== VoiceConnectionStatus.Destroyed) {
            console.log('Cleaning up after playback');
            cleanup();
          }
        }, 5000);
      }
    });

    player.once('error', error => {
      console.error('Error:', error);
      if (connection.state.status !== VoiceConnectionStatus.Destroyed) {
        cleanup();
      }
    });

    await interaction.followUp({ content: "Now playing your audio file!", ephemeral: true });
  } catch (error) {
    console.error('Playfile error:', error);
    await interaction.followUp({ 
      content: "Failed to play audio. Error: " + error.message,
      ephemeral: true 
    });
  }
}

    }
  } catch (error) {
    console.error("I GOT AN ERROR WHILE USING THIS COMMAND WITH " + interaction.user.displayName + "!!!: " + error);
    interaction.reply("This command caught an error. Please try again later.");
  }
});

client.login(process.env.token)

process.on('exit', (code) => {
  console.log(`About to exit with code: ${code}`);
  client.guilds.cache.forEach(guild => {
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