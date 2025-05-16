const { spawn } = require('child_process');

// Start your app with pm2 in watch mode
const pm2 = spawn('pm2', ['start', 'index.js', '--name', 'my-app', '--watch', '--restart-delay', '5000']);

pm2.stdout.on('data', (data) => {
  console.log(`stdout: ${data}`);
});

pm2.stderr.on('data', (data) => {
  console.error(`stderr: ${data}`);
});

pm2.on('close', (code) => {
  console.log(`pm2 process exited with code ${code}`);
});