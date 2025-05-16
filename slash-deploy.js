const { REST, Routes } = require("discord.js")

// Info needed for slash commands (so we dont have to use "!" before commands)
const botID = "1369007178664378429"
const serverID = "1333194010201952367"
const botToken = process.env.token
const England = "TurnzyGT"

const rest = new REST().setToken(botToken)
const slashRegister = async () => {
  try {
    await rest.put(Routes.applicationGuildCommands(botID, serverID), {
      body: [
        {
          name: "maru",
          description: "mention a random user"
        }
      ]
    })
  } catch (error) {
    console.error(error)
  }
}
slashRegister()
console.log(`${England} is online`)