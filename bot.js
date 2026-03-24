const { Client, GatewayIntentBits } = require("discord.js");
const express = require("express");

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const app = express();
app.use(express.json());

let staffTimes = {};

client.once("clientReady", () => {
    console.log(`Bot online as ${client.user.tag}`);
});

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

client.on("messageCreate", message => {

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

app.listen(3000, () => {
    console.log("Staff tracker API running on port 3000");
});

client.login(process.env.DISCORD_TOKEN);