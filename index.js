const express = require("express");
const app = express();

app.listen(3000, () => {
  console.log("Project is running!");
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

const { Client, GatewayIntentBits, ActivityType } = require("discord.js");
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once("ready", () => {
  client.user.setActivity("your messages", { type: ActivityType.Listening });
  console.log("Bot is ready and status set!");
});

client.on("messageCreate", (message) => {
  if (message.content === ".ping") {
    message.channel.send("pong!");
  }
});

client.login(process.env.token);
