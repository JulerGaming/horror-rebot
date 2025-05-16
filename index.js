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
  ActivityType,
  messageLink,
} = require("discord.js");
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
const badWords = fs.readFileSync("bad-words.txt", "utf-8").split("\n");

client.on("messageCreate", async (message) => {
  if (message.content === ".ping") {
    message.channel.send(`pong! ${client.ws.ping}ms`);
  }
  const words = message.content.split(" ");
  for (const word of words) {
    if (badWords.includes(word.toLowerCase())) {
      message.delete();
      try {
        await message.member.timeout(600000, "Using inappropriate language.");
      } catch (error) {
        if (error.code === 50013) {
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

client.on("messageCreate", (message) => {
  if (message.content === ".balls") {
    message.channel.send(":skull:");
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

client.login(process.env.token); // we use process.env.token to keep the token hidden (because this repl is public)
