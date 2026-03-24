const { Client, GatewayIntentBits } = require("discord.js");
const express = require("express");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const app = express();
app.use(express.json());

let staffTimes = {};

// Discord ready
client.once("ready", () => {
    console.log(`Bot online as ${client.user.tag}`);
});

// API endpoint Roblox sends data to
app.post("/stafftime", (req, res) => {

    const { username, time } = req.body;

    console.log("DATA RECEIVED:", username, time);

    if (!staffTimes[username]) {
        staffTimes[username] = 0;
    }

    staffTimes[username] += time;

    console.log(`${username} shift logged: ${time} seconds`);

    res.sendStatus(200);
});

// Discord command
client.on("messageCreate", message => {

    if (message.author.bot) return;

    if (message.content.startsWith("!stafftime")) {

        const args = message.content.split(" ");
        const user = args[1];

        if (!staffTimes[user]) {
            return message.reply("No staff time recorded.");
        }

        let seconds = staffTimes[user];
        let hours = Math.floor(seconds / 3600);
        let minutes = Math.floor((seconds % 3600) / 60);

        message.reply(`${user} has ${hours}h ${minutes}m of staff activity.`);
    }

});

// Railway port fix
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// login using environment variable
client.login(process.env.DISCORD_TOKEN);
