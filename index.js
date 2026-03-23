const express = require("express");
const app = express();
const OpenAI = require("openai");
const path = require("path");
const { writeFile } = require("fs/promises");
const puppeteer = require('puppeteer');
// Simple in-memory chat history
const chatMemory = new Map();
// key = channelId OR userId (for DMs)
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
        return res.status(401).sendFile(path.join(__dirname, "public", "unauthorized.html"))
    }

    const base64 = auth.split(" ")[1];
    const [user, pass] = Buffer.from(base64, "base64").toString().split(":");

    if (user === USER && pass === PASS) {
        return next();
    } else {
        res.sendFile(path.join(__dirname, "public", "incorrect-password.html"))
    }

    res.setHeader("WWW-Authenticate", 'Basic realm="Protected"');
    res.status(401).sendFile(path.join(__dirname, "public", "unauthorized.html"))
});

app.listen(3000, () => {
    console.log("Web interface running on port 3000");
});

const pm2_logs_dir = "C:\\Users\\Juler\\.pm2\\logs";
fs.writeFileSync(path.join(pm2_logs_dir, "horror-rebot-out.log"), "", "utf-8");
fs.writeFileSync(path.join(pm2_logs_dir, "horror-rebot-error.log"), "", "utf-8");

// Serve all files in "public" (including log.txt, images, CSS, etc.)
app.use(express.static(path.join(__dirname, 'public')));
// serve pm2 logs in "/logs"
app.use('/logs', express.static(pm2_logs_dir));

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

app.get("/chatgpt-status", (req, res) => {
    res.json({ enabled: configl.chatgptintegration.enabled });
});

app.get("/vc-status", (req, res) => {
    res.json({ enabled: configl.basics.vc.enabled })
})

app.get("/aimoderation-status", (req, res) => {
    res.json({ enabled: configl.chatgptintegration.aimoderation.enabled });
})

const pkg = fs.readFileSync("./package.json");
const package = JSON.parse(pkg);

// increase version number when making changes

let version = package.version || "NIL";

// update "updated-at" field in package.json
const now = new Date();
// date format: January 1, 1970 at 12:00 AM UTC
const updatedAt = `${now.toLocaleString('en-US', { month: 'long' })} ${now.getDate()}, ${now.getFullYear()} at ${now.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })} AST`;
package["updated-at"] = updatedAt;
fs.writeFileSync("./package.json", JSON.stringify(package, null, 2));;

const { Client, GatewayIntentBits, ActivityType, ChannelType, Partials, Events } = require("discord.js");

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
} = require("@discordjs/voice");
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
const { exec } = require("child_process");

if (!process.env.OPENAI_API_KEY && cff.chatgptintegration.enabled) {
    throw new Error("OPENAI_API_KEY was not set in .env file but ChatGPT Integration is enabled.");
} else if (!process.env.OPENAI_API_KEY && cff.chatgptintegration.aimoderation.enabled) {
    throw new Error("OPENAI_API_KEY was not set in .env file but AI Moderation is enabled.");
}

function run(cmd) {
    return new Promise((resolve, reject) => {
        exec(cmd, (err, stdout, stderr) => {
            if (err) return reject(stderr);
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

async function syncRepo() {
    if (!cff.GitHub) return null;
    try {
        console.log("Checking remote changes...");

        await run("git fetch");

        const local = await run("git rev-parse HEAD");
        const remote = await run("git rev-parse @{u}");

        if (local !== remote) {
            console.log("Remote updates found. Pulling...");
            await run("git pull");
            restart(0);
        } else {
            console.log("Repo already up to date.");
        }

        console.log("Checking local changes...");

        const status = await run("git status --porcelain");

        if (status) {
            console.log("Local changes detected. Committing and pushing...");

            await run("git add .");
            await run(`git commit -m "Auto commit from bot"`);
            await run("git push");

            console.log("Changes pushed to GitHub.");
        } else {
            console.log("No local changes.");
        }

    } catch (err) {
        console.error("Git sync error:", err);
    }
}

syncRepo();

setInterval(syncRepo, 1 * 60 * 1000); // every 1 minute

// </> DO NOT DELETE

const shutdown = async (signal) => {
    console.log(`Received ${signal}, shutting down...`);
    await CleanUp()
    process.exit(0);
};

async function CleanUp() {
    try {
        await client.destroy(); // cleanly disconnects
        const conn = getVoiceConnection(configl.basics.guildID);
        if (conn) conn.destroy();
        console.log("Client destroyed.");
    } catch (err) {
        console.error("Error destroying client:", err);
    }
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// Error handling
process.on("uncaughtException", async (err) => {
    const guild = client.guilds.cache.get("1333194010201952367");
    const julergt = guild.members.fetch("804839205309382676");
    await (await julergt).send(`<@804839205309382676>\n# Bot Crashed!\n### The bot crashed due to an unhandled exception.\nHere is the error report:\n\`\`\`\n${err.stack || err}\n\`\`\``);
    console.error("==============================");
    console.error("Bot Crashed!", err);
    console.error("");
    console.error("Horror Rebot, " + version);
    console.error("Node.js, " + process.version);
    console.error("")
    console.error("==============================");
    restart(err.code); // exit the process to avoid undefined states
});

process.on("unhandledRejection", async (err) => {
    const guild = client.guilds.cache.get("1333194010201952367");
    const julergt = guild.members.fetch("804839205309382676");
    await (await julergt).send(`<@804839205309382676>\n# Bot Crashed!\n### The bot crashed due to an unhandled exception.\nHere is the error report:\n\`\`\`\n${err.stack || err}\n\`\`\``);
    console.error("==============================");
    console.error("Unhandled Rejection:", err);
    console.error("");
    console.error("Horror Rebot, " + version);
    console.error("Node.js, " + process.version);
    console.error("")
    console.error("==============================");
    // make this console line red
    console.error("\x1b[31m%s\x1b[0m", "[fatal] Bot crashed, HANGING HERE!");
    restart(err.code); // exit the process to avoid undefined states
});

const blacklistedTags = {
    '1237045622234943498': 'Gorilla Tag Copy',
    // Add more if needed
};

const warnedUsers = new Set();

client.once(Events.ClientReady, async () => {
    console.log(`Logged in as ${client.user.username}`);
    if (client.user.setAFK) client.user.setAFK(false);
    const guild = client.guilds.cache.get("1333194010201952367");
    await client.user.setPresence({ status: 'online', activities: [{ name: `${guild.memberCount} monkeys | v${version}`, type: ActivityType.Watching }] });
    console.log("Update status!")
});

const badWords = fs.readFileSync("bad-words.txt", "utf-8").split("\n");

const cheatsWords = fs.readFileSync("cheat-words.txt", "utf-8").split("\n");

console.log("Clearing old issues...")
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
    const { getVoiceList, synthesize } = await import('@echogarden/windows-media-tts')
    const voices = getVoiceList();
    console.log("Installed voices:", voices);

    // find Microsoft David
    const david = voices.find(v => v.displayName === "Microsoft David" && v.language === "en-US");
    if (!david) {
        throw new Error("Microsoft David voice not found");
    }
    const zira = voices.find(v => v.displayName === "Microsoft Zira" && v.language === "en-US");
    if (!zira) {
        throw new Error("Microsoft Zira voice not found");
    }

    const { audioData } = synthesize(text, {
        voiceName: david.displayName,
        speakingRate: 1.0,
        audioPitch: 1.0,
        enableSsml: false
    });

    await writeFile("./temp/TEMP_output_david.wav", audioData);
    console.log("Wrote output_david.wav");
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
                if (member.user.bot || member.id === targetGuild.ownerId || member.id === client.user.id) continue;

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

    if (!configl.chatgptintegration.aimoderation.enabled) return;
    console.log('Starting "gorilla tag character with long arms" pfp check... [Powered by AI]')
    const guild = client.guilds.cache.get(GUILD_ID);
    console.log(`Checking profile pictures for ${guild.members.cache.size} members...`);
    for (const member of guild.members.cache.values()) {
        if (member.user.bot) continue; // skip bots
        if (guild.ownerId === member.id) continue; // skip server owner
        try {
            const openai = new OpenAI({
                apiKey: process.env.OPENAI_API_KEY,
            });
            const avatarUrl = member.user.displayAvatarURL({ format: "png", size: 512 });

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
                        })
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
                        })
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
        if (!configl.chatgptintegration.aimoderation.enabled) return;

        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
        const avatarUrl = member.user.displayAvatarURL({ format: "png", size: 512 });

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
                    })
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
                    })
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

    if (member.user.bot) return; // skip bots
    if (member.user.createdTimestamp > Date.now() - 5 * 24 * 60 * 60 * 1000) {
        // Ban users whose account is younger than 5 days
        try {
            await member.send("Your account is too new to join the Horror Remake Discord server. If you believe this is a mistake, please contact the moderators.").catch(() => { });
            await member.ban({ reason: "Account age less than 5 days" });
            modlog(`Banned ${member.user.username} for having an account age less than 5 days.`);
        } catch (err) {
            console.error("Error banning user for new account:", err);
            modlog(`Could not ban ${member.user.username} for new account (less than 5 days old) - insufficient permissions.`);
            newIssue(`Failed to ban user ${member.user.username} for new account (less than 5 days old). Please check permissions and ban manually if necessary.`)
        }
    }
});

client.on("messageCreate", async (message) => {
    if (message.author.bot) return; // Ignore bot messages

    // Log DMs
    if (message.channel.type === ChannelType.DM) { // 1 = DMChannel in discord.js v14+
        console.log(`[DM] ${message.author.tag}: ${message.content}`);
    }

    // Bad words filter
    const words = message.content.split(" ");
    for (const word of words) {
        if (badWords.includes(word.toLowerCase())) {
            try {
                if (message.channel.type === ChannelType.DM) continue; // skip bad word filter for DMs
                message.delete();
            } catch (err) {
                console.error("Failed to delete message with bad word:", err);
            }
            try {
                if (!message.guild) return null; // should not happen, but just in case
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

    // ====== URL REGEX ======
    const urlRegex = /(https?:\/\/[^\s]+)/gi;

    // ====== HANDLER ======
    if (
        message.mentions?.has?.(client.user) ||
        message.content.startsWith(`<@!${client.user.id}>`) ||
        message.content.startsWith(`<@${client.user.id}>`) ||
        message.channel.type === ChannelType.DM &&
        configl.chatgptintegration.enabled
    ) {
        console.log(`ChatGPT mention/DM by ${message.author.globalName || message.author.displayName}: ${message.content}`);

        if (!configl.chatgptintegration.enabled) return message.reply("Sorry, Horror ReAI is currently disabled.");

        if (message.content.startsWith("!")) return; // commands start with ! so ignore those

        if (message.author.bot) return;
        if (message.mentions.has("@everyone") || message.mentions.has("@here")) return;

        message.channel.sendTyping();

        let cleaned = message.content
            .replace(`<@!${client.user.id}>`, "")
            .replace(`<@${client.user.id}>`, "")
            .trim();

        if (!cleaned) cleaned = "Hello";

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
                        })
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

        console.log(message.author)

        // ====== TRIM MEMORY ======
        if (history.length > 21) {
            history.splice(1, history.length - 21);
        }

        // ====== OPENAI REQUEST ======
        const response = await openai.responses.create({
            prompt: {
                "id": process.env.OPENAI_ASSISTANT_ID,
                "version": "20"
            },
            input: history,
            text: {
                "format": {
                    "type": "text"
                }
            },
            reasoning: {},
            max_output_tokens: 2048,
            store: true,
            include: ["web_search_call.action.sources"]
        });

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
                if (!configl.basics.vc.enabled) return;
                const connection = joinVoiceChannel({
                    channelId: memberVoiceChannel.id,
                    guildId: memberVoiceChannel.guild.id,
                    adapterCreator: memberVoiceChannel.guild.voiceAdapterCreator,
                });

                await speakText(replyText);

                const player = createAudioPlayer();
                const resource = createAudioResource('./temp/TEMP_output_david.wav', {
                    inputType: StreamType.Arbitrary,
                });

                player.play(resource);
                connection.subscribe(player);

                player.on(AudioPlayerStatus.Idle, () => {
                    setTimeout(() => {
                        if (player.state.status === AudioPlayerStatus.Idle && connection) {
                            try {
                                connection.destroy();
                            } catch {
                                // ignore, cause its annoying to crash
                            }
                        }
                    }, 30000);
                });
            } else {
                if (!message.guild) return;
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
});

// occurs when this member's roles or nickname are updated

client.on("guildMemberUpdate", async (oldMember, newMember) => {
    checkServerTagViolation(newMember);

    // check roles
    try {
        if (oldMember.user.bot || newMember.user.bot) return; // skip bots

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
    if (message.author.bot) return; // Ignore bot messages

    // image filter
    if (message.attachments.size > 0 || message.content.match(/https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|bmp|webp)$/i) || message.content.match(/https?:\/\/[^\s]+/i)) {
        for (const attachment of message.attachments.values()) {
            if (attachment.contentType.startsWith("image/") || attachment.url.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i)) {
                try {
                    if (!message.guild) return; // only check images in guilds, not DMs
                    if (!configl.chatgptintegration.aimoderation.enabled) return;

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

                        c
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
            if (warnedUsers.has(key)) return;

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
]

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




// only for autocomplete interactions

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isAutocomplete()) return;

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
    if (message.author.bot) return;
    if (message.content.startsWith("!crash")) {
        if (message.author.id !== "804839205309382676") return message.react("💔");
        throw new Error("Intentional crash triggered by !crash command");
    }
});

// </autocomplete>

const EmbedBuilder = require("discord.js").EmbedBuilder;

client.on("interactionCreate", async (interaction) => {
    try {
        if (interaction.isCommand()) {
            if (!configl.basics.vc.enabled) {
                if (interaction.commandName.includes("voice") || interaction.commandName.includes("join") || interaction.commandName.includes("openurlstream")) {
                    const embed = new EmbedBuilder()
                        .setTitle("Voice Commands No Longer Work")
                        .setDescription("Due to recent changes in Discord's API and policies, the voice-related commands no longer work. We apologize for any inconvenience this may cause. If you have any questions or concerns, please contact the server staff.")
                        .setColor(0xFF0000);
                    return interaction.reply({ embeds: [embed] });
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
                    saveAvatar(user) // Cache the avatar
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
                await interaction.deferReply();
                const question = interaction.options.getString("question")
                const eightBallResponses = [
                    "Yes",
                    "No",
                    "Maybe",
                    "Ew"
                ];
                const nintendo = ["mario", "luigi", "peach", "yoshi", "toad", "bowser", "wario", "waluigi", "donkey kong", "diddy kong", "link", "zelda", "nintendo", "pokemon", "pikachu", "ash", "misty", "brock", "squirtle", "charmander", "bulbasaur", "meowth", "psyduck", "jigglypuff", "snorlax", "mewtwo", "mew"];
                const mdpSlop = ["max", "jimmy", "maxwell", "angus", "nugget"]
                const bimo = ["bimo"]
                const brainrotWords = ["lankybox", "goodboy", "good boy", "cocomelon", "skibidi"]
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
                await interaction.followUp(interaction.user.displayName + " asked: " + question + "\nThe 8 ball said: " + response)

            }
            if (interaction.commandName === "tenor") {
                console.log("Recieved interaction request for tenor by " + interaction.user.displayName)
                const tenorQuery = interaction.options.getString("query")
                const cmdTenorGifs = `https://tenor.googleapis.com/v2/search?q=${tenorQuery}&key=AIzaSyDGe2SIv_YipnnY0zUE4WtMZvYcHMupbCI&client_key=horror-rebot-1747534485793&limit=8`
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
            if (interaction.commandName === "base64encode") {
                console.log("Recieved interaction request for base64encode by " + interaction.user.displayName)
                const wordToEncode = interaction.options.getString("input")
                const encoded = Buffer.from(wordToEncode, "utf-8").toString("base64");
                interaction.reply(`${encoded}`);
            }
            if (interaction.commandName === "base64decode") {
                console.log("Recieved interaction request for base64encode by " + interaction.user.displayName)
                const wordToEncode = interaction.options.getString("input")
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
                // Now save the birthday data to 'birthdays.json'
                // Birthday format = MM-DD
                if (!/^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/.test(birthdayDate)) {
                    return interaction.reply({
                        content: "Please provide a valid date in MM-DD format.",
                        ephemeral: true,
                    });
                }
                // Load existing birthdays or create a new object
                const birthdaysFile = "birthdays.json";
                if (!fs.existsSync(birthdaysFile)) {
                    fs.writeFileSync(birthdaysFile, JSON.stringify({}));
                }
                // Read existing birthdays (Birthday is already called)
                const birthdaysload = JSON.parse(fs.readFileSync(birthdaysFile, "utf-8") || "{}");
                // Check if the user already has a birthday set
                if (birthdaysload[interaction.user.id]) {
                    return interaction.reply({
                        content: "You already have a birthday set. Please use the command again to update it.",
                        ephemeral: true,
                    });
                }
                // Save the birthday for the user
                const birthdays = JSON.parse(fs.readFileSync("birthdays.json", "utf-8") || "{}");
                const userId = interaction.user.id;
                birthdays[userId] = birthdayDate;
                fs.writeFileSync("bot_saved_data.json", JSON.stringify(birthdays, null, 2));
                console.log(`Saved birthday for ${interaction.user.displayName}: ${birthdayDate}`);
                // Fix for bot overwriting birthdays once someone else sets their birthday
                if (birthdaysload[userId] && birthdaysload[userId] !== birthdayDate) {
                    return interaction.reply({
                        content: "You already have a birthday set. Please use the command again to update it.",
                        ephemeral: true,
                    });
                }
                fs.writeFileSync("birthdays.json", JSON.stringify(birthdays, null, 2));
                console.log(`Saved birthday for ${interaction.user.displayName}: ${birthdayDate}`);
                // If the user has a birthday set, do not overwrite it
                if (birthdaysload[userId]) {
                    return interaction.reply({
                        content: "You already have a birthday set. Please use the command again to update it.",
                        ephemeral: true,
                    });
                }
                // Tell discord the bot is thinking
                await interaction.deferReply({ ephemeral: true });
                if (isDirectMessage) {
                    try {
                        await interaction.user.send(`Your birthday has been set to ${birthdayDate}.`);
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
                await interaction.followUp({
                    content: `Your birthday has been set to ${birthdayDate}. You will receive a birthday message on your birthday!`,
                    ephemeral: true,
                });
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
                    const conn = getVoiceConnection(interaction.guild.id);
                    if (conn) conn.destroy();
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

                const url = interaction.options.getString("url");
                if (!url) {
                    return interaction.followUp({ content: "No URL provided!", ephemeral: true });
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
                            const conn = getVoiceConnection(interaction.guild.id);
                            if (conn) conn.destroy();
                            return;
                        }

                        const player = createAudioPlayer();
                        const resource = createAudioResource(url, { filter: "audioonly" }, { inputType: StreamType.Arbitrary });

                        player.play(resource);
                        connection.subscribe(player);

                        player.on(AudioPlayerStatus.Idle, () => {
                            const conn = getVoiceConnection(interaction.guild.id);
                            if (conn) conn.destroy();
                        });
                    }

                    if (url.includes("youtube.com") || url.includes("youtu.be")) {
                        interaction.followUp({ content: "YouTube streaming is not supported.", ephemeral: true });
                        const conn = getVoiceConnection(interaction.guild.id);
                        if (conn) conn.destroy();
                        return;
                    }

                    const player = createAudioPlayer();
                    const resource = createAudioResource(url, { filter: "audioonly" }, { inputType: StreamType.Arbitrary });

                    player.play(resource);
                    connection.subscribe(player);

                    player.on(AudioPlayerStatus.Idle, () => {
                        const conn = getVoiceConnection(interaction.guild.id);
                        if (conn) conn.destroy();
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
                            const conn = getVoiceConnection(interaction.guild.id);
                            if (conn) conn.destroy();
                            return;
                        }

                        const player = createAudioPlayer();
                        const resource = createAudioResource(url, { filter: "audioonly" }, { inputType: StreamType.Arbitrary });

                        player.play(resource);
                        connection.subscribe(player);

                        player.on(AudioPlayerStatus.Idle, () => {
                            const conn = getVoiceConnection(interaction.guild.id);
                            if (conn) conn.destroy();
                        });
                    }

                    if (url.includes("youtube.com") || url.includes("youtu.be")) {
                        interaction.followUp({ content: "YouTube streaming is not supported.", ephemeral: true });
                        const conn = getVoiceConnection(interaction.guild.id);
                        if (conn) conn.destroy();
                        return;
                    }

                    const player = createAudioPlayer();
                    const resource = createAudioResource(url, { filter: "audioonly" }, { inputType: StreamType.Arbitrary });

                    player.play(resource);
                    connection.subscribe(player);

                    player.on(AudioPlayerStatus.Idle, () => {
                        const conn = getVoiceConnection(interaction.guild.id);
                        if (conn) conn.destroy();
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
                if (!configl.chatgptintegration.aimoderation.enabled) return interaction.reply({ content: "AI Moderation is disabled in settings. Please enable AI Moderation and try again.", ephemeral: true });
                await interaction.deferReply({ ephemeral: true });
                const GUILD_ID = "1333194010201952367";
                const guild = client.guilds.cache.get(GUILD_ID);
                for (const member of guild.members.cache.values()) {
                    if (member.user.bot) continue; // skip bots
                    if (guild.ownerId === member.id) continue; // skip server owner
                    try {
                        const openai = new OpenAI({
                            apiKey: process.env.OPENAI_API_KEY,
                        });
                        const avatarUrl = member.user.displayAvatarURL({ format: "png", size: 512 });

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
                                    })
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
                                    })
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

                    if (videoUrl == "null" || videoUrl == null) {
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

client.login(process.env.BOT_TOKEN); // I had to expose the token here because it was not working with the .env file, but I will change it back to the .env file when I can.

async function restart(code) {
    console.log(`About to exit with code: ${code}`);
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
        await process.exit(code);
    } catch (err) {
        console.error("Error during shutdown:", err);
        newIssue(`An error occurred during bot restart at ${new Date().toISOString()}. Check the server console for details.`);
        process.exit(1); // Force exit with error code if something goes wrong
    }
}