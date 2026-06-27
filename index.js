const express = require("express");
const app = express();
const OpenAI = require("openai");
const path = require("path");
const { writeFile } = require("fs/promises");
const puppeteer = require('puppeteer');
// Simple in-memory chat history
const chatMemory = new Map();
// key = channelId OR userId (for DMs)

// The bot owner — the only user who can approve AI-proposed code edits (and trigger a
// manual git sync). Edits are never written to disk until they click "Yes" on the DM.
const CODE_EDIT_OWNER_ID = "804839205309382676";

// Secret env files the AI must NEVER read, edit, or even list — anywhere in the tree.
// Matches ".env" and every variant (".env.local", ".env.production", etc.) by basename.
// `relPathLower` is a lowercased, forward-slash project-relative path.
function isProtectedSecretFile(relPathLower) {
    const base = (relPathLower || "").split("/").pop() || "";
    return base === ".env" || base.startsWith(".env.");
}

// Build a readable diff-style preview of a proposed edit for the approval DM. Rendered
// inside a ```diff code block, so removed lines show red and added lines show green.
function buildEditPreview(filePath, oldString, newString) {
    const sanitize = (s) => String(s).replace(/```/g, "ʼʼʼ"); // don't let content break out of the code block
    const minus = oldString === "" ? "(new file / appended content)" : sanitize(oldString);
    const plus = newString === "" ? "(content removed)" : sanitize(newString);
    const body =
        `# ${filePath}\n` +
        minus.split("\n").map((l) => `- ${l}`).join("\n") + "\n" +
        plus.split("\n").map((l) => `+ ${l}`).join("\n");
    const MAX = 1800; // leave room for the surrounding ```diff fences inside the 2000-char limit
    return body.length > MAX ? body.slice(0, MAX) + "\n... (truncated)" : body;
}
/*Function to execute functions executed on the website (accessible by this pc's ip followed with :3000)*/

// Import environment variables
require("dotenv").config();

// err.code is retrieving the error code, basically

process.on("warning", (warning) => {
    // Yellow color
    console.warn("\x1b[33m%s\x1b[0m", "Warning:", warning.message);
    newIssue(`Warning: ${warning.message}`);
});

const fs = require("fs");

const USER = process.env.USER;
const PASS = process.env.PASS;

app.use((req, res, next) => {
    const auth = req.headers.authorization;

    if (!auth) {
        res.setHeader("WWW-Authenticate", 'Basic realm="Protected"');
        return res.status(401).sendFile(path.join(__dirname, "public", "unauthorized.html"));
    }

    const base64 = auth.split(" ")[1];
    const [user, pass] = Buffer.from(base64, "base64").toString().split(":");

    if (user === USER && pass === PASS) {
        return next();
    } else {
        res.sendFile(path.join(__dirname, "public", "incorrect-password.html"));
    }

    res.setHeader("WWW-Authenticate", 'Basic realm="Protected"');
    res.status(401).sendFile(path.join(__dirname, "public", "unauthorized.html"));
});

app.listen(3000, () => {
    console.log("Web interface running on port 3000");
});

const pm2_logs_dir = "C:\\Users\\Juler\\.pm2\\logs";
fs.writeFileSync(path.join(pm2_logs_dir, "horror-rebot-out.log"), "", "utf-8");
fs.writeFileSync(path.join(pm2_logs_dir, "horror-rebot-error.log"), "", "utf-8");

// Serve all files in "public" (including log.txt, images, CSS, etc.)
app.use(express.static(path.join(__dirname, 'public')));

function streamFile(filePath, type, send) {
    let lastSize = 0;

    try {
        lastSize = require("fs").statSync(filePath).size;
    } catch {
        lastSize = 0;
    }

    const interval = setInterval(() => {
        require("fs").stat(filePath, (err, stats) => {
            if (err) return;

            if (stats.size < lastSize) lastSize = 0;

            if (stats.size > lastSize) {
                const stream = require("fs").createReadStream(filePath, {
                    start: lastSize,
                    end: stats.size
                });

                let buffer = "";

                stream.on("data", chunk => buffer += chunk.toString());

                stream.on("end", () => {
                    buffer.split("\n").forEach(line => {
                        if (line.trim()) {
                            send({ type, message: line });
                        }
                    });

                    lastSize = stats.size;
                });
            }
        });
    }, 200);

    return () => clearInterval(interval);
}

app.get("/logs", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const send = (data) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    const watchers = [
        streamFile(path.join(pm2_logs_dir, "horror-rebot-out.log"), "out", send),
        streamFile(path.join(pm2_logs_dir, "horror-rebot-error.log"), "error", send)
    ];

    req.on("close", () => {
        watchers.forEach(w => w());
    });
});

app.get("/presence", (req, res) => {
    const presence = client.user.presence;
    res.json({
        status: presence.status,
        activities: presence.activities.map(a => ({
            name: a.name,
            type: a.type,
            details: a.details,
            state: a.state
        }))
    });
});

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/tools/restart', (req, res) => {
    console.log("Restart requested via web interface.");
    res.send("Restarting...");
    restart(0);
});

app.post('/tools/chatgpt', (req, res) => {
    const configPath = path.join(__dirname, 'config.json');
    try {
        const configData = fs.readFileSync(configPath, 'utf-8');
        const config = JSON.parse(configData);
        config.chatgptintegration.enabled = !config.chatgptintegration.enabled;
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
        console.log(`ChatGPT integration toggled to ${config.chatgptintegration.enabled}`);
        res.send(`ChatGPT integration is now ${config.chatgptintegration.enabled ? "enabled" : "disabled"}.`);
        configl.chatgptintegration.enabled = config.chatgptintegration.enabled; // update the in-memory config as well
    } catch (err) {
        console.error("Error toggling ChatGPT integration:", err);
        res.status(500).send("Error toggling ChatGPT integration.");
    }
});

app.post('/tools/vc', (req, res) => {
    const configPath = path.join(__dirname, 'config.json');
    try {
        const configData = fs.readFileSync(configPath, 'utf-8');
        const config = JSON.parse(configData);
        config.basics.vc.enabled = !config.basics.vc.enabled;
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
        console.log(`VC toggled to ${config.basics.vc.enabled}`);
        res.send(`VC is now ${config.basics.vc.enabled ? "enabled" : "disabled"}.`);
        configl.basics.vc.enabled = config.basics.vc.enabled; // update the in-memory config as well
    } catch (err) {
        console.error("Error toggling VC:", err);
        res.status(500).send("Error toggling VC.");
    }
});

app.post('/tools/aimoderation', (req, res) => {
    const configPath = path.join(__dirname, 'config.json');
    try {
        const configData = fs.readFileSync(configPath, 'utf-8');
        const config = JSON.parse(configData);
        config.chatgptintegration.aimoderation.enabled = !config.chatgptintegration.aimoderation.enabled;
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
        console.log(`AI Moderation toggled to ${config.chatgptintegration.aimoderation.enabled}`);
        res.send(`AI Moderation is now ${config.chatgptintegration.aimoderation.enabled ? "enabled" : "disabled"}.`);
        configl.chatgptintegration.aimoderation.enabled = config.chatgptintegration.aimoderation.enabled; // update the in-memory config as well
    } catch (err) {
        console.error("Error toggling AI Moderation:", err);
        res.status(500).send("Error toggling AI Moderation.");
    }
});

app.post("/tools/restart-server", (req, res) => {
    console.log("Restart requested via web interface.");
    res.status(200).send("Restarting server...");

    run("shutdown /r /f /t 0").catch(err => {
        console.error("Error occurred while trying to restart the server:", err);
    });
});

app.get('/birthdays', async (req, res) => {
    try {
        const birthdaysFile = "birthdays.json";
        if (!fs.existsSync(birthdaysFile)) { return; }

        const data = require("./birthdays.json");
        const birthdays = data.birthdays || {};
        const today = new Date();
        const todayMMDD = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        let birthdayBois = [];
        let parsedBirthdays = {};

        for (const [userId, birthdayData] of Object.entries(birthdays)) {
            if (getBirthdayMMDD(birthdayData) === todayMMDD) {
                const user = client.users.cache.get(userId);
                if (user) { birthdayBois.push(user.displayName); }
            }
        }

        for (const [userId, birthdayData] of Object.entries(birthdays)) {
            const user = client.users.cache.get(userId);
            if (user) { parsedBirthdays[user.displayName] = getBirthdayMMDD(birthdayData); }
        }

        res.status(200).json({ status: 200, today: birthdayBois, birthdays: parsedBirthdays });
    } catch (err) {
        console.error("Error checking birthdays:", err);
        res.status(500).json({ status: 500, message: err.message });
    }
});

app.get("/chatgpt-status", (req, res) => {
    res.json({ enabled: configl.chatgptintegration.enabled });
});

app.get("/vc-status", (req, res) => {
    res.json({ enabled: configl.basics.vc.enabled });
});

app.get("/aimoderation-status", (req, res) => {
    res.json({ enabled: configl.chatgptintegration.aimoderation.enabled });
});

const package = require('./package.json');

// increase version number when making changes

let version = package.version || "NIL";

// update "updated-at" field in package.json
const now = new Date();
// date format: January 1, 1970 at 12:00 AM UTC
const updatedAt = `${now.toLocaleString('en-US', { month: 'long' })} ${now.getDate()}, ${now.getFullYear()} at ${now.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })} AST`;
package["updated-at"] = updatedAt;
fs.writeFileSync("./package.json", JSON.stringify(package, null, 2));;

const { Client, GatewayIntentBits, ActivityType, ChannelType, Partials, Events, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require("discord.js");

const upDate = package["updated-at"] || "January 1, 1970 at 12:00 AM UTC";

const {
    joinVoiceChannel,
    createAudioPlayer,
    createAudioResource,
    AudioPlayerStatus,
    VoiceConnectionStatus,
    getVoiceConnection,
    entersState,
    StreamType,
    EndBehaviorType,
} = require("@discordjs/voice");

function destroyVoiceConnectionIfNotSpeaking(guildId, expectedPlayer = null) {
    const connection = getVoiceConnection(guildId);
    if (!connection) { return; }

    // Keep the connection alive while we're actively listening (voice moderation or the
    // wake-word assistant). The assistant has its own inactivity timer for leaving.
    if (activeVoiceModeration.has(guildId) || voiceAssistants.has(guildId)) { return; }

    const currentPlayer = connection.state.subscription?.player;
    if (currentPlayer && expectedPlayer && currentPlayer !== expectedPlayer) { return; }
    if (currentPlayer && currentPlayer.state.status !== AudioPlayerStatus.Idle) { return; }

    try {
        connection.destroy();
    } catch {
        // ignore, cause its annoying to crash
    }
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences
    ],
    partials: [
        Partials.Message,
        Partials.Channel
    ]
});

// DO NOT DELETE

const cff = require("./config.json");
const { exec, execSync } = require("child_process");

if (!process.env.OPENAI_API_KEY && cff.chatgptintegration.enabled) {
    throw new Error("OPENAI_API_KEY was not set in .env file but ChatGPT Integration is enabled.");
} else if (!process.env.OPENAI_API_KEY && cff.chatgptintegration.aimoderation.enabled) {
    throw new Error("OPENAI_API_KEY was not set in .env file but AI Moderation is enabled.");
}

function run(cmd) {
    return new Promise((resolve, reject) => {
        exec(cmd, (err, stdout, stderr) => {
            if (err) { return reject(stderr); }
            resolve(stdout.trim());
        });
    });
}

app.post("/send-announcement", express.json(), async (req, res) => {
    const { title, content, pingEveryone } = req.body;

    if (!title || !content) {
        return res.status(400).json({ success: false, error: "Title and content are required." });
    }

    const channelID = configl.basics.announcementChannelID;
    const channel = client.channels.cache.get(channelID);

    if (pingEveryone) {
        await channel.send(`@everyone\n# ${title}\n### ${content}`);
    } else {
        await channel.send(`# ${title}\n### ${content}`);
    }

    res.json({ success: true });
});

app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

let hasSyncRepo = false;
// Guard so a manually-triggered sync can't overlap the 1-minute interval run (concurrent
// git operations on the same repo can fail or leave a half-finished state).
let syncInProgress = false;

async function syncRepo() {
    if (!cff.GitHub) { return { ok: false, reason: "GitHub sync is disabled in config (cff.GitHub is falsy)." }; }
    if (syncInProgress) { return { ok: false, reason: "A git sync is already in progress." }; }
    syncInProgress = true;
    try {
        console.log("Syncing repo with GitHub...");

        await run("git fetch");

        // 1) Commit any local changes FIRST so the working tree is clean before merging.
        const status = await run("git status --porcelain");
        let committed = false;
        if (status) {
            console.log("Local changes detected. Committing...");
            await run("git add .");
            await run(`git commit -m "Auto commit from bot"`);
            committed = true;
        }

        // 2) Merge in remote changes if the remote is actually ahead of us.
        const head = await run("git rev-parse HEAD");
        const upstream = await run("git rev-parse @{u}");
        let mergedRemote = false;
        if (head !== upstream) {
            const base = await run("git merge-base HEAD @{u}");
            if (base !== upstream) { // remote has commits we don't have -> merge them
                console.log("Remote updates found. Merging...");
                try {
                    await run("git merge --no-edit @{u}");
                    mergedRemote = true;
                } catch (mergeErr) {
                    // Conflict (or other merge failure): abort so we stay on a clean tree
                    // and try again next cycle instead of getting stuck mid-merge.
                    console.error("Merge failed (likely a conflict). Aborting:", mergeErr);
                    try { await run("git merge --abort"); } catch { /* ignore */ }
                    return { ok: false, committed, reason: "Merge failed (likely a conflict); aborted to keep a clean tree." };
                }
            }
        }

        // 3) Push if we have commits the remote doesn't (local work and/or the merge commit).
        const ahead = parseInt(await run("git rev-list --count @{u}..HEAD"), 10) || 0;
        let pushed = 0;
        if (ahead > 0) {
            console.log(`Pushing ${ahead} commit(s) to GitHub...`);
            await run("git push");
            pushed = ahead;
            console.log("Changes pushed to GitHub.");
        } else {
            console.log("Nothing to push.");
        }

        hasSyncRepo = true;

        // 4) If new remote code was merged in, restart so the bot runs the latest code.
        if (mergedRemote) {
            console.log("Remote code merged. Restarting...");
            restart(0);
        }

        return { ok: true, committed, mergedRemote, pushed, willRestart: mergedRemote };

    } catch (err) {
        console.error("Git sync error:", err);
        return { ok: false, reason: `Git sync error: ${err?.message || String(err)}` };
    } finally {
        syncInProgress = false;
    }
}

syncRepo();

setInterval(syncRepo, 1 * 60 * 1000); // every 1 minute

(function checkPackages() {
    if (!hasSyncRepo) { return; }
    const pkg = JSON.parse(require('fs').readFileSync('./package.json', 'utf8'));
    const allDeps = Object.assign({}, pkg.dependencies);
    const missing = [];
    for (const [name, version] of Object.entries(allDeps)) {
        try {
            require.resolve(name);
        } catch {
            missing.push(name);
        }
    }
    const filtered = missing.filter(name => name !== 'save-dev');
    if (filtered.length > 0) {
        console.log(`Missing packages: ${filtered.join(', ')}. Running npm install...`);
        execSync('npm install', { stdio: 'inherit' });
        console.log('Packages installed. Restarting...');
        process.exit(0);
    }
})();

// </> DO NOT DELETE

const shutdown = async (signal) => {
    console.log(`Received ${signal}, shutting down...`);
    await CleanUp();
    process.exit(0);
};

async function CleanUp() {
    try {
        client.guilds.cache.forEach((guild) => {
            if (guild.voiceAdapterCreator) {
                const voiceConnection = getVoiceConnection(guild.id);
                if (voiceConnection) {
                    console.log(`Disconnecting from voice channel in guild: ${guild.name}`);
                    voiceConnection.destroy();
                }
            }
        });
        fs.writeFileSync("./public/main.log", ""); // Clear log file on exit
        try {
            // for each file in the temp folder, delete it (except if it ends in .keep)
            const tempDir = path.join(__dirname, "temp");
            fs.readdirSync(tempDir).forEach(file => {
                if (file !== ".keep") {
                    fs.unlinkSync(path.join(tempDir, file));
                }
            });
        } catch (err) {
            console.warn("Failed to clear temp directory!");
        }
        await client.destroy();
    } catch (err) { }
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// Error handling
process.on("uncaughtException", async (err) => {
    try {
        if (client?.isReady?.() && process.env.BOT_TOKEN) {
            const guild = client.guilds.cache.get("1333194010201952367");
            const julergt = await guild?.members?.fetch?.("804839205309382676").catch(() => null);
            await julergt?.send?.(
                `<@804839205309382676>\n# Bot Crashed!\n### The bot crashed due to an unhandled exception.\nHere is the error report:\n\`\`\`\n${err.stack || err}\n\`\`\``,
            );
        }
    } catch (dmErr) {
        console.error("Failed to DM crash report (uncaughtException):", dmErr);
    }
    console.error("==============================");
    console.error("Bot Crashed!", err);
    console.error("");
    console.error("Horror Rebot, " + version);
    console.error("Node.js, " + process.version);
    console.error("");
    console.error("==============================");
    restart(err.code); // exit the process to avoid undefined states
});

process.on("unhandledRejection", async (err) => {
    try {
        if (client?.isReady?.() && process.env.BOT_TOKEN) {
            const guild = client.guilds.cache.get("1333194010201952367");
            const julergt = await guild?.members?.fetch?.("804839205309382676").catch(() => null);
            await julergt?.send?.(
                `<@804839205309382676>\n# Warning!\n### The bot encountered an unhandled rejection.\nHere is the error report:\n\`\`\`\n${err?.stack || err}\n\`\`\``,
            );
        }
    } catch (dmErr) {
        console.error("Failed to DM crash report (unhandledRejection):", dmErr);
    }
    console.error("==============================");
    console.error("Unhandled Rejection:", err);
    console.error("");
    console.error("Horror Rebot, " + version);
    console.error("Node.js, " + process.version);
    console.error("");
    console.error("==============================");
    // make this console line red
});

const blacklistedTags = {
    '1237045622234943498': 'Gorilla Tag Copy',
    // Add more if needed
};

const warnedUsers = new Set();

client.once(Events.ClientReady, async () => {
    console.log(`Logged in as ${client.user.username}`);
    const { slashRegister } = require('./slash-deploy.js');
    slashRegister();
    if (client.user.setAFK) { client.user.setAFK(false); }
    const guild = client.guilds.cache.get("1333194010201952367");
    client.user.setPresence({ status: 'online', activities: [{ name: `${guild.memberCount} monkeys | v${version}`, type: ActivityType.Watching }] });
    console.log("Update status!");
});

client.on(Events.ClientReady, async () => {
    console.log("Birthday check system initialized");

    // Check birthdays immediately on startup
    checkBirthdays();

    // Schedule check at every midnight
    function scheduleMidnightCheck() {
        const now = new Date();
        const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
        const msUntilMidnight = nextMidnight - now;
        setTimeout(() => {
            checkBirthdays();
            scheduleMidnightCheck();
        }, msUntilMidnight);
    }
    scheduleMidnightCheck();
});

function getOrdinalSuffix(n) {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function getBirthdayMMDD(entry) {
    return typeof entry === "string" ? entry : entry.date;
}

function getBirthYear(entry) {
    return typeof entry === "object" && entry.year ? entry.year : null;
}

async function checkBirthdays() {
    try {
        const birthdaysFile = "birthdays.json";
        if (!fs.existsSync(birthdaysFile)) { return; }

        delete require.cache[require.resolve("./birthdays.json")];
        const data = require("./birthdays.json");
        const birthdays = data.birthdays || {};
        const today = new Date();
        const todayMMDD = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        console.log(`Today is ${todayMMDD}`);

        for (const [userId, birthdayData] of Object.entries(birthdays)) {
            const birthdayMMDD = getBirthdayMMDD(birthdayData);
            const birthYear = getBirthYear(birthdayData);

            if (birthdayMMDD === todayMMDD) {
                try {
                    const user = await client.users.fetch(userId);
                    if (user === client.user) {
                        return console.log("happy birthday to me yay");
                    }
                    let ageText = "";
                    if (birthYear) {
                        const age = today.getFullYear() - birthYear;
                        ageText = ` ${getOrdinalSuffix(age)}`;
                    }
                    await user.send(`<@${userId}>\n# 🎉 Happy${ageText} Birthday! 🎉\n\n### Wishing you an amazing day filled with joy and celebration!`);
                    console.log(`Birthday message sent to ${user.username}`);
                } catch (err) {
                    console.error(`Failed to send birthday message to user ${userId}:`, err);
                }
            }
        }
    } catch (err) {
        console.error("Error checking birthdays:", err);
    }
}

function loadWordList(file) {
    return fs.readFileSync(file, "utf-8")
        .split(/\r?\n/)
        .map(w => w.trim().toLowerCase())
        .filter(Boolean);
}

const badWords = loadWordList("bad-words.txt");

const cheatsWords = loadWordList("cheat-words.txt");

// Merged-word detection (e.g. "fuckyou"). Only "distinctive" words are matched as a
// substring inside another word. Short/ambiguous words (ass, sex, hell, cock, cum...) are
// left as whole-word-only so we don't flag innocent words like "class" or "Uranus".
const SEVERE_SHORT = new Set(["fuck", "shit", "cunt", "slut", "wank"]); // short but safe to substring-match
const EXCLUDE_FROM_MERGED = new Set(["screw", "hells", "kraut"]);       // 5+ letters but hide in innocent words (screwdriver, shells, sauerkraut)
const mergedWords = badWords.filter(w =>
    /^[a-z0-9]+$/.test(w) &&
    !EXCLUDE_FROM_MERGED.has(w) &&
    (w.length >= 5 || SEVERE_SHORT.has(w)),
);
const mergedRegex = mergedWords.length ? new RegExp(mergedWords.join("|")) : null;

// Returns true if a single token is a bad word (raw, punctuation-wrapped, or merged).
function isBadWord(token) {
    const lower = token.toLowerCase();
    if (badWords.includes(lower)) { return true; } // raw token, covers special chars like "@$$"
    const clean = lower.replace(/[^a-z0-9]/g, "");
    if (!clean) { return false; }
    if (badWords.includes(clean)) { return true; } // punctuation-wrapped, e.g. "fuck!" -> "fuck"
    if (mergedRegex && mergedRegex.test(clean)) { return true; } // merged, e.g. "fuckyou" contains "fuck"
    return false;
}

// Returns the first offending word found in a block of text, or null. Used by both the
// text message filter and the voice (transcription) filter.
function containsBadWord(text) {
    if (!text) { return null; }
    for (const word of text.split(/\s+/).filter(Boolean)) {
        if (isBadWord(word)) { return word; }
    }
    return null;
}

// ====== VOICE CAPTURE / TRANSCRIPTION ======
// Shared listener hub. One capture per guild subscribes to each speaker once, decodes
// Opus->PCM, and dispatches each finished utterance to every registered consumer. This
// lets voice moderation and the voice assistant share one connection (no double
// subscriptions) and transcribe each utterance at most once.
// NOTE: this records and transcribes members' voice audio and costs money per minute of
// speech (Whisper). It only runs after a moderator/user opts in, and announces itself.
const prism = require("prism-media");

// 48kHz, 16-bit, stereo PCM. Skip utterances shorter than ~0.4s to avoid wasting Whisper
// calls on coughs/clicks, and cap very long ones so a hot mic can't run up huge bills.
// (0.4s, not 0.8s, so quiet/short/noise-gated speakers aren't dropped before transcription.)
const VOICE_PCM_SAMPLE_RATE = 48000;
const VOICE_PCM_CHANNELS = 2;
const VOICE_PCM_BYTES_PER_SEC = VOICE_PCM_SAMPLE_RATE * VOICE_PCM_CHANNELS * 2;
const VOICE_MIN_BYTES = Math.floor(VOICE_PCM_BYTES_PER_SEC * 0.4);
const VOICE_MAX_BYTES = VOICE_PCM_BYTES_PER_SEC * 30; // hard cap ~30s per utterance
const VOICE_SILENCE_MS = 1000; // end an utterance after 1s of silence

const voiceCaptures = new Map(); // guildId -> { connection, voiceChannel, consumers:Set, recording:Set, onSpeakingStart, receiver }

// Wraps raw PCM (s16le) in a minimal WAV container so Whisper can read it.
function pcmToWav(pcm, sampleRate = VOICE_PCM_SAMPLE_RATE, channels = VOICE_PCM_CHANNELS, bitDepth = 16) {
    const blockAlign = channels * bitDepth / 8;
    const byteRate = sampleRate * blockAlign;
    const header = Buffer.alloc(44);
    header.write("RIFF", 0);
    header.writeUInt32LE(36 + pcm.length, 4);
    header.write("WAVE", 8);
    header.write("fmt ", 12);
    header.writeUInt32LE(16, 16);
    header.writeUInt16LE(1, 20); // PCM
    header.writeUInt16LE(channels, 22);
    header.writeUInt32LE(sampleRate, 24);
    header.writeUInt32LE(byteRate, 28);
    header.writeUInt16LE(blockAlign, 32);
    header.writeUInt16LE(bitDepth, 34);
    header.write("data", 36);
    header.writeUInt32LE(pcm.length, 40);
    return Buffer.concat([header, pcm]);
}

async function transcribePcm(pcm) {
    const wav = pcmToWav(pcm);
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const file = await OpenAI.toFile(wav, "speech.wav", { type: "audio/wav" });
    const result = await openai.audio.transcriptions.create({
        file,
        model: "whisper-1",
    });
    return (result.text || "").trim();
}

// Ensure a single capture pipeline exists for this guild's connection. Each finished
// utterance is dispatched to every consumer as { member, voiceChannel, pcm, getTranscript }.
// getTranscript() transcribes lazily and caches, so N consumers => at most one Whisper call.
function ensureVoiceCapture(connection, voiceChannel) {
    const guildId = voiceChannel.guild.id;
    let cap = voiceCaptures.get(guildId);
    if (cap) {
        cap.connection = connection;
        cap.voiceChannel = voiceChannel;
        return cap;
    }

    const receiver = connection.receiver;
    const recording = new Set(); // userIds currently being captured (avoid double subscriptions)
    const consumers = new Set();

    const startCapture = async (userId) => {
        if (recording.has(userId)) { return; }       // already capturing this user
        if (consumers.size === 0) { return; }
        recording.add(userId); // claim the slot BEFORE any await so we can't double-subscribe

        // Resolve the speaking member. The cache can be missing a user (e.g. they were
        // already in the channel at connect, or joined without a caching event), which used
        // to silently drop ALL of their audio — so fall back to fetching them.
        let member = voiceChannel.guild.members.cache.get(userId);
        if (!member) {
            try {
                member = await voiceChannel.guild.members.fetch(userId);
            } catch (e) {
                console.warn(`[Voice] could not resolve member ${userId}:`, e?.message || e);
                recording.delete(userId);
                return;
            }
        }
        if (!member || member.user.bot) { recording.delete(userId); return; } // never capture the bot
        if (consumers.size === 0) { recording.delete(userId); return; } // consumer left during await

        console.log(`[Voice] capturing ${member.user.tag}`);

        const opusStream = receiver.subscribe(userId, {
            end: { behavior: EndBehaviorType.AfterSilence, duration: VOICE_SILENCE_MS },
        });
        const decoder = new prism.opus.Decoder({
            rate: VOICE_PCM_SAMPLE_RATE,
            channels: VOICE_PCM_CHANNELS,
            frameSize: 960,
        });

        const chunks = [];
        let total = 0;
        const pcmStream = opusStream.pipe(decoder);

        pcmStream.on("data", (chunk) => {
            if (total < VOICE_MAX_BYTES) {
                chunks.push(chunk);
                total += chunk.length;
            }
        });

        // Finalize EXACTLY once, whether the stream ends cleanly, errors, or stalls. On
        // error we still flush whatever decoded so one bad Opus packet doesn't drop the whole
        // utterance, and we always release the `recording` slot so a user can't get stuck.
        let guard;
        let finalized = false;
        const finalize = (err) => {
            if (finalized) { return; }
            finalized = true;
            clearTimeout(guard);
            recording.delete(userId);
            if (err) { console.error("[Voice] stream error:", err?.message || err); }
            try { opusStream.destroy(); } catch { /* ignore */ }
            try { decoder.destroy(); } catch { /* ignore */ }

            const pcm = Buffer.concat(chunks);
            if (pcm.length < VOICE_MIN_BYTES) {
                console.log(`[Voice] dropped short utterance from ${member.user.tag} (${pcm.length} bytes, need ${VOICE_MIN_BYTES})`);
                return;
            }

            // Transcribe at most once per utterance, shared across all consumers.
            let transcriptPromise = null;
            const getTranscript = () => {
                if (!transcriptPromise) {
                    const clipped = pcm.length > VOICE_MAX_BYTES ? pcm.subarray(0, VOICE_MAX_BYTES) : pcm;
                    transcriptPromise = transcribePcm(clipped).catch((e) => {
                        console.error("[Voice] Transcription failed:", e?.message || e);
                        return "";
                    });
                }
                return transcriptPromise;
            };

            for (const consumer of consumers) {
                Promise.resolve()
                    .then(() => consumer({ member, voiceChannel: cap.voiceChannel, pcm, getTranscript }))
                    .catch((e) => console.error("[Voice] consumer error:", e?.message || e));
            }
        };

        // Safety net: if the stream never emits end/close/error, force-release so the user
        // isn't permanently stuck in `recording` (which would silence them forever).
        const guardMs = Math.ceil((VOICE_MAX_BYTES / VOICE_PCM_BYTES_PER_SEC) * 1000) + 5000;
        guard = setTimeout(() => {
            console.error(`[Voice] capture stall for ${member.user.tag}, force-releasing`);
            finalize();
        }, guardMs);
        if (guard.unref) { guard.unref(); }

        pcmStream.on("end", () => finalize());
        pcmStream.on("error", (e) => finalize(e));
        opusStream.on("end", () => finalize());
        opusStream.on("close", () => finalize());
        opusStream.on("error", (e) => finalize(e));
    };

    // Event listeners can't be awaited, so wrap the async capture and swallow rejections
    // (a failed capture must never crash the speaking handler).
    const onSpeakingStart = (userId) => {
        startCapture(userId).catch((e) => console.error("[Voice] capture error:", e?.message || e));
    };

    receiver.speaking.on("start", onSpeakingStart);

    // Some users may already be transmitting when we start listening, so no fresh "start"
    // event ever fires for them. Seed capture from the receiver's SSRC map (the authoritative
    // list of known speakers) and whenever a new SSRC appears. Guarded because ssrcMap is a
    // semi-internal API; capture is idempotent (recording-set guard) so re-seeding is safe.
    const seedExistingSpeakers = () => {
        try {
            const map = receiver.ssrcMap?.map;
            if (map?.values) {
                for (const data of map.values()) {
                    if (data?.userId) { onSpeakingStart(data.userId); }
                }
            }
        } catch (e) { console.error("[Voice] seed failed:", e?.message || e); }
    };
    try {
        receiver.ssrcMap?.on?.("create", (d) => { if (d?.userId) { onSpeakingStart(d.userId); } });
    } catch { /* ignore */ }

    // Tear everything down if the connection goes away (e.g. /leavevoice or a disconnect).
    connection.once(VoiceConnectionStatus.Destroyed, () => {
        try { receiver?.speaking?.off?.("start", onSpeakingStart); } catch { /* ignore */ }
        voiceCaptures.delete(guildId);
        activeVoiceModeration.delete(guildId);
        stopVoiceAssistant(guildId, true);
    });

    cap = { connection, voiceChannel, consumers, recording, onSpeakingStart, receiver, seedExistingSpeakers };
    voiceCaptures.set(guildId, cap);
    return cap;
}

// Register a consumer; returns an unsubscribe fn that also tears the hub down if it was last.
function addVoiceConsumer(connection, voiceChannel, consumer) {
    const cap = ensureVoiceCapture(connection, voiceChannel);
    cap.consumers.add(consumer);
    // Pick up anyone already talking now that there's a consumer to receive their audio.
    try { cap.seedExistingSpeakers?.(); } catch { /* ignore */ }
    return () => {
        cap.consumers.delete(consumer);
        if (cap.consumers.size === 0) {
            try { cap.receiver?.speaking?.off?.("start", cap.onSpeakingStart); } catch { /* ignore */ }
            voiceCaptures.delete(voiceChannel.guild.id);
        }
    };
}

// ====== VOICE MODERATION ======
// Transcribes speech and runs it through the same bad-words filter used for text messages.
const activeVoiceModeration = new Map(); // guildId -> removeConsumer fn

function startVoiceModeration(connection, voiceChannel, textChannel) {
    const guildId = voiceChannel.guild.id;
    if (activeVoiceModeration.has(guildId)) { return false; }

    const consumer = async ({ member, getTranscript }) => {
        const text = await getTranscript();
        if (!text) { return; }
        console.log(`[VoiceMod] ${member.user.tag}: ${text}`);

        const hit = containsBadWord(text);
        if (!hit) { return; }
        console.log(`[VoiceMod] Bad word "${hit}" detected in voice from ${member.user.tag}`);

        try {
            await member.timeout(600000, "Inappropriate language in voice chat.");
        } catch (err) {
            console.error("[VoiceMod] Failed to timeout member:", err?.message || err);
        }
        try {
            if (textChannel?.send) {
                await textChannel.send(`${member}, please watch your language in voice chat. You said: \`${text}\`, and you also said: \`${hit}\`. Was that correct? Report this to Juler if wrong.`);
            }
        } catch (err) {
            console.error("[VoiceMod] Failed to send warning:", err?.message || err);
        }
    };

    const remove = addVoiceConsumer(connection, voiceChannel, consumer);
    activeVoiceModeration.set(guildId, remove);
    return true;
}

function stopVoiceModeration(guildId) {
    const remove = activeVoiceModeration.get(guildId);
    if (!remove) { return false; }
    try { remove(); } catch { /* ignore */ }
    activeVoiceModeration.delete(guildId);
    return true;
}

// ====== VOICE ASSISTANT (wake word -> ChatGPT reply) ======
// While the bot is in a voice channel, listen for a wake word; if heard, send the rest of
// the utterance to the same ChatGPT pipeline used for @mentions and reply via TTS.
const voiceAssistants = new Map(); // guildId -> { remove, idleTimer, textChannel }
const VOICE_ASSISTANT_IDLE_MS = 5 * 60 * 1000; // auto-leave after 5 min with no wake-word activity

// Tolerant of Whisper mis-hearing the name ("rebot"/"reboot"/"robot"/"horror bot").
const WAKE_WORDS = ["horror rebot", "hey rebot", "ok rebot", "rebot", "reboot", "robot", "ribot", "rebought", "horribot", "horror robot", "horror bot", "poor robot", "horarybot", "horribot", "oriba", "horror-e-bot", "horror re-bot", "horror-y bot"];

// Returns the query with the wake word stripped, or null if no wake word was present.
function extractWakeQuery(text) {
    const lower = text.toLowerCase();
    for (const w of WAKE_WORDS) {
        const idx = lower.indexOf(w);
        if (idx !== -1) {
            return text.slice(idx + w.length).replace(/^[\s,.:;!?'"-]+/, "").trim();
        }
    }
    return null;
}

// Minimal message-like object so runChatGptReply works for voice the same as for text.
function makeSyntheticMessage(member, voiceChannel, textChannel, content) {
    return {
        author: member.user,
        member,
        content,
        guild: member.guild,
        channel: textChannel,
        channelId: textChannel?.id,
        reference: null,
        mentions: { has: () => false },
        reply: async (payload) => {
            try { return await textChannel.send(payload); }
            catch (e) { console.error("[VoiceChat] reply failed:", e?.message || e); return null; }
        },
        _fromVoice: true,
    };
}

function bumpAssistantIdle(guildId) {
    const a = voiceAssistants.get(guildId);
    if (!a) { return; }
    if (a.idleTimer) { clearTimeout(a.idleTimer); }
    a.idleTimer = setTimeout(() => {
        console.log(`[VoiceChat] Leaving guild ${guildId} after inactivity.`);
        const conn = getVoiceConnection(guildId);
        if (conn) { try { conn.destroy(); } catch { /* ignore */ } }
        stopVoiceAssistant(guildId, true);
    }, VOICE_ASSISTANT_IDLE_MS);
    if (a.idleTimer.unref) { a.idleTimer.unref(); }
}

function startVoiceAssistant(connection, voiceChannel, textChannel) {
    const guildId = voiceChannel.guild.id;
    if (voiceAssistants.has(guildId)) {
        bumpAssistantIdle(guildId);
        return false;
    }

    const consumer = async ({ member, getTranscript }) => {
        const text = await getTranscript();
        if (!text) { return; }
        const query = extractWakeQuery(text);
        if (query === null) {
            // Heard and transcribed, but no wake word — log it so "the bot ignored me" is
            // distinguishable from "the bot never heard me" (no [Voice] capturing line).
            console.log(`[VoiceChat] heard (no wake word) from ${member.user.tag}: ${text}`);
            return;
        }
        bumpAssistantIdle(guildId);
        console.log(`[VoiceChat] ${member.user.tag}: "${query}"`);
        try {
            if (textChannel?.send) { await textChannel.send(`🎙️ ${member} said: "${query || "(nothing)"}"`); }
        } catch { /* ignore */ }
        const synthetic = makeSyntheticMessage(member, voiceChannel, textChannel, query || "Hello");
        try {
            await runChatGptReply(synthetic);
        } catch (e) {
            console.error("[VoiceChat] reply pipeline error:", e?.message || e);
        }
    };

    const remove = addVoiceConsumer(connection, voiceChannel, consumer);
    voiceAssistants.set(guildId, { remove, idleTimer: null, textChannel });
    bumpAssistantIdle(guildId);
    return true;
}

function stopVoiceAssistant(guildId, skipRemove = false) {
    const a = voiceAssistants.get(guildId);
    if (!a) { return false; }
    if (a.idleTimer) { clearTimeout(a.idleTimer); }
    if (!skipRemove) { try { a.remove(); } catch { /* ignore */ } }
    voiceAssistants.delete(guildId);
    return true;
}

console.log("Clearing old issues...");
fs.writeFileSync(path.join(__dirname, "public", "issues.txt"), "", "utf-8");

async function newIssue(message) {
    // creates an issue in the issues tab of the web interface
    const issuesFile = path.join(__dirname, "public", "issues.txt");

    try {

        if (fs.existsSync(issuesFile)) {
            const data = fs.readFileSync(issuesFile, "utf-8");

            if (data === "") {
                fs.writeFileSync(issuesFile, message, "utf-8");
                return;
            }

            fs.writeFileSync(issuesFile, data + `\n${message}`, "utf-8");
        }

    } catch (err) {
        console.error("Error creating issue:", err);
    }
}

async function speakText(text) {
    const AWS = require('aws-sdk');
    const region = process.env.AWS_REGION || 'us-east-1';
    const polly = new AWS.Polly({ apiVersion: '2016-06-10', region });

    const maxLength = 3000;
    const payload = (typeof text === 'string') ? (text.length > maxLength ? text.slice(0, maxLength) : text) : String(text);

    console.log('[TTS][Polly] Synthesizing speech (chars:', payload.length, ')');

    const params = {
        OutputFormat: 'mp3',
        Text: payload,
        VoiceId: process.env.POLLY_VOICE || 'Matthew',
        TextType: 'text'
    };

    try {
        const data = await polly.synthesizeSpeech(params).promise();
        if (!data || !data.AudioStream) {
            throw new Error('No audio returned from Polly');
        }

        const audioBuffer = Buffer.isBuffer(data.AudioStream) ? data.AudioStream : Buffer.from(data.AudioStream);
        return audioBuffer;
    } catch (err) {
        console.error('[TTS][Polly] Error synthesizing speech:', err);
        throw err;
    }
}

// Sanitize text for TTS: remove markdown, code blocks, links, and HTML, but KEEP emoji characters
function sanitizeForTTS(text) {
    if (!text) return "";
    let out = String(text);
    // Remove fenced code blocks
    out = out.replace(/```[\s\S]*?```/g, " ");
    // Remove inline code
    out = out.replace(/`[^`]*`/g, " ");
    // Replace images ![alt](url) with alt text
    out = out.replace(/!\[([^\]]*)\]\([^\)]*\)/g, "$1");
    // Replace links [text](url) with text
    out = out.replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1");
    // Remove blockquote and heading markers
    out = out.replace(/^>+/gm, " ");
    out = out.replace(/^#{1,6}\s*/gm, " ");
    // Unwrap bold/italic/strike markers
    out = out.replace(/(\*\*|__)(.*?)\1/g, "$2");
    out = out.replace(/(\*|_)(.*?)\1/g, "$2");
    out = out.replace(/~~(.*?)~~/g, "$1");
    // Remove any remaining markdown punctuation that isn't emoji
    out = out.replace(/[\*\_\`]/g, "");
    // Strip HTML tags
    out = out.replace(/<[^>]+>/g, "");
    // Collapse whitespace
    out = out.replace(/\s{2,}/g, " ").trim();
    return out;
}

// Resolve YouTube direct URL using yt-dlp -g
async function resolveYouTubeDirectUrl(youtubeUrl) {
    return new Promise((resolve) => {
        if (!youtubeUrl) return resolve(null);
        const safeUrl = youtubeUrl.replace(/"/g, '\\"');
        const cmd = `yt-dlp -g "${safeUrl}"`;
        exec(cmd, { maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
            if (err) {
                console.error('[yt-dlp] Error resolving URL:', err, stderr);
                return resolve(null);
            }
            const lines = (stdout || '').split(/\r?\n/).map(l => l.trim()).filter(Boolean);
            if (lines.length === 0) return resolve(null);
            // Use the final non-empty line as the direct URL
            resolve(lines[lines.length - 1]);
        });
    });
}

const configl = require("./config.json");
console.log("Config loaded:", configl);
function modlog(message) {
    // make a POST request to the webhook URL with the message
    const webhookUrl = process.env.WEBHOOK_URL;
    const fetch = require("node-fetch");
    return fetch(webhookUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            content: message,
        }),
    });
}

function modlogEmbed(embed) {
    const webhookUrl = process.env.WEBHOOK_URL;
    const fetch = require("node-fetch");
    return fetch(webhookUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            embeds: [embed.toJSON()],
        }),
    });
}


// On ready, scan all members in the server and remove anyone with the disallowed role "a bot"
client.on(Events.ClientReady, async () => {
    const GUILD_ID = "1333194010201952367";
    const ROLE_A = "1445133130917871788";
    const ROLE_B = "1445133175499264092";
    const GENERAL_CHANNEL_ID = "1333194010856128567";

    const targetGuild = client.guilds.cache.get(GUILD_ID);
    if (!targetGuild) {
        console.warn(`Guild ${GUILD_ID} not found for 'a bot' sweep.`);
        return;
    }

    console.log(`Starting 'a bot' role sweep in guild ${targetGuild.name} (${targetGuild.id})`);

    try {
        // Fetch all members to ensure the cache is populated
        await targetGuild.members.fetch();

        for (const member of targetGuild.members.cache.values()) {
            try {
                // skip bots, the guild owner and the client itself
                if (member.user.bot || member.id === targetGuild.ownerId || member.id === client.user.id) { continue; }

                // 1) Handle disallowed role "a bot"
                const hasABotRole = member.roles.cache.some(r => (r.name || "").toLowerCase() === "a bot");
                if (hasABotRole) {
                    if (!member.kickable) {
                        console.log(`Cannot kick ${member.user.username}: missing permissions or role hierarchy prevents kicking.`);
                        try {
                            if (modlog && typeof modlog.send === "function") {
                                await modlog.send(`Could not kick ${member.user.username} for having disallowed role 'a bot' (insufficient permissions).`);
                            }
                        } catch (err) { console.warn("Failed to send modlog message:", err); }
                    } else {
                        try { await member.send("You have been removed from the server because you have the disallowed role: 'a bot'.").catch(() => { }); } catch { }
                        await member.kick("Removed for having disallowed role 'a bot'");
                        console.log(`Kicked ${member.user.username} for having role 'a bot'.`);
                        try {
                            if (modlog && typeof modlog.send === "function") {
                                await modlog.send(`Kicked ${member.user.username} for having disallowed role 'a bot'.`);
                            }
                        } catch (err) { console.warn("Failed to send modlog message:", err); }
                        // small delay to reduce rate-limit pressure
                        await new Promise(res => setTimeout(res, 1000));
                    }
                    // continue to next member after handling "a bot"
                    continue;
                }

                // 2) Warn members missing required roles and schedule kick in 2 minutes
                const lacksRequiredRoles = !member.roles.cache.has(ROLE_A) && !member.roles.cache.has(ROLE_B);
                if (lacksRequiredRoles) {
                    const key = `${targetGuild.id}-${member.id}-missing-roles`;
                    if (!timeoutQueue.has(key)) {
                        // Send warning message in general or system channel
                        try {
                            const general = client.channels.cache.get(GENERAL_CHANNEL_ID) || targetGuild.systemChannel;
                            const mentionMsg = `${member}, you do not have the required roles "Adult" or "Minor". Please obtain one within 2 minutes or you will be kicked.`;
                            if (general && typeof general.send === "function") {
                                await general.send(mentionMsg);
                            }
                            if (modlog) {
                                await modlog(`Warned ${member.user.username} for missing required roles.`);
                            }
                        } catch (err) {
                            console.error(`Failed to send missing-role warning to ${member.user.username}:`, err);
                        }

                        // Schedule kick in 2 minutes
                        const timer = setTimeout(async () => {
                            try {
                                const refreshed = await targetGuild.members.fetch(member.id);
                                if (!refreshed.roles.cache.has(ROLE_A) && !refreshed.roles.cache.has(ROLE_B)) {
                                    if (!refreshed.kickable) {
                                        console.log(`Cannot kick ${refreshed.user.username}: missing permissions or role hierarchy prevents kicking.`);
                                        if (modlog) {
                                            await modlog(`Could not kick ${refreshed.user.username} for missing roles (insufficient permissions).`);
                                        }
                                    } else {
                                        await refreshed.send("You have been removed from the server because you did not obtain the required role(s) within the warning period.").catch(() => { });
                                        await refreshed.kick("Missing required roles after warning period");
                                        console.log(`Kicked ${refreshed.user.username} for missing required roles.`);
                                        if (modlog) {
                                            await modlog(`Kicked ${refreshed.user.username} for missing required roles.`);
                                        }
                                    }
                                } else {
                                    // User obtained role in the interim
                                    try {
                                        const general = client.channels.cache.get(GENERAL_CHANNEL_ID) || targetGuild.systemChannel;
                                        if (general && typeof general.send === "function") {
                                            await general.send(`${refreshed} obtained the required role(s); no kick performed.`);
                                        }
                                    } catch (err) {
                                        // ignore
                                    }
                                }
                            } catch (err) {
                                console.error("Scheduled kick failed:", err);
                            } finally {
                                timeoutQueue.delete(key);
                            }
                        }, 2 * 60 * 1000); // 2 minutes

                        timeoutQueue.set(key, timer);
                    }
                }
            } catch (err) {
                console.error(`Error processing member ${member.user.username}:`, err);
                // continue with next member
                await new Promise(res => setTimeout(res, 500));
            }
        }
    } catch (err) {
        console.error("Error during 'a bot' role sweep:", err);
    }

    console.log("Completed 'a bot' role sweep and required-role warnings.");
    await modlog("'a bot' role sweep completed.");

    if (!configl.chatgptintegration.aimoderation.enabled) { return; }
    console.log('Starting "gorilla tag character with long arms" pfp check... [Powered by AI]');
    const guild = client.guilds.cache.get(GUILD_ID);
    console.log(`Checking profile pictures for ${guild.members.cache.size} members...`);
    for (const member of guild.members.cache.values()) {
        if (member.user.bot) { continue; } // skip bots
        if (guild.ownerId === member.id) { continue; } // skip server owner
        try {
            const openai = new OpenAI({
                apiKey: process.env.OPENAI_API_KEY,
            });
            const avatarUrl = member.user.displayAvatarURL({ format: "png", size: 1024 });

            // create a response using a system prompt and a user prompt to ask the ai to describe the pfp
            const response = await openai.chat.completions.create({
                model: "gpt-4.1-mini",
                messages: [
                    {
                        role: "system",
                        content: "You are a helpful assistant that describes Discord profile pictures. Please note the server's name is 'Horror Remake'."
                    },
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: "If this profile picture contains a Gorilla Tag character with unnatural long arms (cheating), respond with 'GTAG_CHAR_LONG_ARMS'. Otherwise, respond with 'NO_MATCH'. It must be an in game screenshot. Not fan art. Neither a fan game. NOR Blender Art. Blender art is realistic gorilla tag profile pictures. In game screenshots have a glowing Gorilla Tag character. OR if it contains innapropiate content, respond with 'INNAPROPIATE_CONTENT'. Only respond with one of those three options and nothing else."
                            },
                            {
                                type: "image_url",
                                image_url: {
                                    url: avatarUrl
                                }
                            }
                        ]
                    }
                ],
                max_tokens: 100
            });
            const aiReply = response.choices?.[0]?.message?.content || "";
            console.log(`Checked avatar for ${member.user.username}, AI response: ${aiReply}`);
            if (aiReply.includes("GTAG_CHAR_LONG_ARMS")) {
                try {
                    if (!member.bannable) {
                        console.warn('cannot ban user with GT character pfp and long arms:', member.user.username);
                        newIssue('could not ban ' + member.user.username);
                        modlog('Could not ban GT long arms pfp guy: ' + member.user.username);
                    } else {
                        // create a ban message with AI and send it to the user
                        const banMessageResponse = await openai.chat.completions.create({
                            model: "gpt-4.1-mini",
                            messages: [
                                {
                                    role: "system",
                                    content: "You are a helpful assistant that describes Discord profile pictures. Please note the server's name is 'Horror Remake'."
                                },
                                {
                                    role: "user",
                                    content: [
                                        {
                                            type: "text",
                                            text: "Create a message to inform a user that they have been banned from Horror Remake because their profile picture contains a Gorilla Tag character with unnatural long arms, which is considered cheating. The message should be polite but firm, and explain that cheating is not allowed in the community. Only respond with the message content and nothing else. Use the image provided for reference. \nExample: 'You have been banned from Horror Remake because your profile picture contains a Gorilla Tag character with long arms, which is not allowed.'\nUser info: \nName: " + member.user.displayName
                                        },
                                        {
                                            type: "image_url",
                                            image_url: {
                                                url: avatarUrl
                                            }
                                        }
                                    ]
                                }
                            ]
                        });
                        const otherAiReply = banMessageResponse.choices?.[0]?.message?.content || "You have been banned from Horror Remake because your profile picture contains a Gorilla Tag character with long arms, which is not allowed.";
                        console.log(`Generated ban message for ${member.user.username}: ${otherAiReply}`);
                        await member.send(otherAiReply).catch(() => { });
                        await member.ban({ reason: "Gorilla Tag character with long arms in profile picture" });
                        modlog(`Banned ${member.user.username} for having a Gorilla Tag character with long arms in their profile picture.`);
                    }
                } catch (err) {
                    console.error("Error banning user with GT character pfp:", err);
                }
            }
            if (aiReply.includes("INNAPROPIATE_CONTENT")) {
                try {
                    if (!member.bannable) {
                        console.warn('cannot ban user with innapropiate content in pfp:', member.user.username);
                        newIssue('could not ban ' + member.user.username);
                        modlog('Could not ban dude with innapropiate content in pfp: ' + member.user.username);
                    } else {
                        // create a ban message with AI and send it to the user
                        const banMessageResponse = await openai.chat.completions.create({
                            model: "gpt-4.1-mini",
                            messages: [
                                {
                                    role: "system",
                                    content: "You are a helpful assistant that describes Discord profile pictures. Please note the server's name is 'Horror Remake'."
                                },
                                {
                                    role: "user",
                                    content: [
                                        {
                                            type: "text",
                                            text: "Create a message to inform a user that they have been banned from Horror Remake because their profile picture contains innapropiate content. The message should be polite but firm, and explain that cheating is not allowed in the community. Only respond with the message content and nothing else. Use the image provided for reference. \nExample: 'You have been banned from Horror Remake because your profile picture contains innapropiate content, which is not allowed.'\nUser info: \nName: " + member.user.displayName
                                        },
                                        {
                                            type: "image_url",
                                            image_url: {
                                                url: avatarUrl
                                            }
                                        }
                                    ]
                                }
                            ]
                        });
                        const otherAiReply = banMessageResponse.choices?.[0]?.message?.content || "You have been banned from Horror Remake because your profile picture contains a Gorilla Tag character with long arms, which is not allowed.";
                        console.log(`Generated ban message for ${member.user.username}: ${otherAiReply}`);
                        await member.send(otherAiReply).catch(() => { });
                        await member.ban({ reason: "Innapropiate content in profile picture" });
                        modlog(`Banned ${member.user.username} for having innapropiate content in their profile picture.`);
                    }
                } catch (err) {
                    console.error("Error banning user with innapropiate content in pfp:", err);
                }
            }
            if (aiReply.includes("NO_MATCH")) {
                modlog(`Checked ${member.user.username}'s profile picture - no issues found.`);
            }
        } catch (err) {
            console.error(`Error processing profile picture for ${member.user.username}:`, err);
        }
    }
    console.log('Completed profile picture check.');
    modlog("Completed profile picture check for all members.");
});

client.on("guildMemberAdd", async (member) => {
    try {
        if (!configl.chatgptintegration.aimoderation.enabled) { return; }

        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
        const avatarUrl = member.user.displayAvatarURL({ format: "png", size: 1024 });

        // create a response using a system prompt and a user prompt to ask the ai to describe the pfp
        const response = await openai.chat.completions.create({
            model: "gpt-4.1-mini",
            messages: [
                {
                    role: "system",
                    content: "You are a helpful assistant that describes Discord profile pictures. Please note the server's name is 'Horror Remake'."
                },
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: "If this profile picture contains a Gorilla Tag character with unnatural long arms (cheating), respond with 'GTAG_CHAR_LONG_ARMS'. Otherwise, respond with 'NO_MATCH'. It must be an in game screenshot. Not fan art. Neither a fan game. NOR Blender Art. Blender art is realistic gorilla tag profile pictures. In game screenshots have a glowing Gorilla Tag character. OR if it contains innapropiate content, respond with 'INNAPROPIATE_CONTENT'. Only respond with one of those three options and nothing else."
                        },
                        {
                            type: "image_url",
                            image_url: {
                                url: avatarUrl
                            }
                        }
                    ]
                }
            ],
            max_tokens: 100
        });
        const aiReply = response.choices?.[0]?.message?.content || "";
        console.log(`Checked avatar for ${member.user.username}, AI response: ${aiReply}`);
        if (aiReply.includes("GTAG_CHAR_LONG_ARMS")) {
            try {
                if (!member.bannable) {
                    console.warn('cannot ban user with GT character pfp and long arms:', member.user.username);
                } else {
                    // create a ban message with AI and send it to the user
                    const banMessageResponse = await openai.chat.completions.create({
                        model: "gpt-4.1-mini",
                        messages: [
                            {
                                role: "system",
                                content: "You are a helpful assistant that describes Discord profile pictures. Please note the server's name is 'Horror Remake'."
                            },
                            {
                                role: "user",
                                content: [
                                    {
                                        type: "text",
                                        text: "Create a message to inform a user that they have been banned from Horror Remake because their profile picture contains a Gorilla Tag character with unnatural long arms, which is considered cheating. The message should be polite but firm, and explain that cheating is not allowed in the community. Only respond with the message content and nothing else. Use the image provided for reference. \nExample: 'You have been banned from Horror Remake because your profile picture contains a Gorilla Tag character with long arms, which is not allowed.'\nUser info: \nName: " + member.user.displayName
                                    },
                                    {
                                        type: "image_url",
                                        image_url: {
                                            url: avatarUrl
                                        }
                                    }
                                ]
                            }
                        ]
                    });
                    const otherAiReply = banMessageResponse.choices?.[0]?.message?.content || "You have been banned from Horror Remake because your profile picture contains a Gorilla Tag character with long arms, which is not allowed.";
                    console.log(`Generated ban message for ${member.user.username}: ${otherAiReply}`);
                    await member.send(otherAiReply).catch(() => { });
                    await member.ban({ reason: "Gorilla Tag character with long arms in profile picture" });
                    modlog(`Banned ${member.user.username} for having a Gorilla Tag character with long arms in their profile picture.`);
                }
            } catch (err) {
                console.error("Error banning user with GT character pfp:", err);
            }
        }
        if (aiReply.includes("INNAPROPIATE_CONTENT")) {
            try {
                if (!member.bannable) {
                    console.warn('cannot ban user with innapropiate content in pfp:', member.user.username);
                } else {
                    // create a ban message with AI and send it to the user
                    const banMessageResponse = await openai.chat.completions.create({
                        model: "gpt-4.1-mini",
                        messages: [
                            {
                                role: "system",
                                content: "You are a helpful assistant that describes Discord profile pictures. Please note the server's name is 'Horror Remake'."
                            },
                            {
                                role: "user",
                                content: [
                                    {
                                        type: "text",
                                        text: "Create a message to inform a user that they have been banned from Horror Remake because their profile picture contains innapropiate content. The message should be polite but firm, and explain that cheating is not allowed in the community. Only respond with the message content and nothing else. Use the image provided for reference. \nExample: 'You have been banned from Horror Remake because your profile picture contains innapropiate content, which is not allowed.'\nUser info: \nName: " + member.user.displayName
                                    },
                                    {
                                        type: "image_url",
                                        image_url: {
                                            url: avatarUrl
                                        }
                                    }
                                ]
                            }
                        ]
                    });
                    const otherAiReply = banMessageResponse.choices?.[0]?.message?.content || "You have been banned from Horror Remake because your profile picture contains a Gorilla Tag character with long arms, which is not allowed.";
                    console.log(`Generated ban message for ${member.user.username}: ${otherAiReply}`);
                    await member.send(otherAiReply).catch(() => { });
                    await member.ban({ reason: "Innapropiate content in profile picture" });
                    modlog(`Banned ${member.user.username} for having innapropiate content in their profile picture.`);
                }
            } catch (err) {
                console.error("Error banning user with innapropiate content in pfp:", err);
            }
        }
        if (aiReply.includes("NO_MATCH")) {
            modlog(`Checked ${member.user.username}'s profile picture - no issues found.`);
        }
    } catch (err) {
        console.error(`Error processing profile picture for ${member.user.username}:`, err);
    }

    if (member.user.bot) { return; } // skip bots
    if (member.user.createdTimestamp > Date.now() - 5 * 24 * 60 * 60 * 1000) {
        // Ban users whose account is younger than 5 days
        try {
            await member.send("Your account is too new to join the Horror Remake Discord server. If you believe this is a mistake, please contact the moderators.").catch(() => { });
            await member.ban({ reason: "Account age less than 5 days" });
            modlog(`Banned ${member.user.username} for having an account age less than 5 days.`);
        } catch (err) {
            console.error("Error banning user for new account:", err);
            modlog(`Could not ban ${member.user.username} for new account (less than 5 days old) - insufficient permissions.`);
            newIssue(`Failed to ban user ${member.user.username} for new account (less than 5 days old). Please check permissions and ban manually if necessary.`);
        }
    }
});

client.on("messageCreate", async (message) => {
    if (message.author.bot) { return; } // Ignore bot messages

    // Log DMs
    if (message.channel.type === ChannelType.DM) { // 1 = DMChannel in discord.js v14+
        console.log(`[DM] ${message.author.tag}: ${message.content}`);
    }

    // Bad words filter
    const words = message.content.split(/\s+/).filter(Boolean);
    for (const word of words) {
        if (isBadWord(word)) {
            try {
                if (message.channel.type === ChannelType.DM) { continue; } // skip bad word filter for DMs
                message.delete();
            } catch (err) {
                console.error("Failed to delete message with bad word:", err);
            }

            try {
                if (!message.guild) { return null; } // should not happen, but just in case
                await message.member.timeout(600000, "Using inappropriate language.");
                message.channel.send(
                    `${message.author} has been timed out for 10 minutes for using inappropriate language.`,
                );
            } catch (error) {
                if (error.code === 50013) {
                    console.log(`Bad word detected: ${word}`);
                    console.log(
                        "Missing permissions to timeout user, message was still deleted",
                    );
                    message.channel.send(
                        `${message.author}, your message has been deleted.`,
                    );
                }
            }
            break;
        }
    }

    // Cheats words filter
    for (const word of words) {
        if (cheatsWords.includes(word.toLowerCase())) {
            message.reply(
                "# No cheats in Horror Remake! \n### We know that modding is fun, but it can ruin the game for others. Please don't do it.",
            );
            break;
        }
    }

    // chatgpt mention reply
    // ====== HANDLER ======
    if (
        message.mentions?.has?.(client.user) ||
        message.content.startsWith(`<@!${client.user.id}>`) ||
        message.content.startsWith(`<@${client.user.id}>`) ||
        message.channel.type === ChannelType.DM &&
        configl.chatgptintegration.enabled
    ) {
        await runChatGptReply(message);
    }
});

// ====== CHATGPT REPLY ======
// Shared by text @mentions/DMs and the voice assistant, which calls this with a synthetic
// message built from a transcribed voice utterance (see makeSyntheticMessage).
async function runChatGptReply(message) {
    const urlRegex = /(https?:\/\/[^\s]+)/gi;

        console.log(`ChatGPT mention/DM by ${message.author.globalName || message.author.displayName}: ${message.content}`);

        let actionsMade = "";

        if (!configl.chatgptintegration.enabled) { return message.reply("Sorry, Horror ReAI is currently disabled."); }

        if (message.content.startsWith("!")) { return; } // commands start with ! so ignore those

        if (message.channelId === "1333199694716862554") { return; }
        if (message.channelId === "1496576226611953684") { return; }

        if (message.author.bot) { return; }
        if (message.mentions.has("@everyone") || message.mentions.has("@here")) { return; }

        message.channel.sendTyping();

        let cleaned = message.content
            .replace(`<@!${client.user.id}>`, "@Horror Rebot")
            .replace(`<@${client.user.id}>`, "@Horror Rebot")
            .replace(/\s{2,}/g, " ")
            .trim();

        if (!cleaned) { cleaned = "Hello"; }
        message.content = cleaned;

        // ====== MEMORY KEY ======
        const memoryKey = message.guild
            ? `channel:${message.channel.id}`
            : `dm:${message.author.id}`;

        if (!chatMemory.has(memoryKey)) {
            chatMemory.set(memoryKey, []);
        }

        // If this message is a reply, and the replied-to message is itself a reply,
        // fetch the original parent message and add a system prompt with its content.
        if (message.reference?.messageId) {
            try {
                const repliedMsg = await message.channel.messages.fetch(message.reference.messageId).catch(() => null);
                if (repliedMsg?.reference?.messageId) {
                    const parentMsg = await message.channel.messages.fetch(repliedMsg.reference.messageId).catch(() => null);
                    if (parentMsg) {
                        const parentText = (parentMsg.content || "[non-text content]").replace(/\s+/g, " ").trim().slice(0, 4000);
                        const mem = chatMemory.get(memoryKey);
                        if (mem) {
                            mem.push({
                                role: "system",
                                content: `You are currently replying to a message that itself is a reply. We will share the message content of the parent message here. \n${parentText}`
                            });
                        }
                    }
                }
            } catch (e) {
                // ignore fetch failures silently
            }
        }

        const history = chatMemory.get(memoryKey);

        // ====== OPENAI ======
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        // ====== FETCH USER INFO ======
        let member;
        if (!message.guild) {
            for (const guild of client.guilds.cache.values()) {
                try {
                    const fetchedMember = await guild.members.fetch(message.author.id);
                    if (fetchedMember) {
                        member = fetchedMember;
                        break;
                    }
                } catch { }
            }
        } else {
            member = await message.guild.members.fetch(message.author.id);
        }

        const presence = member?.presence?.activities?.[0];
        const typeMap = {
            0: "Playing",
            1: "Streaming",
            2: "Listening to",
            3: "Watching",
            4: "Custom",
            5: "Competing in"
        };

        const activity = presence
            ? `${typeMap[presence.type] || "Doing"} ${presence.name}`
            : "No current activity";

        // ====== URL FETCHING ======
        const urls = cleaned.match(urlRegex) || [];
        let pageContent = "";

        for (const url of urls) {
            try {
                const res = await fetch(url, { redirect: "follow" });
                let html;
                const contentType = res.headers.get?.('content-type') || '';
                if (contentType.includes('text/html')) {
                    try {
                        // Render the page with JS using puppeteer (install puppeteer in your project)
                        const browser = await puppeteer.launch({
                            args: ['--no-sandbox', '--disable-setuid-sandbox', '--ngrok-skip-browser-warning 1', '--ngrok-skip-browser-warning=1'],
                        });
                        const page = await browser.newPage();
                        await page.setExtraHTTPHeaders({
                            "ngrok-skip-browser-warning": "1",
                        });
                        await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3");
                        await page.goto(url, { waitUntil: "networkidle2", timeout: 15000 });
                        html = await page.content();
                        await browser.close();
                    } catch (err) {
                        // Fallback to plain text if puppeteer is unavailable or fails
                        html = await res.text();
                    }
                } else {
                    html = await res.text();
                }

                // VERY basic HTML text extraction
                const text = html
                    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
                    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
                    .replace(/<[^>]+>/g, "")
                    .replace(/\s+/g, " ")
                    .trim();

                pageContent += `\n\n[Content from ${url} (If the page warns you that javascript is disabled, its because you are viewing the page in plain text without styles or scripts loaded.)]\n${text.slice(0, 12000)}`;
            } catch (err) {
                pageContent += `\n\n[Failed to fetch ${url}]`;
            }
        }

        // ====== PUSH USER MESSAGE ======
        history.push({
            role: "user",
            content: JSON.stringify({
                message: message,
                author: message.author,
                channel: message.channel
            })
        });

        // ====== TRIM MEMORY ======
        if (history.length > 21) {
            history.splice(1, history.length - 21);
        }

        // ====== SERVER-SIDE FUNCTIONS (OPENAI TOOL CALLING) ======
        const serverFunctionHandlers = {
            do_nothing: async () => {
                console.log("AI ran do_nothing");
                console.log("[ServerFunction] do_nothing called by", message?.author?.tag || message?.author?.id || "unknown");
                return "ok";
            },
            read_server_code: async (args, { message }) => {
                console.log("AI ran read_server_code");
                console.log("[ServerFunction] read_server_code called by", message?.author?.tag || message?.author?.id || "unknown", "args:", { filePath: args?.filePath });

                // Reading is open to everyone (no permission required). The .env/.git/node_modules
                // block below still applies so secrets/internals are never exposed.
                const { filePath } = args || {};
                if (!filePath || typeof filePath !== "string" || !filePath.trim()) {
                    return "(Error) Missing filePath";
                }

                // Keep reads inside the project directory and away from secrets/internals.
                const root = path.resolve(__dirname);
                const absPath = path.resolve(root, filePath);
                if (absPath !== root && !absPath.startsWith(root + path.sep)) {
                    return "(Error) filePath escapes the project directory.";
                }
                const rel = path.relative(root, absPath).replace(/\\/g, "/").toLowerCase();
                if (rel.startsWith(".git/") || rel.startsWith("node_modules/") || isProtectedSecretFile(rel)) {
                    return "(Error) Reading that file is not allowed.";
                }

                if (!fs.existsSync(absPath)) {
                    return "(Error) File does not exist.";
                }
                if (fs.statSync(absPath).isDirectory()) {
                    // List directory contents instead of trying to read it as a file.
                    // Hide secret env files so they aren't even visible.
                    const entries = fs.readdirSync(absPath, { withFileTypes: true })
                        .filter((e) => !isProtectedSecretFile(e.name.toLowerCase()))
                        .map((e) => (e.isDirectory() ? `${e.name}/` : e.name));
                    return `(Directory) ${filePath}\n${entries.join("\n")}`;
                }

                let content;
                try {
                    content = fs.readFileSync(absPath, "utf-8");
                } catch (err) {
                    return `(Error) Could not read file. ${err?.message || String(err)}`;
                }

                // Cap the returned content so a huge file can't blow up the token budget. The AI
                // can ask for a specific snippet to edit even from a partial view.
                const MAX_CHARS = 12000;
                actionsMade += `-# Read \`${filePath}\`\n`;
                if (content.length > MAX_CHARS) {
                    return `(File: ${filePath}, truncated to first ${MAX_CHARS} of ${content.length} chars)\n${content.slice(0, MAX_CHARS)}`;
                }
                return `(File: ${filePath})\n${content}`;
            },
            read_server_code_lines: async (args, { message }) => {
                console.log("AI ran read_server_code_lines");
                console.log("[ServerFunction] read_server_code_lines called by", message?.author?.tag || message?.author?.id || "unknown", "args:", { filePath: args?.filePath, startLine: args?.startLine, endLine: args?.endLine });

                // Reading is open to everyone (no permission required). The .env/.git/node_modules
                // block below still applies so secrets/internals are never exposed.
                const { filePath, startLine, endLine } = args || {};
                if (!filePath || typeof filePath !== "string" || !filePath.trim()) {
                    return "(Error) Missing filePath";
                }
                const start = Math.floor(Number(startLine));
                const end = Math.floor(Number(endLine));
                if (!Number.isFinite(start) || !Number.isFinite(end) || start < 1 || end < 1) {
                    return "(Error) startLine and endLine must be positive whole numbers (1-based).";
                }
                if (end < start) {
                    return "(Error) endLine must be greater than or equal to startLine.";
                }

                // Keep reads inside the project directory and away from secrets/internals.
                const root = path.resolve(__dirname);
                const absPath = path.resolve(root, filePath);
                if (absPath !== root && !absPath.startsWith(root + path.sep)) {
                    return "(Error) filePath escapes the project directory.";
                }
                const rel = path.relative(root, absPath).replace(/\\/g, "/").toLowerCase();
                if (rel.startsWith(".git/") || rel.startsWith("node_modules/") || isProtectedSecretFile(rel)) {
                    return "(Error) Reading that file is not allowed.";
                }

                if (!fs.existsSync(absPath)) {
                    return "(Error) File does not exist.";
                }
                if (fs.statSync(absPath).isDirectory()) {
                    return "(Error) That path is a directory, not a file.";
                }

                let content;
                try {
                    content = fs.readFileSync(absPath, "utf-8");
                } catch (err) {
                    return `(Error) Could not read file. ${err?.message || String(err)}`;
                }

                const lines = content.split("\n");
                if (start > lines.length) {
                    return `(Error) startLine ${start} is past the end of the file (${lines.length} lines).`;
                }

                // Clamp the range and cap how many lines we return at once.
                const MAX_LINES = 400;
                const from = start;
                const to = Math.min(end, lines.length, start + MAX_LINES - 1);
                const truncated = to < Math.min(end, lines.length);

                // Number each line so the AI can build an exact oldString for edit_server_code.
                const width = String(to).length;
                const slice = lines.slice(from - 1, to)
                    .map((line, i) => `${String(from + i).padStart(width, " ")} | ${line}`)
                    .join("\n");

                actionsMade += `-# Read \`${filePath}\` lines ${from}-${to}\n`;
                const header = `(File: ${filePath}, lines ${from}-${to} of ${lines.length}${truncated ? `, truncated to ${MAX_LINES} lines` : ""})`;
                return `${header}\n${slice}`;
            },
            list_server_files: async (args, { message }) => {
                console.log("AI ran list_server_files");
                console.log("[ServerFunction] list_server_files called by", message?.author?.tag || message?.author?.id || "unknown");

                // Open to everyone. Recursively lists every file in the project, skipping the
                // dependency/VCS dirs (node_modules, .git) since those aren't "the app".
                const root = path.resolve(__dirname);
                const SKIP_DIRS = new Set(["node_modules", ".git"]);
                const MAX_FILES = 2000;
                const results = [];
                let truncated = false;

                const walk = (dir) => {
                    if (results.length >= MAX_FILES) { truncated = true; return; }
                    let entries;
                    try {
                        entries = fs.readdirSync(dir, { withFileTypes: true });
                    } catch {
                        return; // unreadable dir, skip it
                    }
                    entries.sort((a, b) => a.name.localeCompare(b.name));
                    for (const e of entries) {
                        if (results.length >= MAX_FILES) { truncated = true; return; }
                        // isDirectory() is false for symlinks, so symlinked dirs aren't followed (no loops).
                        if (e.isDirectory()) {
                            if (SKIP_DIRS.has(e.name)) { continue; }
                            walk(path.join(dir, e.name));
                        } else if (e.isFile()) {
                            const relFile = path.relative(root, path.join(dir, e.name)).replace(/\\/g, "/");
                            if (isProtectedSecretFile(relFile.toLowerCase())) { continue; } // never expose secret env files
                            results.push(relFile);
                        }
                    }
                };
                walk(root);

                actionsMade += `-# Listed all project files\n`;
                let body = results.join("\n");
                const MAX_CHARS = 12000;
                if (body.length > MAX_CHARS) {
                    body = body.slice(0, MAX_CHARS) + "\n... (more files omitted)";
                    truncated = true;
                }
                const header = `(Project files: ${results.length}${truncated ? `, truncated` : ""}; node_modules and .git are excluded)`;
                return `${header}\n${body}`;
            },
            edit_server_code: async (args, { message }) => {
                console.log("AI ran edit_server_code");
                console.log("[ServerFunction] edit_server_code called by", message?.author?.tag || message?.author?.id || "unknown", "args:", { filePath: args?.filePath });

                // Anyone may PROPOSE an edit, but it is never applied without owner approval:
                // the change is parked and only written to disk when the owner clicks "Yes" on
                // the DM below (and the buttons are gated to the owner).
                const { filePath, oldString, newString } = args || {};
                if (!filePath || typeof filePath !== "string" || !filePath.trim()) {
                    return "(Error) Missing filePath";
                }
                if (typeof oldString !== "string" || typeof newString !== "string") {
                    return "(Error) oldString and newString must both be strings (use an empty oldString to create/append).";
                }
                if (oldString === "" && newString === "") {
                    return "(Error) Nothing to change (both oldString and newString are empty).";
                }

                // Keep the edit inside the project directory and away from secrets/internals.
                const root = path.resolve(__dirname);
                const absPath = path.resolve(root, filePath);
                if (absPath !== root && !absPath.startsWith(root + path.sep)) {
                    return "(Error) filePath escapes the project directory.";
                }
                const rel = path.relative(root, absPath).replace(/\\/g, "/").toLowerCase();
                if (rel.startsWith(".git/") || rel.startsWith("node_modules/") || isProtectedSecretFile(rel)) {
                    return "(Error) Editing that file is not allowed.";
                }

                // Validate the replacement target up front so we can give the AI a useful error.
                const exists = fs.existsSync(absPath);
                if (oldString !== "") {
                    if (!exists) {
                        return "(Error) File does not exist. To create it, pass an empty oldString and put the file contents in newString.";
                    }
                    const current = fs.readFileSync(absPath, "utf-8");
                    const occurrences = current.split(oldString).length - 1;
                    if (occurrences === 0) {
                        return "(Error) oldString was not found in the file. Provide an exact snippet to replace.";
                    }
                    if (occurrences > 1) {
                        return "(Error) oldString appears multiple times; include more surrounding context so it is unique.";
                    }
                }

                // Ask the owner to approve it via DM buttons.
                const owner = await client.users.fetch(CODE_EDIT_OWNER_ID).catch(() => null);
                if (!owner) {
                    return "(Error) Could not reach the bot owner to request approval.";
                }

                const editId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
                const acceptId = `editcode_accept_${editId}`;
                const rejectId = `editcode_reject_${editId}`;
                const whatchanged = buildEditPreview(filePath, oldString, newString);
                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId(acceptId).setLabel("Yes").setStyle(ButtonStyle.Success),
                    new ButtonBuilder().setCustomId(rejectId).setLabel("No").setStyle(ButtonStyle.Danger),
                );

                let sent;
                try {
                    sent = await owner.send({
                        content: `Do you accept the edits?\n\`\`\`diff\n${whatchanged}\n\`\`\``,
                        components: [row],
                    });
                } catch (err) {
                    return `(Error) Could not DM the owner for approval (privacy settings or blocked). ${err?.message || String(err)}`;
                }

                actionsMade += `-# Proposed an edit to \`${filePath}\` (awaiting owner approval)\n`;

                // Block until the owner clicks Yes/No (or it times out), then continue with the outcome.
                const APPROVAL_TIMEOUT_MS = 5 * 60 * 1000;
                let interaction;
                try {
                    interaction = await sent.awaitMessageComponent({
                        filter: (i) => i.user.id === CODE_EDIT_OWNER_ID && (i.customId === acceptId || i.customId === rejectId),
                        time: APPROVAL_TIMEOUT_MS,
                    });
                } catch {
                    // No response within the window.
                    try { await sent.edit({ content: `⌛ Edit to \`${filePath}\` timed out (no response).`, components: [] }); } catch { /* ignore */ }
                    return "(Denied) The owner did not respond in time, so the edit was NOT applied.";
                }

                if (interaction.customId === rejectId) {
                    await interaction.update({ content: `❌ Edit to \`${filePath}\` rejected.`, components: [] }).catch(() => { });
                    return "(Denied) The owner rejected the edit; nothing was changed.";
                }

                // Approved -> apply the change to disk now.
                try {
                    const stillExists = fs.existsSync(absPath);
                    let updated;
                    if (oldString === "") {
                        const current = stillExists ? fs.readFileSync(absPath, "utf-8") : "";
                        updated = current ? current + newString : newString;
                    } else {
                        if (!stillExists) {
                            await interaction.update({ content: `⚠️ Could not apply: \`${filePath}\` no longer exists.`, components: [] }).catch(() => { });
                            return "(Error) Approved, but the file no longer exists; edit not applied.";
                        }
                        const current = fs.readFileSync(absPath, "utf-8");
                        if (!current.includes(oldString)) {
                            await interaction.update({ content: `⚠️ Could not apply: the original text in \`${filePath}\` changed since the proposal.`, components: [] }).catch(() => { });
                            return "(Error) Approved, but the file changed since the proposal; edit not applied.";
                        }
                        updated = current.replace(oldString, newString);
                    }
                    fs.mkdirSync(path.dirname(absPath), { recursive: true });
                    fs.writeFileSync(absPath, updated, "utf-8");
                    console.log(`[CodeEdit] Owner approved & applied edit to ${filePath}`);
                    await interaction.update({ content: `✅ Applied edit to \`${filePath}\`.`, components: [] }).catch(() => { });
                    return `(Success) The owner approved the edit and it was applied to ${filePath}.`;
                } catch (err) {
                    console.error("[CodeEdit] Failed to apply edit:", err);
                    await interaction.update({ content: `⚠️ Failed to apply edit to \`${filePath}\`: ${err?.message || String(err)}`, components: [] }).catch(() => { });
                    return `(Error) Approved but failed to write the file. ${err?.message || String(err)}`;
                }
            },
            git_sync: async (args, { message }) => {
                console.log("AI ran git_sync");
                console.log("[ServerFunction] git_sync called by", message?.author?.tag || message?.author?.id || "unknown");

                // Owner-only: a sync commits + pushes to the public repo and can restart the bot.
                if (message?.author?.id !== CODE_EDIT_OWNER_ID) {
                    return "(Error) Only the bot owner can manually trigger a git sync.";
                }

                actionsMade += `-# Triggered a git sync\n`;
                const result = await syncRepo();

                if (!result || !result.ok) {
                    return `(Error) ${result?.reason || "Git sync did not complete."}`;
                }
                if (result.willRestart) {
                    // restart() was kicked off inside syncRepo; the bot may exit before this reply sends.
                    return "(Success) Pulled new remote code and merged it. Restarting to run the latest version...";
                }
                const parts = [];
                if (result.committed) { parts.push("committed local changes"); }
                if (result.pushed) { parts.push(`pushed ${result.pushed} commit(s)`); }
                if (parts.length === 0) { parts.push("already up to date, nothing to commit or push"); }
                return `(Success) Git sync complete: ${parts.join(", ")}.`;
            },
            dm_member: async (args, { message }) => {
                console.log("AI ran dm_member");
                console.log("[ServerFunction] dm_member called by", message?.author?.tag || message?.author?.id || "unknown", "args:", args);
                const { targetUserID, content } = args || {};

                const executorMember = message.member;
                if (!executorMember) {
                    return "(Error) Could not resolve executor member.";
                }
                if (!executorMember.permissions.has("Administrator")) {
                    return "(Error) Executor does not have permission to use this function";
                }

                if (!targetUserID) {
                    return "(Error) Missing targetUserID";
                }
                if (!content || typeof content !== "string" || !content.trim()) {
                    return "(Error) Missing content";
                }

                const user = await client.users.fetch(targetUserID).catch(() => null);
                if (!user) {
                    return "(Error) Could not find that user.";
                }
                if (user.id === client.user.id) {
                    return "(Error) Attempted to DM self.";
                }

                try {
                    await user.send(content.slice(0, 1900));
                    actionsMade += `-# Sent a DM to ${user.displayName}\n`;
                    return `(Success) Sent a DM to ${user.username}`;
                } catch (err) {
                    return `(Error) Could not DM that user (privacy settings or blocked). ${err?.message || String(err)}`;
                }
            },
            ban_member: async (args, { message }) => {
                console.log("AI ran ban_member");
                console.log("[ServerFunction] ban_member called by", message?.author?.tag || message?.author?.id || "unknown", "args:", args);
                const { targetUserID, reason = null } = args || {};
                const guild = message.guild ? message.guild : null;
                if (!guild) {
                    return "(Error) Guild is null or unknown :(";
                }

                const executorMember = message.member;
                if (!executorMember) {
                    return "(Error) Could not resolve executor member.";
                }
                if (!executorMember.permissions.has("Administrator")) {
                    return "(Error) Executor does not have permission to use this function";
                }

                if (!targetUserID) {
                    return "(Error) Missing targetUserID";
                }

                const victim = await guild.members.fetch(targetUserID).catch(() => null);
                if (!victim) {
                    return "(Error) Could not find that user in this server.";
                }
                if (victim.user?.id === client.user.id) {
                    return "(Error) Attempted suicide (Tried to ban self)";
                }
                if (victim && victim.bannable) {
                    await victim.ban({ reason: reason ? reason : "No reason given." });
                    actionsMade += `-# Banned ${victim.displayName}\n`;
                    return `(Success) Banned ${victim.displayName}`;
                }

                return "(Error) I cannot ban this user (missing permissions / role hierarchy).";
            },
            package: async () => {
                console.log("AI read package.json");
                console.log("[ServerFunction] package called by", message?.author?.tag || message?.author?.id || "unknown");
                actionsMade += `-# Looked up information on the bot\n`;
                return package;
            },
            view_user_info: async (args, { message }) => {
                let output = "";
                const { id } = args || {};
                try {
                    console.log("AI is getting info from user " + id);
                    console.log("[ServerFunction] view_user_info called by", message?.author?.tag || message?.author?.id || "unknown", "args:", args);

                    output += "Getting user";
                    const member = client.users.cache.get(id);

                    if (member) {
                        output += `\nFinal member information: ${JSON.stringify(member)}`;
                    } else {
                        output += "\nUnknown User";
                    }

                    actionsMade += member ? `-# Got information on user: ${member.displayName}\n` : `-# Could not fetch user information`;
                    return output;
                } catch (error) {
                    output += error;
                }
            },
            kick_member: async (args, { message }) => {
                console.log("AI ran kick_member");
                console.log("[ServerFunction] kick_member called by", message?.author?.tag || message?.author?.id || "unknown", "args:", args);
                const { targetUserID, reason = null } = args || {};
                const guild = message.guild ? message.guild : null;
                if (!guild) {
                    return "(Error) Guild is null or unknown :(";
                }

                const executorMember = message.member;
                if (!executorMember) {
                    return "(Error) Could not resolve executor member.";
                }
                if (!executorMember.permissions.has("Administrator")) {
                    return "(Error) Executor does not have permission to use this function";
                }

                if (!targetUserID) {
                    return "(Error) Missing targetUserID";
                }

                const victim = await guild.members.fetch(targetUserID).catch(() => null);
                if (!victim) {
                    return "(Error) Could not find that user in this server.";
                }
                if (victim.user?.id === client.user.id) {
                    return "(Error) Attempted suicide (Tried to kick self)";
                }
                if (victim && victim.kickable) {
                    await victim.kick({ reason: reason ? reason : "No reason given." });
                    actionsMade += `-# Kicked ${victim.displayName}\n`;
                    return `(Success) Kicked ${victim.displayName}`;
                }

                return "(Error) I cannot ban this user (missing permissions / role hierarchy).";
            },
            timeout_member: async (args, { message }) => {
                console.log("AI ran timeout_member");
                console.log("[ServerFunction] timeout_member called by", message?.author?.tag || message?.author?.id || "unknown", "args:", args);
                const { targetUserID, durationSeconds, reason = "" } = args || {};

                const guild = message.guild ? message.guild : null;
                if (!guild) {
                    return "(Error) Guild is null or unknown :(";
                }

                const executorMember = message.member;
                if (!executorMember) {
                    return "(Error) Could not resolve executor member.";
                }
                if (!executorMember.permissions.has("Administrator")) {
                    return "(Error) Executor does not have permission to use this function";
                }

                if (!targetUserID) {
                    return "(Error) Missing targetUserID";
                }

                const seconds = Number(durationSeconds);
                if (!Number.isFinite(seconds) || seconds < 0) {
                    return "(Error) durationSeconds must be a number >= 0";
                }
                // Discord timeout max is 28 days
                const maxSeconds = 28 * 24 * 60 * 60;
                const clampedSeconds = Math.min(Math.floor(seconds), maxSeconds);
                const durationMs = clampedSeconds * 1000;

                const victim = await guild.members.fetch(targetUserID).catch(() => null);
                if (!victim) {
                    return "(Error) Could not find that user in this server.";
                }
                if (victim.user?.id === client.user.id) {
                    return "(Error) Attempted suicide (Tried to timeout self)";
                }

                if (!victim.moderatable) {
                    return "(Error) I cannot timeout this user (missing permissions / role hierarchy).";
                }

                try {
                    await victim.timeout(durationMs, (reason || "").slice(0, 400));
                    if (durationMs === 0) {
                        actionsMade += `-# Removed timeout\n`;
                        return `(Success) Removed timeout for ${victim.displayName}`;
                    }
                    actionsMade += `-# Timed out ${victim.displayName}\n`;
                    return `(Success) Timed out ${victim.displayName} for ${clampedSeconds} seconds`;
                } catch (err) {
                    actionsMade += `-# Could not time out user\n`;
                    return `(Error) Failed to timeout user. ${err?.message || String(err)}`;
                }
            },
            send_image_message: async (args, { message }) => {
                console.log("AI ran send_image_message");
                console.log("[ServerFunction] send_image_message called by", message?.author?.tag || message?.author?.id || "unknown", "args:", { imageUrl: args?.imageUrl });
                const { imageUrl, content = "" } = args || {};

                const executorMember = message.member;
                if (!executorMember) {
                    return "(Error) Could not resolve executor member.";
                }
                if (!executorMember.permissions.has("Administrator")) {
                    return "(Error) Executor does not have permission to use this function";
                }

                if (!imageUrl || typeof imageUrl !== "string" || !imageUrl.trim()) {
                    return "(Error) Missing imageUrl";
                }

                let url;
                try {
                    url = new URL(imageUrl);
                } catch {
                    return "(Error) imageUrl must be a valid URL";
                }

                if (!["http:", "https:"].includes(url.protocol)) {
                    return "(Error) imageUrl must be http(s)";
                }

                // Basic SSRF guard: block localhost and obvious private hostnames.
                const hostname = (url.hostname || "").toLowerCase();
                if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1") {
                    return "(Error) imageUrl hostname not allowed";
                }
                if (
                    hostname.endsWith(".local") ||
                    hostname.endsWith(".internal") ||
                    hostname.endsWith(".lan")
                ) {
                    return "(Error) imageUrl hostname not allowed";
                }

                let resp;
                try {
                    resp = await fetch(url.toString(), { redirect: "follow" });
                } catch (err) {
                    return `(Error) Failed to fetch image. ${err?.message || String(err)}`;
                }

                if (!resp.ok) {
                    return `(Error) Failed to fetch image (HTTP ${resp.status})`;
                }

                const contentType = (resp.headers.get("content-type") || "").toLowerCase();
                if (!contentType.startsWith("image/")) {
                    return `(Error) URL did not return an image (content-type: ${contentType || "unknown"})`;
                }

                let arrayBuffer;
                try {
                    arrayBuffer = await resp.arrayBuffer();
                } catch (err) {
                    return `(Error) Failed reading image body. ${err?.message || String(err)}`;
                }

                const buffer = Buffer.from(arrayBuffer);
                // Keep within typical Discord upload limits; 8MB is a safe default.
                const maxBytes = 8 * 1024 * 1024;
                if (buffer.length > maxBytes) {
                    return `(Error) Image too large (${buffer.length} bytes). Max ${maxBytes} bytes.`;
                }

                const { AttachmentBuilder } = require("discord.js");
                const extFromType = contentType.split("/")[1]?.split(";")[0]?.trim();
                const safeExt = extFromType && /^[a-z0-9.+-]+$/i.test(extFromType) ? extFromType : "png";
                const fileName = `image.${safeExt}`;

                try {
                    await message.channel.send({
                        content: (content || "").toString().slice(0, 1900),
                        files: [new AttachmentBuilder(buffer, { name: fileName })],
                    });
                    return "(Success) Sent image message.";
                } catch (err) {
                    return `(Error) Failed to send image message. ${err?.message || String(err)}`;
                }
            },
            scan_people_inactive_7days: async () => {
                console.log("AI scanned for inactive people (7 days)");
                console.log("[ServerFunction] scan_people_inactive_7days called by", message?.author?.tag || message?.author?.id || "unknown");
                const guild = message.guild ? message.guild : null;
                if (!guild) {
                    return "(Error) Guild is null or unknown :(";
                }
                const executorMember = message.member;
                if (!executorMember) {
                    return "(Error) Could not resolve executor member.";
                }
                if (!executorMember.permissions.has("Administrator")) {
                    return "(Error) Executor does not have permission to use this function";
                }
                const now = Date.now();
                actionsMade += `-# Scanned for inactive members\n`;
                const inactiveMembers = guild.members.cache.filter(m => {
                    if (m.user?.bot) return false;
                    const isOnline = m.presence?.status && m.presence.status !== "offline";
                    if (isOnline) return false;
                    const lastActive = m.lastMessage?.createdTimestamp || 0;
                    return now - lastActive > 7 * 24 * 60 * 60 * 1000; // 7 days
                });
                if (!inactiveMembers.size) {
                    return { count: 0, members: [] };
                }
                const members = inactiveMembers
                    .map(m => ({ id: m.id, tag: m.user.tag, lastActive: m.lastMessage?.createdTimestamp || null }))
                    .sort((a, b) => (a.tag || "").localeCompare(b.tag || ""));
                return { count: inactiveMembers.size, members };
            },
            scan_people_inactive_30days: async () => {
                console.log("AI scanned for inactive people (30 days)");
                console.log("[ServerFunction] scan_people_inactive_30days called by", message?.author?.tag || message?.author?.id || "unknown");
                const guild = message.guild ? message.guild : null;
                if (!guild) {
                    return "(Error) Guild is null or unknown :(";
                }
                const executorMember = message.member;
                if (!executorMember) {
                    return "(Error) Could not resolve executor member.";
                }
                if (!executorMember.permissions.has("Administrator")) {
                    return "(Error) Executor does not have permission to use this function";
                }
                actionsMade += `-# Scanned for inactive members (30 days)\n`;
                const now = Date.now();
                const inactiveMembers = guild.members.cache.filter(m => {
                    if (m.user?.bot) return false;
                    const isOnline = m.presence?.status && m.presence.status !== "offline";
                    if (isOnline) return false;
                    const lastActive = m.lastMessage?.createdTimestamp || 0;
                    return now - lastActive > 30 * 24 * 60 * 60 * 1000; // 30 days
                });
                if (!inactiveMembers.size) {
                    return { count: 0, members: [] };
                }
                const members = inactiveMembers
                    .map(m => ({ id: m.id, tag: m.user.tag, lastActive: m.lastMessage?.createdTimestamp || null }))
                    .sort((a, b) => (a.tag || "").localeCompare(b.tag || ""));
                return { count: inactiveMembers.size, members };
            }
        };

        const tools = [
            {
                type: "function",
                name: "do_nothing",
                description: "Example server-side function that does nothing. Returns a short status string ('ok').",
                strict: true,
                parameters: {
                    type: "object",
                    properties: {},
                    required: [],
                    additionalProperties: false,
                },
            },
            {
                type: "function",
                name: "read_server_code_lines",
                description: "Read a specific range of lines from one of the bot's own source files. Available to anyone. Returns the requested lines, each prefixed with its 1-based line number, so you can copy an exact snippet for edit_server_code. Use this for large files where read_server_code would truncate. Path is relative to the project root; secrets and internals (.env, .git, node_modules) are not readable. Returns at most 400 lines per call.",
                strict: true,
                parameters: {
                    type: "object",
                    properties: {
                        filePath: { type: "string", description: "Path to the file to read, relative to the project root (e.g. 'index.js')" },
                        startLine: { type: "number", description: "First line to read (1-based, inclusive)" },
                        endLine: { type: "number", description: "Last line to read (1-based, inclusive). Must be >= startLine." },
                    },
                    required: ["filePath", "startLine", "endLine"],
                    additionalProperties: false,
                },
            },
            {
                type: "function",
                name: "list_server_files",
                description: "List every file in the app (the project), recursively, as paths relative to the project root. Available to anyone. The dependency and version-control folders (node_modules, .git) are excluded since they aren't part of the app. Use this to discover what files exist before reading or editing them.",
                strict: true,
                parameters: {
                    type: "object",
                    properties: {},
                    required: [],
                    additionalProperties: false,
                },
            },
            {
                type: "function",
                name: "edit_server_code",
                description: "Propose an edit to the bot's own source code. Anyone can propose, but the edit is NOT applied immediately: the bot owner receives a DM with a diff preview and Yes/No buttons, and the change is only written to disk if they accept. Read the file first with read_server_code so oldString is an exact, unique snippet. To create a new file or append, pass an empty oldString and put the content in newString.",
                strict: true,
                parameters: {
                    type: "object",
                    properties: {
                        filePath: { type: "string", description: "Path to the file to edit, relative to the project root (e.g. 'index.js')" },
                        oldString: { type: "string", description: "Exact, unique snippet of existing text to replace. Use an empty string to create a new file or append to an existing one." },
                        newString: { type: "string", description: "The replacement text (or the new/appended content when oldString is empty)." },
                    },
                    required: ["filePath", "oldString", "newString"],
                    additionalProperties: false,
                },
            },
            {
                type: "function",
                name: "git_sync",
                description: "Manually trigger a git sync now (the bot also does this automatically every minute). Owner-only. Commits any local changes, pulls/merges remote changes, and pushes to GitHub. If new remote code is merged in, the bot restarts to run the latest version.",
                strict: true,
                parameters: {
                    type: "object",
                    properties: {},
                    required: [],
                    additionalProperties: false,
                },
            },
            {
                type: "function",
                name: "dm_member",
                description: "Sends a private DM to a user (admin-only).",
                strict: true,
                parameters: {
                    type: "object",
                    properties: {
                        targetUserID: { type: "string", description: "User ID of the person to DM" },
                        content: { type: "string", description: "Message content to send (plain text)" },
                    },
                    required: [
                        "targetUserID",
                        "content"
                    ],
                    additionalProperties: false,
                },
            },
            {
                type: "function",
                name: "ban_member",
                description: "Bans a member.",
                strict: true,
                parameters: {
                    type: "object",
                    properties: {
                        targetUserID: { type: "string", description: "User ID of the person to ban" },
                        reason: { type: "string", description: "Reason for banning the member (can be an empty string)" }
                    },
                    required: [
                        "targetUserID",
                        "reason"
                    ],
                    additionalProperties: false,
                },
            },
            {
                type: "function",
                name: "package",
                description: "Returns information about the app that you run on",
                strict: true,
                parameters: {
                    type: "object",
                    properties: {},
                    required: [],
                    additionalProperties: false,
                },
            },
            {
                type: "function",
                name: "view_user_info",
                description: "Returns information about a user that you specify",
                strict: true,
                parameters: {
                    type: "object",
                    properties: {
                        id: { type: "string", description: "User ID of the person to look up (If the user provides <@...>, the user id is \"...\"" },
                    },
                    required: [
                        "id"
                    ],
                    additionalProperties: false,
                },
            },
            {
                type: "function",
                name: "kick_member",
                description: "Kicks a user from the server",
                strict: true,
                parameters: {
                    type: "object",
                    properties: {
                        targetUserID: { type: "string", description: "User ID of the person to kick" },
                        reason: { type: "string", description: "Why the person is getting kicked" },
                    },
                    required: [
                        "targetUserID",
                        "reason"
                    ],
                    additionalProperties: false,
                },
            },
            {
                type: "function",
                name: "timeout_member",
                description: "Times out a member (temporarily prevents them from chatting). Admin-only.",
                strict: true,
                parameters: {
                    type: "object",
                    properties: {
                        targetUserID: { type: "string", description: "User ID of the person to timeout" },
                        durationSeconds: { type: "number", description: "Timeout duration in seconds. Use 0 to remove timeout. Max is 2419200 (28 days)." },
                        reason: { type: "string", description: "Reason for the timeout (can be empty)" },
                    },
                    required: ["targetUserID", "durationSeconds", "reason"],
                    additionalProperties: false,
                },
            },
            {
                type: "function",
                name: "send_image_message",
                description: "Sends a message with an attached image (fetched from an http(s) URL). Admin-only.",
                strict: true,
                parameters: {
                    type: "object",
                    properties: {
                        imageUrl: { type: "string", description: "Direct http(s) URL to an image" },
                        content: { type: "string", description: "Optional message text to send with the image" },
                    },
                    required: ["imageUrl", "content"],
                    additionalProperties: false,
                },
            },
            {
                type: "function",
                name: "scan_people_inactive_7days",
                description: "Scans for people who have been inactive for 7 days. Admin-only.",
                strict: true,
                parameters: {
                    type: "object",
                    properties: {},
                    required: [],
                    additionalProperties: false,
                },
            },
            {
                type: "function",
                name: "scan_people_inactive_30days",
                description: "Scans for people who have been inactive for 30 days. Admin-only.",
                strict: true,
                parameters: {
                    type: "object",
                    properties: {},
                    required: [],
                    additionalProperties: false,
                },
            }
        ];

        history.push({
            role: 'system',
            content: "Please dont say exactly what the function names are. instead just summarize what it does if the user asks you what you can do."
        });

        // ====== OPENAI REQUEST ======
        // Shared request options so every round (initial + every tool follow-up) uses the
        // same prompt version, tools and settings.
        const baseRequest = {
            prompt: {
                "id": process.env.OPENAI_ASSISTANT_ID,
                "version": "25"
            },
            tools: tools,
            text: {
                "format": {
                    "type": "text"
                }
            },
            reasoning: {},
            max_output_tokens: 2048,
            store: true,
            include: ["web_search_call.action.sources"]
        };

        let response = await openai.responses.create({ ...baseRequest, input: history });

        // ====== EXECUTE TOOL CALLS (LOOP UNTIL THE MODEL STOPS REQUESTING TOOLS) ======
        // The model often needs several sequential rounds (e.g. list files -> read lines ->
        // edit). A single pass would only run the first round and then ignore later tool
        // calls, so we keep feeding tool outputs back until it returns a final text answer.
        const MAX_TOOL_ROUNDS = 8;
        const conversation = [...history];

        for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
            if (!Array.isArray(response.output)) { break; }

            let executedAnyTool = false;

            for (const item of response.output) {
                if (item?.type === "reasoning") {
                    conversation.push(item);
                    continue;
                }

                if (item?.type !== "function_call") { continue; }
                executedAnyTool = true;

                // IMPORTANT: include the function_call item itself in the next request,
                // otherwise the API will reject the corresponding function_call_output.
                conversation.push(item);

                const handler = serverFunctionHandlers[item.name];
                let output;
                let args = {};
                try { args = item.arguments ? JSON.parse(item.arguments) : {}; } catch { args = {}; }
                const caller = message?.author?.tag || message?.author?.id || "unknown";
                if (!handler) {
                    console.log(`[ServerFunction][CALL] Unknown function requested: ${item.name} by ${caller} args:`, args);
                    output = JSON.stringify({ ok: false, error: `Unknown function: ${item.name}` });
                } else {
                    console.log(`[ServerFunction][CALL] ${item.name} invoked by ${caller} (round ${round + 1}) args:`, args);
                    const start = Date.now();
                    try {
                        output = await handler(args, { message });
                        try {
                            console.log(`[ServerFunction][RESULT] ${item.name} completed by ${caller} in ${Date.now() - start}ms result:`, output);
                        } catch (e) {
                            console.log(`[ServerFunction][RESULT] ${item.name} completed by ${caller} in ${Date.now() - start}ms (unserializable result)`);
                        }
                    } catch (err) {
                        console.log(`[ServerFunction][ERROR] ${item.name} threw after ${Date.now() - start}ms:`, err);
                        output = JSON.stringify({ ok: false, error: err?.message || String(err) });
                    }
                }

                // Allow handlers to `return "something"` (or any JSON-serializable value).
                let toolOutput = output;
                if (toolOutput === undefined) { toolOutput = ""; }
                if (typeof toolOutput !== "string") {
                    try {
                        toolOutput = JSON.stringify(toolOutput);
                    } catch {
                        toolOutput = String(toolOutput);
                    }
                }

                conversation.push({
                    type: "function_call_output",
                    call_id: item.call_id,
                    output: toolOutput,
                });
            }

            // No tools this round means the model produced its final answer — we're done.
            if (!executedAnyTool) { break; }

            if (round === MAX_TOOL_ROUNDS - 1) {
                console.warn(`[ServerFunction] Hit MAX_TOOL_ROUNDS (${MAX_TOOL_ROUNDS}); stopping the tool loop.`);
            }

            // Feed the tool outputs back so the model can decide its next step (or answer).
            response = await openai.responses.create({ ...baseRequest, input: conversation });
        }

        // ====== EXTRACT REPLY ======
        let replyText = "";

        if (Array.isArray(response.output)) {
            replyText = response.output
                .map(o =>
                    Array.isArray(o.content)
                        ? o.content.map(c => c?.text || "").join("")
                        : o.text || ""
                )
                .join("\n")
                .trim();
        }

        replyText = replyText || response.output_text || "";

        replyText = replyText
            .replace(`<@!${client.user.id}>`, "@Horror Rebot")
            .replace(`<@${client.user.id}>`, "@Horror Rebot")
            .replace(/<@!?\d+>/g, "@...")
            .replace(/<@&\d+>/g, "@...")
            .replace(/<#\d+>/g, "@...")
            .replace(/\s{2,}/g, " ")
            .trim();

        replyText = `${actionsMade}${replyText}`;
        if (actionsMade === "") { replyText = response.output_text; }

        if (!replyText) {
            return message.reply("Sorry, I couldn't get a response.");
        }

        // ====== SAVE ASSISTANT MESSAGE ======
        history.push({
            role: "assistant",
            content: replyText
        });

        // ====== SEND TEXT ======
        await message.reply(replyText);

        // ===== JOIN VOICE CHANNEL FOR TTS REPLY IF USER IS IN VOICE =====
        try {
            const memberVoiceChannel = member?.voice?.channel;
            if (memberVoiceChannel) {
                if (!configl.basics.vc.enabled) { return; }
                const connection = joinVoiceChannel({
                    channelId: memberVoiceChannel.id,
                    guildId: memberVoiceChannel.guild.id,
                    adapterCreator: memberVoiceChannel.guild.voiceAdapterCreator,
                    selfDeaf: false, // stay undeafened so the wake-word assistant can hear follow-ups
                });

                // Keep listening for the wake word so the user can continue talking by voice.
                if (configl.chatgptintegration.enabled) {
                    try { startVoiceAssistant(connection, memberVoiceChannel, message.channel); }
                    catch (e) { console.error("[VoiceChat] Failed to start assistant:", e?.message || e); }
                }

                const audioBuffer = await speakText(sanitizeForTTS(replyText));
                const { Readable } = require("stream");
                const audioStream = new Readable({
                    read() {
                        this.push(audioBuffer);
                        this.push(null);
                    }
                });

                const player = createAudioPlayer();
                const resource = createAudioResource(audioStream, { inputType: StreamType.Arbitrary });

                player.play(resource);
                connection.subscribe(player);

                player.on(AudioPlayerStatus.Idle, () => {
                    setTimeout(() => {
                        destroyVoiceConnectionIfNotSpeaking(memberVoiceChannel.guild.id, player);
                    }, 30000);
                });
            } else {
                if (!message.guild) { return; }
                return; // voice is disabled until further notice
                const connection = getVoiceConnection(message.guild.id);
                if (connection) {
                    connection.destroy();
                }
            }
        } catch (err) {
            console.error("TTS playback failed:", err);
            newIssue(`A TTS playback error occurred at ${new Date().toISOString()}.`);
        }
}

// occurs when this member's roles or nickname are updated

client.on("guildMemberUpdate", async (oldMember, newMember) => {
    checkServerTagViolation(newMember);

    // check roles
    try {
        if (oldMember.user.bot || newMember.user.bot) { return; } // skip bots

        const oldRoleIds = new Set(oldMember.roles.cache.map(r => r.id));
        const newRoleIds = new Set(newMember.roles.cache.map(r => r.id));

        // Constants for required roles
        const ROLE_A = "1445133130917871788";
        const ROLE_B = "1445133175499264092";
        const ROLE_C = "1474571900595212421"; // new underage role id
        const generalChannelId = "1333194010856128567";
        const missingKey = `${newMember.guild.id}-${newMember.id}-missing-roles`;

        // If user does not have either required role, warn them and schedule a kick in 2 minutes.
        // Run this check BEFORE the early return so it triggers even when roles didn't change.
        if (!newMember.roles.cache.has(ROLE_A) && !newMember.roles.cache.has(ROLE_B)) {
            // Only schedule one timeout per user
            if (!timeoutQueue.has(missingKey)) {
                try {
                    const general = client.channels.cache.get(generalChannelId);
                    const mentionMsg = `${newMember}, you do not have the required roles "Adult" or "Minor". Please obtain one within 2 minutes or you will be kicked.`;
                    if (general && typeof general.send === "function") {
                        await general.send(mentionMsg);
                    } else if (newMember.guild.systemChannel) {
                        // fallback to system channel
                        await newMember.guild.systemChannel.send(mentionMsg);
                    }
                    if (modlog) {
                        await modlog(`Warned ${newMember.user.username} for missing required roles.`);
                    }
                } catch (err) {
                    console.error(`Failed to send missing-role warning to ${newMember.user.username}:`, err);
                    newIssue(`Missing role warning failed for ${newMember.user.username} at ${new Date().toISOString()}.`);
                }

                const timer = setTimeout(async () => {
                    try {
                        const refreshed = await newMember.guild.members.fetch(newMember.id);
                        if (!refreshed.roles.cache.has(ROLE_A) && !refreshed.roles.cache.has(ROLE_B)) {
                            if (!refreshed.kickable) {
                                console.log(`Cannot kick ${refreshed.user.username}: missing permissions or role hierarchy prevents kicking.`);
                                newIssue(`A scheduled kick failed for ${refreshed.user.username} at ${new Date().toISOString()} due to insufficient permissions.`);
                                if (modlog) {
                                    await modlog(`Could not kick ${refreshed.user.username} for missing roles (insufficient permissions).`);
                                }
                            } else {
                                await refreshed.kick("Missing required roles after warning period");
                                console.log(`Kicked ${refreshed.user.username} for missing required roles.`);
                                if (modlog) {
                                    await modlog(`Kicked ${refreshed.user.username} for missing required roles.`);
                                }
                            }
                        } else {
                            // User obtained role in the interim
                            try {
                                const general = client.channels.cache.get(generalChannelId);
                                if (general && typeof general.send === "function") {
                                    await general.send(`${refreshed} obtained the required role(s); no kick performed.`);
                                }
                            } catch (err) {
                                // ignore
                            }
                        }
                    } catch (err) {
                        console.error("Scheduled kick failed:", err);
                        newIssue(`A scheduled kick failed for ${newMember.user.username} at ${new Date().toISOString()}. Check the server console for details.`);
                    } finally {
                        timeoutQueue.delete(missingKey);
                    }
                }, 2 * 60 * 1000); // 2 minutes

                timeoutQueue.set(missingKey, timer);
            }
        }

        // If roles didn't change, nothing further to do (role-missing check already handled above)
        if (oldRoleIds.size === newRoleIds.size && [...oldRoleIds].every(id => newRoleIds.has(id))) {
            return;
        }

        const addedRoles = newMember.roles.cache.filter(r => !oldRoleIds.has(r.id));
        const removedRoles = oldMember.roles.cache.filter(r => !newRoleIds.has(r.id));

        if (addedRoles.size > 0) {
            const addedNames = addedRoles.map(r => r.name).join(", ");
            console.log(`Roles added to ${newMember.user.username}: ${addedNames}`);
            if (modlog) {
                await modlog(`Roles added to ${newMember.user.username}: ${addedNames}`);
            }

            // If a disallowed role was added, take action
            for (const role of addedRoles.values()) {
                // If they gained one of the required roles, clear any pending kick
                if (role.id === ROLE_A || role.id === ROLE_B) {
                    const key = `${newMember.guild.id}-${newMember.id}-missing-roles`;
                    if (timeoutQueue.has(key)) {
                        clearTimeout(timeoutQueue.get(key));
                        timeoutQueue.delete(key);
                        try {
                            const general = client.channels.cache.get(generalChannelId);
                            if (general && typeof general.send === "function") {
                                await modlog(`${newMember} has obtained a required role; scheduled kick cancelled.`);
                            }
                            if (modlog) {
                                await modlog(`Cancelled scheduled kick for ${newMember.user.username} (role obtained).`);
                            }
                        } catch (err) {
                            // ignore
                        }
                    }
                }

                if ((role.id === "1435362807427240087") || (role.name || "").toLowerCase() === "a bot") {
                    if (!newMember.kickable) {
                        console.log(`Cannot kick ${newMember.user.username}: missing permissions or role hierarchy prevents kicking.`);
                        continue;
                    }
                    try { await newMember.send("You have been removed from the server because you were given the disallowed role: 'a bot'.").catch(() => { }); } catch { }
                    try {
                        await newMember.kick("Removed for being granted disallowed role 'a bot'");
                        console.log(`Kicked ${newMember.user.username} for being granted role 'a bot'.`);
                        if (modlog) {
                            await modlog(`Kicked ${newMember.user.username} for being granted role 'a bot'.`);
                        }
                    } catch (err) {
                        console.error(`Failed to kick ${newMember.user.username}:`, err);
                    }
                }
                if ((role.id === ROLE_C)) {
                    // underage role, immediate ban
                    if (!newMember.bannable) {
                        console.log(`Cannot ban ${newMember.user.username}: missing permissions or role hierarchy prevents banning.`);
                        newIssue(`An error occurred while trying to ban underage user ${newMember.user.username} at ${new Date().toISOString()} because the user is a mod/admin. Please remove them manually.`);
                        continue;
                    }
                    try {
                        await newMember.send("You have been banned for being underage (-13). Being underage is against the Discord Terms of Service.").catch(() => { });
                    }
                    catch (err) {
                        console.error(`Failed to send underage ban message to ${newMember.user.username}:`, err);
                    }
                    try {
                        await newMember.ban({ reason: "Underage (-13)" });
                        console.log(`Banned ${newMember.user.username} for being underage.`);
                        modlog(`Banned ${newMember.user.username} for being underage (-13).`);
                    } catch (err) {
                        console.error(`Failed to ban ${newMember.user.username}:`, err);
                        newIssue(`Failed to ban underage user ${newMember.user.username} at ${new Date().toISOString()}. Check the server console for details.`);
                    }
                }
                if ((role.id === "1445133175499264092")) {
                    // adults role, warn 18+ to be careful with minors
                    try {
                        const general = client.channels.cache.get("1333194010856128567"); // general channel
                        await general.send(`${newMember}, you have been granted the Adults role, showing you are over 18. Please be careful with minors because most people are under 18, including the owner himself. Thank you!`);
                    } catch (err) {
                        console.error(`Failed to send Adults role warning for ${newMember.user.username}:`, err);
                    }
                }
            }
        }

        if (removedRoles.size > 0) {
            const removedNames = removedRoles.map(r => r.name).join(", ");
            console.log(`Roles removed from ${newMember.user.username}: ${removedNames}`);
            if (modlog) {
                await modlog(`Roles removed from ${newMember.user.username}: ${removedNames}`);
            }
        }
    } catch (err) {
        console.error("Error checking member roles:", err);
    }
});

client.on("messageCreate", async (message) => {
    if (message.author.bot) { return; } // Ignore bot messages

    // image filter
    if (message.attachments.size > 0 || message.content.match(/https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|bmp|webp)$/i) || message.content.match(/https?:\/\/[^\s]+/i)) {
        for (const attachment of message.attachments.values()) {
            if (attachment.contentType.startsWith("image/") || attachment.url.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i)) {
                try {
                    if (!message.guild) { return; } // only check images in guilds, not DMs
                    if (!configl.chatgptintegration.aimoderation.enabled) { return; }

                    const openai = new OpenAI({
                        apiKey: process.env.OPENAI_API_KEY,
                    });

                    const response = await openai.chat.completions.create({
                        model: "gpt-4.1-mini",
                        messages: [
                            {
                                role: "system",
                                content: "You are a helpful assistant that checks if images contain innapropiate content for a family friendly Gorilla Tag server. If the image contains innapropiate content, respond with 'INNAPROPIATE_CONTENT'. Otherwise, respond with 'CLEAN'. Only respond with one of those two options and nothing else."
                            },
                            {
                                role: "user",
                                content: [
                                    {
                                        type: "text",
                                        text: "Check this image for innapropiate content. The image is an attachment in a Discord message. Only respond with 'INNAPROPIATE_CONTENT' if the image contains innapropiate content for a family friendly Gorilla Tag server, otherwise respond with 'CLEAN'."
                                    },
                                    {
                                        type: "image_url",
                                        image_url: {
                                            url: attachment.url
                                        }
                                    }
                                ]
                            }
                        ],
                        max_tokens: 100
                    });
                    const aiReply = response.choices?.[0]?.message?.content || "";
                    console.log(`Checked image attachment from ${message.author.username}, AI response: ${aiReply}`);
                    if (aiReply.includes("INNAPROPIATE_CONTENT")) {
                        // create an offender count for this user and increment it, if it reaches 3, ban them for 1 day. Warn them each time with a DM that they have violated the image policy and how many strikes they have.
                        const offenderKey = `${message.author.id}-offender-count`;
                        const offenderCount = parseInt(offenderCounts.get(offenderKey) || "0") + 1;
                        const offenderCounts = new Map();

                        // Clear offender counts after 5 days
                        setInterval(() => {
                            const fiveDaysMs = 5 * 24 * 60 * 60 * 1000;
                            const now = Date.now();

                            for (const [key, value] of offenderCounts.entries()) {
                                if (value.timestamp && now - value.timestamp > fiveDaysMs) {
                                    offenderCounts.delete(key);
                                    console.log(`Cleared offender count for ${key}`);
                                }
                            }
                        }, 60 * 60 * 1000); // Check every hour

                        c;
                        offenderCounts.set(offenderKey, offenderCount);

                        if (offenderCount === 1) {
                            try {
                                await message.author.send(`<@${message.author.id}> \n### Your image attachment in ${message.guild.name} was found to contain innapropiate content. This is strike ${offenderCount}/3. If you reach 3 strikes, you will be banned. Please adhere to the server rules and keep content appropriate. Thank you!`).catch(() => { });
                            } catch (err) {
                                console.error(`Failed to send innapropiate content warning to ${message.author.username}:`, err);
                            }
                        }

                        if (offenderCount === 2) {
                            try {
                                const member = await message.guild.members.fetch(message.author.id);
                                if (!member.kickable) {
                                    console.warn(`Cannot kick ${message.author.username} for repeated innapropiate content: missing permissions or role hierarchy prevents kicking.`);
                                    newIssue(`An error occurred while trying to kick repeat offender ${message.author.username} at ${new Date().toISOString()} because the user is a mod/admin. Please remove them manually if they reach 3 strikes.`);
                                } else {
                                    await member.send(`<@${message.author.id}> \n### This is your second strike for innapropiate content in image attachments in ${message.guild.name}. If you receive one more strike, you will be banned. Please adhere to the server rules and keep content appropriate. Thank you!`).catch(() => { });
                                    await member.kick("Repeated innapropiate content in image attachments (2 strikes)");
                                    console.log(`Kicked ${message.author.username} for repeated innapropiate content in image attachments (2 strikes).`);
                                    if (modlog) {
                                        await modlog(`Kicked ${message.author.username} for repeated innapropiate content in image attachments (2 strikes).`);
                                    }
                                }
                            } catch (err) {
                                console.error(`Failed to kick ${message.author.username} for repeated innapropiate content:`, err);
                            }
                        }

                        if (offenderCount >= 3) {
                            try {
                                const member = await message.guild.members.fetch(message.author.id);
                                if (!member.bannable) {
                                    console.warn(`Cannot ban ${message.author.username} for repeated innapropiate content: missing permissions or role hierarchy prevents banning.`);
                                    newIssue(`An error occurred while trying to ban repeat offender ${message.author.username} at ${new Date().toISOString()} because the user is a mod/admin. Please remove them manually.`);
                                } else {
                                    await member.send(`<@${message.author.id}> \n### This is your third and final strike for innapropiate content in image attachments in ${message.guild.name}. YOU HAVE BEEN BANNED PERMANENTLY. Please adhere to the server rules and keep content appropriate. Otherwise if you think this is a mistake, please email staff@julergt.org to request an appeal. Thank you!`).catch(() => { });
                                    await member.ban({ reason: "Repeated innapropiate content in image attachments" });
                                    console.log(`Banned ${message.author.username} for repeated innapropiate content in image attachments.`);
                                    if (modlog) {
                                        await modlog(`Banned ${message.author.username} for repeated innapropiate content in image attachments.`);
                                    }
                                }
                            } catch (err) {
                                console.error(`Failed to ban ${message.author.username} for repeated innapropiate content:`, err);
                            }
                        }
                    } else {
                        modlog(`Checked image attachment from ${message.author.username} - no issues found.`);
                        console.log(`Checked image attachment from ${message.author.username} - no issues found.`);
                    }
                } catch (error) {
                    console.error(`Error checking image attachment from ${message.author.username}:`, error);
                }
            }
        }
    }
});

const timeoutQueue = new Map();
/**
 * 
 * @param {GuildMember} member 
 * @returns {OK} Returns OK if a violation was found and the user was warned, otherwise returns undefined
 */
async function checkServerTagViolation(member) {
    for (const [serverId, category] of Object.entries(blacklistedTags)) {
        const inNickname = member.nickname?.includes(serverId);
        const inRoles = member.roles.cache.some(role => role.name.includes(serverId));

        if (inNickname || inRoles) {
            const key = `${member.guild.id}-${member.id}-${serverId}`;
            if (warnedUsers.has(key)) { return; }

            try {
                await member.send(
                    `Hey! Your server tag is violating category: “${category}”. ` +
                    `Please change your server tag or expect a server timeout for 1 hour in 5 minutes.`
                );
                warnedUsers.add(key);
                console.log(`Warned ${member.user.username} for tag "${serverId}"`);
                return OK;
            } catch (err) {
                console.warn(`Could not DM ${member.user.username}: ${err.message}`);
            }
        }
    }
}
const fetch = require("node-fetch");

/**
 * 
 * @param {GuildMember} user User to save the avatar of
 */
async function saveAvatar(user) {

    const avatarURL = user.displayAvatarURL({ size: 1024, extension: "png" });

    const response = await fetch(avatarURL);
    const buffer = await response.buffer();

    if (!fs.existsSync("./cache/avatars")) { fs.mkdirSync("./cache/avatars", { recursive: true }); }
    fs.writeFileSync(`./cache/avatars/${user.username}.png`, buffer);

}

const ballGifTenor = [
    "https://tenor.com/view/maxeff-who-dropped-the-ball-gif-7728732350967487396",
    "https://tenor.com/view/bouncing-blue-ball-boy-gif-12378937218633738106",
    "https://tenor.com/view/basketball-activity-joypixels-ball-orange-ball-gif-17197142",
    "https://tenor.com/view/pepeballs-gif-7861594524755615584",
];

const { property, get, set, max } = require("lodash");
const { GuildMember } = require("discord.js");
const { play } = require("@elevenlabs/elevenlabs-js");
const { audio } = require("@elevenlabs/elevenlabs-js/api/resources/dubbing/index.js");
const { config } = require("dotenv");
const { number, unknown } = require("@elevenlabs/elevenlabs-js/core/schemas/index.js");
const { OK } = require("sqlite3");
const { ConversationTokenPurpose } = require("@elevenlabs/elevenlabs-js/api/index.js");
const { encode } = require("punycode");
const { Stream } = require("@elevenlabs/elevenlabs-js/core/index.js");
const e = require("express");
const { json } = require("stream/consumers");




// only for autocomplete interactions

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isAutocomplete()) { return; }

    if (interaction.commandName === "joinvoice") {
        const focusedValue = interaction.options.getFocused(); // what user typed
        const resourcesFolder = path.join(__dirname, "resources");
        let files = [];

        try {
            files = fs.readdirSync(resourcesFolder).filter(f =>
                f.endsWith(".mp3") || f.endsWith(".wav") || f.endsWith(".ogg") || f.endsWith(".m4a") || f.endsWith(".flac") || f.endsWith(".aac") || f.endsWith(".mp4")
            );
        } catch (err) {
            console.error("Failed to read resources folder", err);
        }

        const filtered = files.filter(file =>
            file.toLowerCase().includes(focusedValue.toLowerCase())
        );

        // Map to { name, value } pairs for Discord
        const choices = filtered.slice(0, 25).map(file => ({ name: file, value: file }));

        // Must respond to autocomplete
        await interaction.respond(choices).catch(err => {
            console.error("Autocomplete respond error:", err);
        });
    }
});

client.on("messageCreate", async (message) => {
    if (message.author.bot) { return; }
    if (message.content.startsWith("!crash")) {
        if (message.author.id !== "804839205309382676") { return message.react("💔"); }
        throw new Error("Intentional crash triggered by !crash command");
    }
});


// </autocomplete>

const EmbedBuilder = require("discord.js").EmbedBuilder;

const blockedChannels = [
    '1399831432259702836',
    '1339368419325116507'
]

client.on("interactionCreate", async (interaction) => {
    try {
        if (interaction.isCommand()) {
            if (!configl.basics.vc.enabled) {
                if (interaction.commandName.includes("voice") || interaction.commandName.includes("join") || interaction.commandName.includes("openurlstream")) {
                    const embed = new EmbedBuilder()
                        .setTitle("Voice Commands Are Disabled")
                        .setDescription("We apologize for any inconvenience this may cause. If you have any questions or concerns, please contact the server staff.")
                        .setColor(0xFF0000);
                    return interaction.reply({ embeds: [embed] });
                }
            }
            if (interaction.commandName.includes("voice") || interaction.commandName.includes("join") || interaction.commandName.includes("openurlstream")) {
                if (interaction.member.voice.channel && blockedChannels.includes(interaction.member.voice.channel.id)) {
                    return interaction.reply({ ephemeral: true, content: 'Cannot join this channel!' })
                }
            }
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
                    saveAvatar(user); // Cache the avatar
                } else {
                    interaction.reply(
                        interaction.user.displayAvatarURL({
                            size: 1024,
                            dynamic: true,
                            format: "png",
                            ephemeral: true,
                        }),
                    );
                    saveAvatar(interaction.user); // Cache the avatar
                }
            }
            if (interaction.commandName === "randommention") {
                console.log(
                    `Received interaction request for randommention by ${interaction.user.displayName}`,
                );
                await interaction.deferReply();
                const limit = 1000; // Corrected limit for Discord API fetch
                console.time("FetchMembers");
                interaction.guild.members
                    .list({ limit: limit })
                    .then((members) => {
                        console.timeEnd("FetchMembers");
                        console.log(`Fetched ${members.size} members.`);
                        const membersArray = Array.from(members.values());

                        if (membersArray.length > 0) {
                            let randomIndex = Math.floor(
                                Math.random() * membersArray.length,
                            );
                            let randomMember = membersArray[randomIndex];
                            while (randomMember.user.bot || randomMember.user === client.user) {
                                let randomIndex2 = Math.floor(Math.random() * membersArray.length);
                                console.log(`User ${randomMember.user.displayName} is a bot / self, skipping...`);
                                randomMember = membersArray[randomIndex2];
                            }
                            console.log("Bot chose " + randomMember.user.displayName);
                            if (randomMember.user.bot) { return; }
                            saveAvatar(randomMember.user); // Cache the avatar
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
                            interaction.followUp(message);
                        } else {
                            console.log("No members available.");
                            interaction.followUp("Could not find any members to mention.");
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
                await interaction.deferReply();
                const question = interaction.options.getString("question");
                const eightBallResponses = [
                    "Yes",
                    "No",
                    "Maybe",
                    "Ew"
                ];
                const nintendo = ["mario", "luigi", "peach", "yoshi", "toad", "bowser", "wario", "waluigi", "donkey kong", "diddy kong", "link", "zelda", "nintendo", "pokemon", "pikachu", "ash", "misty", "brock", "squirtle", "charmander", "bulbasaur", "meowth", "psyduck", "jigglypuff", "snorlax", "mewtwo", "mew"];
                const mdpSlop = ["max", "jimmy", "maxwell", "angus", "nugget"];
                const bimo = ["bimo"];
                const brainrotWords = ["lankybox", "goodboy", "good boy", "cocomelon", "skibidi"];
                const response =
                    eightBallResponses[
                    Math.floor(Math.random() * eightBallResponses.length)
                    ];
                console.log(
                    "Recieved interaction request for 8ball by " + interaction.user.displayName,
                );
                console.log("The 8 ball says " + response);
                // overlay a text over the error image and send it
                // if the question contains a nintendo character, send an error image
                const nintendoWordInAnswer = nintendo.find(word => question.toLowerCase().includes(word));
                const mdpInAnswer = mdpSlop.find(word => question.toLowerCase().includes(word));
                const bimoInAnswer = bimo.find(word => question.toLowerCase().includes(word));
                const brainrotInAnswer = brainrotWords.find(word => question.toLowerCase().includes(word));
                if (nintendo.some(v => question.toLowerCase().includes(v))) { await interaction.followUp({ content: `error 400: ${nintendoWordInAnswer} detected in question. try removing that from your question.` }); return; }
                if (mdpSlop.some(v => question.toLowerCase().includes(v))) { interaction.followUp({ content: `error 400: ${mdpInAnswer} detected in question. max design pro (or any brainrot slop) is not supported. please dont associate with that.` }); return; }
                if (bimo.some(v => question.toLowerCase().includes(v))) { interaction.followUp({ content: `error 400: ${bimoInAnswer} detected in question. bimo (or any ai slop) is not supported. please dont associate with that.` }); return; }
                if (brainrotWords.some(v => question.toLowerCase().includes(v))) { interaction.followUp({ content: `error 400: ${brainrotInAnswer} detected in question. brainrot is not supported in 8ball. remove that from your answer.` }); return; }
                await interaction.followUp(interaction.user.displayName + " asked: " + question + "\nThe 8 ball said: " + response);

            }
            if (interaction.commandName === "tenor") {
                console.log("Recieved interaction request for tenor by " + interaction.user.displayName);
                const tenorQuery = interaction.options.getString("query");
                const cmdTenorGifs = `https://api.giphy.com/v1/gifs/search?q=${encodeURIComponent(tenorQuery)}&api_key=d9QYYYi1hWCbAy3tJr4sBklSlvQXfmBV&limit=8`; //exposed here for now
                try {
                    const response = await fetch(cmdTenorGifs);
                    const data = await response.json();

                    if (data.data && data.data.length > 0) {
                        const randomIndex = Math.floor(Math.random() * data.data.length);
                        const randomGif = data.data[randomIndex].images.original.url;
                        console.log("Bot chose " + randomGif + " for " + interaction.user.displayName + ", sending...");
                        interaction.reply(randomGif);
                    } else {
                        interaction.reply("No GIFs found for that query.");
                    }
                } catch (error) {
                    console.error("Error fetching GIF:", error);
                    interaction.reply("Failed to fetch GIF. Please try again later.");
                }
            }
            if (interaction.commandName === "base64encode") {
                console.log("Recieved interaction request for base64encode by " + interaction.user.displayName);
                const wordToEncode = interaction.options.getString("input");
                const encoded = Buffer.from(wordToEncode, "utf-8").toString("base64");
                interaction.reply(`${encoded}`);
            }
            if (interaction.commandName === "base64decode") {
                console.log("Recieved interaction request for base64encode by " + interaction.user.displayName);
                const wordToEncode = interaction.options.getString("input");
                const decoded = Buffer.from(wordToEncode, "base64").toString("utf-8");
                interaction.reply(`${decoded}`);
            }
            if (interaction.commandName === "broadcast") {
                console.log(
                    `Recieved interaction request for broadcast by ${interaction.user.displayName}`,
                );
                if (!interaction.guild) {
                    return interaction.reply({
                        content: "This command can only be used in a server.",
                        ephemeral: true,
                    });
                }
                if (!interaction.member.permissions.has("ADMINISTRATOR")) {
                    return interaction.reply({
                        content: "You do not have permission to use this command.",
                        ephemeral: true,
                    });
                }
                const messageToBroadcast = interaction.options.getString("message");
                const limit = 1000;
                // Immediately acknowledge the interaction to avoid timeout
                await interaction.reply({
                    content: "Broadcast started! Sending DMs in the background.",
                    ephemeral: true,
                });
                console.time("FetchMembersForBroadcast");
                interaction.guild.members
                    .list({ limit: limit })
                    .then(async (members) => {
                        console.timeEnd("FetchMembersForBroadcast");
                        console.log(`Fetched ${members.size} members for broadcast.`);
                        let sentCount = 0;
                        for (const member of members.values()) {
                            if (!member.user.bot) {
                                saveAvatar(member.user); // Cache the avatar
                                try {
                                    await member.send(messageToBroadcast);
                                    sentCount++;
                                } catch (err) {
                                    console.log(`Could not send DM to ${member.user.username}: ${err}`);
                                    interaction.followUp({
                                        content: `Could not send DM to ${member.user.username}. They might have DMs disabled.`,
                                        ephemeral: true,
                                    });
                                }
                            }
                        }
                        // Optionally, you can send a follow-up message (not ephemeral)
                        try {
                            await interaction.followUp({
                                content: `Message broadcasted to ${sentCount} members via DM.`,
                                ephemeral: true,
                            });
                        } catch (e) {
                            // Ignore followUp errors (e.g., if interaction expired)
                        }
                    })
                    .catch((error) => {
                        console.error("Failed to fetch members for broadcast:", error);
                        // Try to send a follow-up error message
                        try {
                            interaction.followUp({ content: "Failed to fetch members for broadcast. Please try again later.", ephemeral: true });
                        } catch (e) { }
                    });
            }
            if (interaction.commandName === "broadcast-update") {
                console.log(
                    `Recieved interaction request for broadcast by ${interaction.user.displayName}`,
                );
                if (!interaction.guild) {
                    return interaction.reply({
                        content: "This command can only be used in a server.",
                        ephemeral: true,
                    });
                }
                if (!interaction.member.permissions.has("ADMINISTRATOR")) {
                    return interaction.reply({
                        content: "You do not have permission to use this command.",
                        ephemeral: true,
                    });
                }
                const messageToBroadcast = interaction.options.getString("message");
                const title = interaction.options.getString("title");
                const limit = 1000;
                // Immediately acknowledge the interaction to avoid timeout
                await interaction.reply({
                    content: "Broadcast started! Sending DMs in the background.",
                    ephemeral: true,
                });
                console.time("FetchMembersForBroadcast");
                interaction.guild.members
                    .list({ limit: limit })
                    .then(async (members) => {
                        console.timeEnd("FetchMembersForBroadcast");
                        console.log(`Fetched ${members.size} members for broadcast.`);
                        let sentCount = 0;
                        for (const member of members.values()) {
                            if (!member.user.bot) {
                                try {
                                    saveAvatar(member.user); // Cache the avatar
                                    if (!interaction.options.getAttachment("image")) {
                                        await member.send(`# ${title} \n${messageToBroadcast}`);
                                    }

                                    if (interaction.options.getAttachment("image")) {
                                        const attachment = interaction.options.getAttachment("image");
                                        await member.send({ content: `# ${title} \n${messageToBroadcast}`, files: [attachment] });
                                    }
                                    if (interaction.options.getBoolean("bold")) {
                                        if (!interaction.options.getAttachment("image")) {
                                            await member.send(`# ${title} \n### ${messageToBroadcast}`);
                                        }
                                        if (interaction.options.getAttachment("image")) {
                                            const attachment = interaction.options.getAttachment("image");
                                            await member.send({ content: `# ${title} \n### ${messageToBroadcast}`, files: [attachment] });
                                        }
                                    }
                                    sentCount++;
                                } catch (err) {
                                    console.log(`Could not send DM to ${member.user.username}: ${err}`);
                                    interaction.followUp({
                                        content: `Could not send DM to ${member.user.username}. They might have DMs disabled.`,
                                        ephemeral: true,
                                    });
                                }
                            }
                        }
                        // Optionally, you can send a follow-up message (not ephemeral)
                        try {
                            await interaction.followUp({
                                content: `Message broadcasted to ${sentCount} members via DM.`,
                                ephemeral: true,
                            });
                        } catch (e) {
                            // Ignore followUp errors (e.g., if interaction expired)
                        }
                    })
                    .catch((error) => {
                        console.error("Failed to fetch members for broadcast:", error);
                        // Try to send a follow-up error message
                        try {
                            interaction.followUp({ content: "Failed to fetch members for broadcast. Please try again later.", ephemeral: true });
                        } catch (e) { }
                    });
            }
            if (interaction.commandName === "birthday") {
                console.log(`Recieved interaction request for birthday by ${interaction.user.displayName}`);
                const birthdayDate = interaction.options.getString("date"); // Format: MM-DD
                const isDirectMessage = interaction.options.getBoolean("direct_message");
                const birthYear = interaction.options.getInteger("year") || null;

                if (!/^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/.test(birthdayDate)) {
                    return interaction.reply({
                        content: "Please provide a valid date in MM-DD format.",
                        ephemeral: true,
                    });
                }
                // Load existing birthdays or create a new object
                const birthdaysFile = "birthdays.json";
                let data = { birthdays: {} };
                if (fs.existsSync(birthdaysFile)) {
                    const fileData = fs.readFileSync(birthdaysFile, 'utf-8');
                    data = JSON.parse(fileData);
                }

                const userId = interaction.user.id;
                const existing = data.birthdays[userId];
                const existingDate = existing ? getBirthdayMMDD(existing) : null;
                const existingYear = existing ? getBirthYear(existing) : null;

                // Check if the user already has the exact same birthday + year set
                if (existingDate === birthdayDate && existingYear === birthYear) {
                    return interaction.reply({
                        content: "You already have this birthday set. Please use the command again to update it.",
                        ephemeral: true,
                    });
                }

                // Save the birthday for the user
                data.birthdays[userId] = birthYear ? { date: birthdayDate, year: birthYear } : { date: birthdayDate };
                fs.writeFileSync(birthdaysFile, JSON.stringify(data, null, 2), 'utf-8');
                console.log(`Saved birthday for ${interaction.user.displayName}: ${birthdayDate}${birthYear ? ` (${birthYear})` : ""}`);

                // Tell discord the bot is thinking
                await interaction.deferReply({ ephemeral: true });
                if (isDirectMessage) {
                    try {
                        await interaction.user.send(`Your birthday has been set to ${birthdayDate}${birthYear ? ` (${birthYear})` : ""}.`);
                        interaction.reply({
                            content: "Your birthday has been set successfully! Check your DMs.",
                            ephemeral: true,
                        });
                    } catch (error) {
                        console.error("Failed to send DM:", error);
                        interaction.reply({
                            content: "Your birthday has been set, but I couldn't send you a DM. Please check your privacy settings.",
                            ephemeral: true,
                        });
                    }
                }
                const yearConfirm = birthYear ? " Your age will be included in the birthday message!" : "";
                await interaction.followUp({
                    content: `Your birthday has been set to ${birthdayDate}.${yearConfirm} You will receive a birthday message on your birthday!`,
                    ephemeral: true,
                });

                restart(0);
            }
            if (interaction.commandName === "petpet") {
                const user = interaction.options.getUser("user");
                const petpet = require('./petpet.js');
                const { spawn } = require("child_process");
                const fs = require("fs");

                const path = require("path");

                const avatarURL = user.displayAvatarURL({ size: 128, extension: "png" });
                if (!avatarURL) { return null; }
                else { saveAvatar(user); }
                const options = {
                    resolution: 128,
                    delay: 30,
                    backgroundColor: 'transparent', // Set to transparent for petpet
                };

                await interaction.deferReply();

                const gifBuffer = await petpet(avatarURL, options);
                fs.writeFileSync("./temp/petpet.gif", gifBuffer);

                await interaction.followUp({ files: ["./temp/petpet.gif"] });
            }
            if (interaction.commandName === "saveavatarall") {
                if (interaction.user.id !== "804839205309382676") {
                    return interaction.reply({ content: "You do not have permission to use this command.", ephemeral: true });
                } else {
                    await interaction.deferReply({ ephemeral: true });
                    const limit = 1000; // Corrected limit for Discord API fetch
                    console.time("FetchMembersForAvatarSave");
                    interaction.guild.members
                        .list({ limit: limit })
                        .then(async (members) => {
                            console.timeEnd("FetchMembersForAvatarSave");
                            console.log(`Fetched ${members.size} members for avatar saving.`);
                            let savedCount = 0;
                            for (const member of members.values()) {
                                if (!member.user.bot) {
                                    try {
                                        saveAvatar(member.user); // Cache the avatar
                                        await interaction.followUp({ content: `Saved avatar for ${member.user.username}`, ephemeral: true });
                                        savedCount++;
                                    } catch (err) {
                                        console.log(`Could not save avatar for ${member.user.username}: ${err}`);
                                    }
                                }
                            }
                        })
                        .catch((error) => {
                            console.error("Failed to fetch members for avatar saving:", error);
                            interaction.reply({ content: "Failed to fetch members for avatar saving. Please try again later.", ephemeral: true });
                        });
                }
            }
            if (interaction.commandName === "joinvoice") {
                await interaction.deferReply();
                const voiceChannel = interaction.member.voice.channel;
                if (!voiceChannel) {
                    return interaction.followUp({ content: "You need to be in a voice channel.", ephemeral: true });
                }

                const audioFile = interaction.options.getString("audiofile");
                const filePath = path.join(__dirname, "resources", audioFile);

                if (!fs.existsSync(filePath)) {
                    return interaction.reply({ content: "File not found!", ephemeral: true });
                }

                const connection = joinVoiceChannel({
                    channelId: voiceChannel.id,
                    guildId: voiceChannel.guild.id,
                    adapterCreator: voiceChannel.guild.voiceAdapterCreator,
                });

                if (interaction.member.voice.channel.type === ChannelType.GuildStageVoice) {
                    await entersState(connection, VoiceConnectionStatus.Ready, 30_000);

                    // If this is a Stage channel, request to speak so the bot becomes a speaker
                    try {
                        await fetch(
                            `https://discord.com/api/v10/guilds/${interaction.guild.id}/voice-states/@me`,
                            {
                                method: "PATCH",
                                headers: {
                                    "Authorization": `Bot ${process.env.BOT_TOKEN}`,
                                    "Content-Type": "application/json",
                                },
                                body: JSON.stringify({
                                    suppress: false, // unsuppress = start speaking
                                }),
                            }
                        );
                        console.log("Bot is now speaking on the stage channel.");
                    } catch (err) {
                        console.error("Failed to speak on the stage channel:", err);
                    }

                }

                await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
                await interaction.followUp({ content: `Joined ${voiceChannel.name} and playing ${audioFile}!`, ephemeral: true });

                const player = createAudioPlayer();
                const resource = createAudioResource(filePath, { inputType: StreamType.Arbitrary });

                player.play(resource);
                connection.subscribe(player);

                player.on(AudioPlayerStatus.Idle, () => {
                    destroyVoiceConnectionIfNotSpeaking(interaction.guild.id, player);
                });
            }
            if (interaction.commandName === "uploadaudioresource") {
                if (interaction.user.id !== "804839205309382676") {
                    return interaction.reply({ content: "You do not have permission to use this command.", ephemeral: true });
                } else {
                    await interaction.deferReply({ ephemeral: true });
                    const attachment = interaction.options.getAttachment("audiofile");
                    if (!attachment) {
                        return interaction.followUp({ content: "No audio file provided.", ephemeral: true });
                    }
                    const response = await fetch(attachment.url);
                    const buffer = await response.buffer();
                    const filePath = `./resources/${attachment.name}`;
                    fs.writeFileSync(filePath, buffer);
                    interaction.followUp({ content: `Audio resource ${attachment.name} uploaded successfully!`, ephemeral: true });
                }
            }
            if (interaction.commandName === "openurlstream") {
                console.log(`Recieved interaction request for openurlstream by ${interaction.user.displayName}`);
                await interaction.deferReply();
                const voiceChannel = interaction.member.voice.channel;
                if (!voiceChannel) {
                    return interaction.followUp({ content: "You need to be in a voice channel.", ephemeral: true });
                }

                let url = interaction.options.getString("url");
                if (!url) {
                    return interaction.followUp({ content: "No URL provided!", ephemeral: true });
                }

                // If this is a YouTube URL, try to resolve a direct stream URL via yt-dlp -g
                if (url.includes("youtube.com") || url.includes("youtu.be")) {
                    const resolved = await resolveYouTubeDirectUrl(url);
                    if (!resolved) {
                        return interaction.followUp({ content: "Failed to resolve YouTube URL via yt-dlp.", ephemeral: true });
                    }
                    // overwrite url with the resolved direct media URL for subsequent playback logic
                    url = resolved;
                }

                let connection = getVoiceConnection(interaction.guild.id);
                if (connection) {
                    await entersState(connection, VoiceConnectionStatus.Ready, 30_000);

                    if (interaction.member.voice.channel.type === ChannelType.GuildStageVoice) {
                        await entersState(connection, VoiceConnectionStatus.Ready, 30_000);

                        // If this is a Stage channel, request to speak so the bot becomes a speaker
                        try {
                            await fetch(
                                `https://discord.com/api/v10/guilds/${interaction.guild.id}/voice-states/@me`,
                                {
                                    method: "PATCH",
                                    headers: {
                                        "Authorization": `Bot ${process.env.BOT_TOKEN}`,
                                        "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                        suppress: false, // unsuppress = start speaking
                                    }),
                                }
                            );
                            console.log("Bot is now speaking on the stage channel.");
                        } catch (err) {
                            console.error("Failed to speak on the stage channel:", err);
                        }

                        await entersState(connection, VoiceConnectionStatus.Ready, 30_000);

                        if (url.includes("youtube.com") || url.includes("youtu.be")) {
                            interaction.followUp({ content: "YouTube streaming is not supported.", ephemeral: true });
                            destroyVoiceConnectionIfNotSpeaking(interaction.guild.id);
                            return;
                        }

                        const player = createAudioPlayer();
                        const resource = createAudioResource(url, { filter: "audioonly" }, { inputType: StreamType.Arbitrary });

                        player.play(resource);
                        connection.subscribe(player);

                        player.on(AudioPlayerStatus.Idle, () => {
                            destroyVoiceConnectionIfNotSpeaking(interaction.guild.id, player);
                        });
                    }

                    if (url.includes("youtube.com") || url.includes("youtu.be")) {
                        interaction.followUp({ content: "YouTube streaming is not supported.", ephemeral: true });
                        destroyVoiceConnectionIfNotSpeaking(interaction.guild.id);
                        return;
                    }

                    const player = createAudioPlayer();
                    const resource = createAudioResource(url, { filter: "audioonly" }, { inputType: StreamType.Arbitrary });

                    player.play(resource);
                    connection.subscribe(player);

                    player.on(AudioPlayerStatus.Idle, () => {
                        destroyVoiceConnectionIfNotSpeaking(interaction.guild.id, player);
                    });

                    return interaction.followUp({ content: `Streaming audio from URL in ${voiceChannel.name}!`, ephemeral: true });

                } else {
                    connection = joinVoiceChannel({
                        channelId: voiceChannel.id,
                        guildId: voiceChannel.guild.id,
                        adapterCreator: voiceChannel.guild.voiceAdapterCreator,
                    });

                    await entersState(connection, VoiceConnectionStatus.Ready, 30_000);

                    if (interaction.member.voice.channel.type === ChannelType.GuildStageVoice) {
                        await entersState(connection, VoiceConnectionStatus.Ready, 30_000);

                        // If this is a Stage channel, request to speak so the bot becomes a speaker
                        try {
                            await fetch(
                                `https://discord.com/api/v10/guilds/${interaction.guild.id}/voice-states/@me`,
                                {
                                    method: "PATCH",
                                    headers: {
                                        "Authorization": `Bot ${process.env.BOT_TOKEN}`,
                                        "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                        suppress: false, // unsuppress = start speaking
                                    }),
                                }
                            );
                            console.log("Bot is now speaking on the stage channel.");
                        } catch (err) {
                            console.error("Failed to speak on the stage channel:", err);
                        }

                        await entersState(connection, VoiceConnectionStatus.Ready, 30_000);

                        if (url.includes("youtube.com") || url.includes("youtu.be")) {
                            interaction.followUp({ content: "YouTube streaming is not supported.", ephemeral: true });
                            destroyVoiceConnectionIfNotSpeaking(interaction.guild.id);
                            return;
                        }

                        const player = createAudioPlayer();
                        const resource = createAudioResource(url, { filter: "audioonly" }, { inputType: StreamType.Arbitrary });

                        player.play(resource);
                        connection.subscribe(player);

                        player.on(AudioPlayerStatus.Idle, () => {
                            destroyVoiceConnectionIfNotSpeaking(interaction.guild.id, player);
                        });
                    }

                    if (url.includes("youtube.com") || url.includes("youtu.be")) {
                        interaction.followUp({ content: "YouTube streaming is not supported.", ephemeral: true });
                        destroyVoiceConnectionIfNotSpeaking(interaction.guild.id);
                        return;
                    }

                    const player = createAudioPlayer();
                    const resource = createAudioResource(url, { filter: "audioonly" }, { inputType: StreamType.Arbitrary });

                    player.play(resource);
                    connection.subscribe(player);

                    player.on(AudioPlayerStatus.Idle, () => {
                        destroyVoiceConnectionIfNotSpeaking(interaction.guild.id, player);
                    });

                    return interaction.followUp({ content: `Streaming audio from URL in ${voiceChannel.name}!`, ephemeral: true });
                }
            }
            if (interaction.commandName === "about") {
                console.log("Recieved interaction request for about by " + interaction.user.displayName);
                const fs = require('fs');
                const { execSync } = require('child_process');
                let hostModel = 'Unknown Model';
                try {
                    if (process.platform === 'win32') {
                        const out = execSync('wmic computersystem get model', { encoding: 'utf8' });
                        const lines = out.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
                        // lines[0] is header ("Model"), lines[1] is the model on typical output
                        hostModel = lines[1] || lines[0] || hostModel;
                    } else if (process.platform === 'darwin') {
                        hostModel = execSync('sysctl -n hw.model', { encoding: 'utf8' }).trim() || hostModel;
                    } else {
                        // try reading Linux DMI product name
                        try {
                            hostModel = fs.readFileSync('/sys/devices/virtual/dmi/id/product_name', 'utf8').trim() || hostModel;
                        } catch {
                            // fallback to lshw or unknown
                            try {
                                hostModel = execSync('cat /sys/devices/virtual/dmi/id/product_name', { encoding: 'utf8' }).trim() || hostModel;
                            } catch (err) {
                                // leave hostModel as Unknown Model
                            }
                        }
                    }
                } catch (err) {
                    console.warn('Could not determine host model:', err && err.message ? err.message : err);
                }

                const aboutEmbed = new EmbedBuilder()
                    .setColor(0x858585)
                    .setTitle("About Horror Rebot")
                    .setDescription("Horror Rebot is a multifunctional Discord bot created by JulerGT for the Discord server Horror Remake. It offers a variety of features including fun commands, utility functions, and voice channel interactions.")
                    .addFields(
                        { name: "Creator", value: "JulerGT" },
                        { name: "Library", value: "discord.js v14" },
                        { name: "Hosting", value: hostModel },
                        { name: "Created On", value: client.user.createdAt.toDateString() },
                        { name: "Version", value: package.version },
                        { name: "Uptime", value: `${Math.floor(process.uptime() / 60)} minutes` },
                        { name: "Updated At", value: upDate }
                    )
                    .setFooter({ text: "Thank you for using Horror Rebot!" })
                    .setThumbnail(client.user.displayAvatarURL({ size: 128, extension: "png" }));
                await interaction.reply({ embeds: [aboutEmbed], ephemeral: true });
            }
            if (interaction.commandName === "percentagemembers") {
                console.log("Recieved interaction request for percentagemembers by " + interaction.user.displayName);
                // this command shows the percentage of adults or minors
                const ADULT_ROLE_ID = "1445133175499264092";
                const MINOR_ROLE_ID = "1445133130917871788";

                const guild = interaction.guild;

                // Ensure all members are loaded so role counts are correct
                await guild.members.fetch();

                const adultCount = guild.roles.cache.get(ADULT_ROLE_ID)?.members.size || 0;
                const minorCount = guild.roles.cache.get(MINOR_ROLE_ID)?.members.size || 0;
                const total = adultCount + minorCount;

                if (total === 0) {
                    return interaction.reply({
                        content: "Nobody has those roles… are you sure the IDs are correct?",
                        ephemeral: true
                    });
                }

                const adultPercent = ((adultCount / total) * 100).toFixed(2);
                const minorPercent = ((minorCount / total) * 100).toFixed(2);

                await interaction.reply(
                    `**${adultPercent}%** of the server are adults, while **${minorPercent}%** are minors.\n` +
                    `Total counted: **${total}**`
                );
            }
            if (interaction.commandName === "pfpcheck") {
                console.log("Recieved interaction request for pfpcheck by " + interaction.user.displayName);
                if (interaction.user.id !== "804839205309382676") {
                    return interaction.reply({ content: "You do not have permission to use this command.", ephemeral: true });
                }
                if (!configl.chatgptintegration.aimoderation.enabled) { return interaction.reply({ content: "AI Moderation is disabled in settings. Please enable AI Moderation and try again.", ephemeral: true }); }
                await interaction.deferReply({ ephemeral: true });
                const GUILD_ID = "1333194010201952367";
                const guild = client.guilds.cache.get(GUILD_ID);
                for (const member of guild.members.cache.values()) {
                    if (member.user.bot) { continue; } // skip bots
                    if (guild.ownerId === member.id) { continue; } // skip server owner
                    try {
                        const openai = new OpenAI({
                            apiKey: process.env.OPENAI_API_KEY,
                        });
                        const avatarUrl = member.user.displayAvatarURL({ format: "png", size: 1024 });

                        // create a response using a system prompt and a user prompt to ask the ai to describe the pfp
                        const response = await openai.chat.completions.create({
                            model: "gpt-4.1-mini",
                            messages: [
                                {
                                    role: "system",
                                    content: "You are a helpful assistant that describes Discord profile pictures. Please note the server's name is 'Horror Remake'."
                                },
                                {
                                    role: "user",
                                    content: [
                                        {
                                            type: "text",
                                            text: "If this profile picture contains a Gorilla Tag character with unnatural long arms (cheating), respond with 'GTAG_CHAR_LONG_ARMS'. Otherwise, respond with 'NO_MATCH'. It must be an in game screenshot. Not fan art. Neither a fan game. NOR Blender Art. Blender art is realistic gorilla tag profile pictures. In game screenshots have a glowing Gorilla Tag character. OR if it contains innapropiate content, respond with 'INNAPROPIATE_CONTENT'. Only respond with one of those three options and nothing else."
                                        },
                                        {
                                            type: "image_url",
                                            image_url: {
                                                url: avatarUrl
                                            }
                                        }
                                    ]
                                }
                            ],
                            max_tokens: 100
                        });
                        const aiReply = response.choices?.[0]?.message?.content || "";
                        console.log(`Checked avatar for ${member.user.username}, AI response: ${aiReply}`);
                        if (aiReply.includes("GTAG_CHAR_LONG_ARMS")) {
                            try {
                                if (!member.bannable) {
                                    console.warn('cannot ban user with GT character pfp and long arms:', member.user.username);
                                    interaction.followUp({ content: `Cannot ban ${member.user.username} for GT character with long arms in profile picture. They might have a higher role than the bot.`, ephemeral: true });
                                } else {
                                    // create a ban message with AI and send it to the user
                                    const banMessageResponse = await openai.chat.completions.create({
                                        model: "gpt-4.1-mini",
                                        messages: [
                                            {
                                                role: "system",
                                                content: "You are a helpful assistant that describes Discord profile pictures. Please note the server's name is 'Horror Remake'."
                                            },
                                            {
                                                role: "user",
                                                content: [
                                                    {
                                                        type: "text",
                                                        text: "Create a message to inform a user that they have been banned from Horror Remake because their profile picture contains a Gorilla Tag character with unnatural long arms, which is considered cheating. The message should be polite but firm, and explain that cheating is not allowed in the community. Only respond with the message content and nothing else. Use the image provided for reference. \nExample: 'You have been banned from Horror Remake because your profile picture contains a Gorilla Tag character with long arms, which is not allowed.'\nUser info: \nName: " + member.user.displayName
                                                    },
                                                    {
                                                        type: "image_url",
                                                        image_url: {
                                                            url: avatarUrl
                                                        }
                                                    }
                                                ]
                                            }
                                        ]
                                    });
                                    const otherAiReply = banMessageResponse.choices?.[0]?.message?.content || "You have been banned from Horror Remake because your profile picture contains a Gorilla Tag character with long arms, which is not allowed.";
                                    console.log(`Generated ban message for ${member.user.username}: ${otherAiReply}`);
                                    await member.send(otherAiReply).catch(() => { });
                                    await member.ban({ reason: "Gorilla Tag character with long arms in profile picture" });
                                    modlog(`Banned ${member.user.username} for having a Gorilla Tag character with long arms in their profile picture.`);
                                    interaction.followUp({ content: `Banned ${member.user.username} for GT character with long arms in profile picture.`, ephemeral: true });
                                }
                            } catch (err) {
                                console.error("Error banning user with GT character pfp:", err);
                            }
                        }
                        if (aiReply.includes("INNAPROPIATE_CONTENT")) {
                            try {
                                if (!member.bannable) {
                                    console.warn('cannot ban user with innapropiate content in pfp:', member.user.username);
                                    interaction.followUp({ content: `Cannot ban ${member.user.username} for innapropiate content in profile picture. They might have a higher role than the bot.`, ephemeral: true });
                                } else {
                                    // create a ban message with AI and send it to the user
                                    const banMessageResponse = await openai.chat.completions.create({
                                        model: "gpt-4.1-mini",
                                        messages: [
                                            {
                                                role: "system",
                                                content: "You are a helpful assistant that describes Discord profile pictures. Please note the server's name is 'Horror Remake'."
                                            },
                                            {
                                                role: "user",
                                                content: [
                                                    {
                                                        type: "text",
                                                        text: "Create a message to inform a user that they have been banned from Horror Remake because their profile picture contains innapropiate content. The message should be polite but firm, and explain that innapropiate content is not allowed in the community. Only respond with the message content and nothing else. Use the image provided for reference. \nExample: 'You have been banned from Horror Remake because your profile picture contains innapropiate content.'\nUser info: \nName: " + member.user.displayName
                                                    },
                                                    {
                                                        type: "image_url",
                                                        image_url: {
                                                            url: avatarUrl
                                                        }
                                                    }
                                                ]
                                            }
                                        ]
                                    });
                                    const otherAiReply = banMessageResponse.choices?.[0]?.message?.content || "You have been banned from Horror Remake because your profile picture contains a Gorilla Tag character with long arms, which is not allowed.";
                                    console.log(`Generated ban message for ${member.user.username}: ${otherAiReply}`);
                                    await member.send(otherAiReply).catch(() => { });
                                    await member.ban({ reason: "Innapropiate content in profile picture" });
                                    modlog(`Banned ${member.user.username} for having innapropiate content in their profile picture.`);
                                    interaction.followUp({ content: `Banned ${member.user.username} for innapropiate content in profile picture.`, ephemeral: true });
                                }
                            } catch (err) {
                                console.error("Error banning user with innapropiate content in pfp:", err);
                            }
                        }
                        if (aiReply.includes("NO_MATCH")) {
                            modlog(`Checked ${member.user.username}'s profile picture - no issues found.`);
                            interaction.followUp({ content: `Checked ${member.user.username}'s profile picture - no issues found.`, ephemeral: true });
                        }
                    } catch (err) {
                        console.error(`Error processing profile picture for ${member.user.username}:`, err);
                    }
                }
                console.log('Completed profile picture check.');
                modlog("Completed profile picture check for all members.");
                interaction.followUp({ content: "Completed profile picture check for all members.", ephemeral: true });
            }
            if (interaction.commandName === "submit") {
                console.log("Recieved interaction request for submit by " + interaction.user.displayName);
                const title = interaction.options.getString("title");
                const description = interaction.options.getString("description") || "No description provided.";
                const attachment = interaction.options.getAttachment("video");
                const url = interaction.options.getString("url");
                await interaction.reply({ content: "Processing your submission...", ephemeral: true });

                if (!attachment && !url) {
                    return interaction.followUp({ content: "You must provide either a video attachment or a URL!", ephemeral: true });
                }

                const AWS = require('aws-sdk');
                let videoUrl;

                try {
                    const s3 = new AWS.S3({
                        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
                        region: process.env.AWS_REGION,
                    });

                    const fetchUrl = attachment?.url || url;
                    const response = await fetch(fetchUrl);
                    const buffer = await response.buffer();

                    const randomId = Math.floor(Math.random() * 100000000);
                    const fileExtension = attachment?.name?.split('.')?.pop() || 'mp4';
                    const s3Key = `horrortube/${interaction.user.username}/${randomId}/${title}.${fileExtension}`;

                    await s3.upload({
                        Bucket: 'drive.julergt.org',
                        Key: s3Key,
                        Body: buffer,
                        ContentType: attachment?.contentType || 'video/mp4',
                    }).promise();

                    let s3keyToUri = encodeURIComponent(s3Key).replace(/%2F/g, '/'); // Ensure slashes are not encoded
                    videoUrl = `http://drive.julergt.org/${s3keyToUri}`;
                    console.log(`Video uploaded: ${videoUrl}`);
                } catch (err) {
                    console.error("Upload failed:", err);
                    return interaction.followUp({ content: "Failed to upload video. Please try again.", ephemeral: true });
                }

                const embed = new EmbedBuilder()
                    .setTitle("New Video Submission")
                    .setDescription(`**${title}**\n${description}`)
                    .setThumbnail(videoUrl)
                    .setFooter({ text: `Submitted by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
                    .setTimestamp()
                    .setColor(0x858585);

                await modlogEmbed(embed);

                try {
                    const guild = client.guilds.cache.get(configl.basics.guildID);
                    const channel = guild?.channels.cache.get(configl.basics.submissionChannelID);

                    if (!channel) {
                        return interaction.followUp({ content: "Submission channel not found.", ephemeral: true });
                    }

                    if (videoUrl === "null" || videoUrl === null) {
                        throw new Error("Video URL is null after upload.");
                    }

                    await channel.threads.create({
                        name: title,
                        message: { content: `${videoUrl}\n${description}\nSubmitted by: <@${interaction.user.id}>` },
                    });

                    await interaction.followUp({ content: "Video submitted successfully!", ephemeral: true });
                } catch (err) {
                    console.error("Submission error:", err);
                    await interaction.followUp({ content: "Error submitting video. Please try again.", ephemeral: true });
                }
            }
            if (interaction.commandName === "listentohr") {
                console.log("Recieved interaction request for listentohr by " + interaction.user.displayName);
                await interaction.deferReply();
                const voiceChannel = interaction.member.voice.channel;
                let connection = getVoiceConnection(interaction.guild.id);
                if (connection) {
                    await entersState(connection, VoiceConnectionStatus.Ready, 30_000);

                    const player = createAudioPlayer();
                    const resource = createAudioResource("http://localhost:8080", { filter: "audioonly" }, { inputType: StreamType.Arbitrary });

                    player.play(resource);
                    connection.subscribe(player);

                    player.on(AudioPlayerStatus.Idle, () => {
                        destroyVoiceConnectionIfNotSpeaking(interaction.guild.id, player);
                    });

                    return interaction.followUp({ content: `Streaming audio from Horror Radio in ${voiceChannel.name}!`, ephemeral: true });
                } else {
                    connection = joinVoiceChannel({
                        channelId: voiceChannel.id,
                        guildId: voiceChannel.guild.id,
                        adapterCreator: voiceChannel.guild.voiceAdapterCreator,
                    });

                    await entersState(connection, VoiceConnectionStatus.Ready, 30_000);

                    const player = createAudioPlayer();
                    const resource = createAudioResource("http://localhost:8080", { filter: "audioonly" }, { inputType: StreamType.Arbitrary });

                    player.play(resource);
                    connection.subscribe(player);

                    player.on(AudioPlayerStatus.Idle, () => {
                        destroyVoiceConnectionIfNotSpeaking(interaction.guild.id, player);
                    });

                    return interaction.followUp({ content: `Streaming audio from Horror Radio in ${voiceChannel.name}!`, ephemeral: true });
                }
            }
            if (interaction.commandName === "leavevoice") {
                stopVoiceModeration(interaction.guild.id);
                const conn = getVoiceConnection(interaction.guild.id);
                if (conn) {
                    conn.destroy();
                    interaction.reply({ content: 'Done!', ephemeral: true })
                }
                else { interaction.reply({ content: `I'm not in a voice channel!`, ephemeral: true }) }
            }
            if (interaction.commandName === "voicemod") {
                await interaction.deferReply({ ephemeral: true });

                if (!interaction.memberPermissions?.has("ModerateMembers")) {
                    return interaction.followUp({ content: "You need the **Timeout Members** permission to use this.", ephemeral: true });
                }

                const voiceChannel = interaction.member.voice.channel;
                if (!voiceChannel) {
                    return interaction.followUp({ content: "You need to be in a voice channel.", ephemeral: true });
                }
                if (!process.env.OPENAI_API_KEY) {
                    return interaction.followUp({ content: "Voice moderation needs an OpenAI API key, which isn't configured.", ephemeral: true });
                }
                if (activeVoiceModeration.has(interaction.guild.id)) {
                    return interaction.followUp({ content: "Voice moderation is already running in this server. Use `/stopvoicemod` to stop it.", ephemeral: true });
                }

                let connection = getVoiceConnection(interaction.guild.id);
                if (connection) {
                    // The bot may already be connected (e.g. for TTS) with selfDeaf=true,
                    // which blocks audio receive — rejoin undeafened so we can hear.
                    try { connection.rejoin({ selfDeaf: false, selfMute: false }); } catch { /* ignore */ }
                } else {
                    connection = joinVoiceChannel({
                        channelId: voiceChannel.id,
                        guildId: voiceChannel.guild.id,
                        adapterCreator: voiceChannel.guild.voiceAdapterCreator,
                        selfDeaf: false, // MUST be false to receive audio
                    });
                    await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
                }

                const started = startVoiceModeration(connection, voiceChannel, interaction.channel);

                // Transparency / consent: tell the channel that voice is being moderated.
                try {
                    await interaction.channel.send(`🎙️ Voice moderation is now active in **${voiceChannel.name}**. Speech is transcribed to enforce the server's language filter.`);
                } catch { /* ignore */ }

                return interaction.followUp({
                    content: started
                        ? `Voice moderation started in **${voiceChannel.name}**. Use \`/stopvoicemod\` to stop.`
                        : "Voice moderation was already active.",
                    ephemeral: true,
                });
            }
            if (interaction.commandName === "stopvoicemod") {
                await interaction.deferReply({ ephemeral: true });

                if (!interaction.memberPermissions?.has("ModerateMembers")) {
                    return interaction.followUp({ content: "You need the **Timeout Members** permission to use this.", ephemeral: true });
                }

                const stopped = stopVoiceModeration(interaction.guild.id);
                const conn = getVoiceConnection(interaction.guild.id);
                if (conn) { try { conn.destroy(); } catch { /* ignore */ } }

                return interaction.followUp({
                    content: stopped ? "Voice moderation stopped." : "Voice moderation wasn't running.",
                    ephemeral: true,
                });
            }
        }
    } catch (error) {
        console.error(
            "I GOT AN ERROR WHILE USING THIS COMMAND WITH " +
            (interaction?.user?.displayName || "Unknown user") +
            "!!!: " +
            error,
        );
        newIssue(`An error occurred during command execution by ${interaction?.user?.tag || "Unknown user"} at ${new Date().toISOString()}. Check the server console for details.`);

        // Safely attempt to inform the user about the error:
        // - If the interaction was already replied/deferred, use followUp
        // - Otherwise use reply
        // - Catch and log any errors (including Unknown interaction)
        try {
            if (interaction) {
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ files: ['./error.png'], ephemeral: true, text: error.text }).catch((err) => {
                        console.error("Failed to followUp with error image:", err);
                    });
                } else if (typeof interaction.reply === "function") {
                    await interaction.reply({ files: ['./error.png'], ephemeral: true, text: error.text }).catch((err) => {
                        console.error("Failed to reply with error image:", err);
                    });
                } else {
                    console.error("Interaction object exists but has no reply function.");
                }
            } else {
                console.error("No interaction object available to send error message.");
            }
        } catch (err) {
            console.error("Failed to send error response for interaction:", err);
        }
    }
});

if (!process.env.BOT_TOKEN) {
    console.error("[fatal] Missing BOT_TOKEN environment variable. Set BOT_TOKEN (or update the code to use DISCORD_TOKEN) and restart.");
    process.exit(1);
}

client.login(process.env.BOT_TOKEN); // I had to expose the token here because it was not working with the .env file, but I will change it back to the .env file when I can.

async function restart(code) {
    console.log(`Restart requested with code: ${code}`);
    await CleanUp();
    process.exit();
}
// Edit proposal to allow self-restart by owner
// This function will allow the bot to restart itself, but only if invoked by the owner

async function attemptSelfRestart(userId) {
  const ownerId = "804839205309382676"; // Juler's user ID
  if (userId !== ownerId) {
    return "Error: You do not have permission to restart the bot.";
  }
  // Logic to safely restart the bot process
  // For security and stability, actual restart will be handled by the hosting environment
  return "Restart initiated.";
}

// export or integrate this function where appropriate, with checks for owner ID
