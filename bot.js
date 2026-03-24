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

// Roman rank order
const rankOrder = [
    "Empress",
    "Oracle of Delphi",
    "Consul",
    "Curatores",
    "Censor",
    "Praetor Urbanus",
    "Praetor",
    "Curule Aedile",
    "Plebian Tribune"
];

client.once("ready", () => {
    console.log(`Bot online as ${client.user.tag}`);
});

app.post("/stafftime", (req, res) => {

    const { username, time, rank } = req.body;

    if (!staffTimes[username]) {
        staffTimes[username] = {
            time: 0,
            rank: rank
        };
    }

    staffTimes[username].time += time;
    staffTimes[username].rank = rank;

    console.log(`${username} (${rank}) logged ${time}s`);

    res.sendStatus(200);
});

client.on("messageCreate", message => {

    if (message.author.bot) return;

    if (message.content === "!staffleaderboard") {

        const sorted = Object.entries(staffTimes).sort((a, b) => {

            const rankA = rankOrder.indexOf(a[1].rank);
            const rankB = rankOrder.indexOf(b[1].rank);

            if (rankA !== rankB) return rankA - rankB;

            return b[1].time - a[1].time;
        });

        let msg = "🏛 Roman Staff Leaderboard\n\n";

        sorted.forEach(([username, data]) => {

            const hours = Math.floor(data.time / 3600);
            const minutes = Math.floor((data.time % 3600) / 60);

            msg += `${data.rank} — ${username} (${hours}h ${minutes}m)\n`;
        });

        message.reply(msg);
    }

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

client.login(process.env.DISCORD_TOKEN);
