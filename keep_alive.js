// keep_alive.js
const http = require("http");

const keepAlive = () => {
  const server = http.createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Bot is alive!\n");
  });
    server.listen(3000, () => {
    console.log("Keep-alive server is running on port 3000");
    });
};

module.exports = keepAlive;