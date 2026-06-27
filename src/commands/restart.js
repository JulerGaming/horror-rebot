module.exports = {
  name: 'restart',
  description: 'Restart the bot.',
  execute(message) {
    message.channel.send('Restarting...').then(() => {
      process.exit(0);  // Exit process to allow host to restart bot
    });
  },
};
