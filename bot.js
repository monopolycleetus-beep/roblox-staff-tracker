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

  // PERSONAL STAFF TIME
  if (message.content === "!stafftime") {

    const data = staffTimes[message.author.username];

    if (!data) {
      message.reply("No staff activity recorded yet.");
      return;
    }

    const hours = Math.floor(data.time / 3600);
    const minutes = Math.floor((data.time % 3600) / 60);

    message.reply(`🏛 Your staff time: **${hours}h ${minutes}m**`);
  }

  // RANK CATEGORY LEADERBOARD
  if (message.content === "!staffleaderboard") {

    let msg = "🏛 **Roman Staff Leaderboard**\n\n";

    rankOrder.forEach(rank => {

      const members = Object.entries(staffTimes)
        .filter(([_, data]) => data.rank === rank)
        .sort((a, b) => b[1].time - a[1].time);

      if (members.length > 0) {

        msg += `**${rank}**\n`;

        members.forEach(([username, data]) => {

          const hours = Math.floor(data.time / 3600);
          const minutes = Math.floor((data.time % 3600) / 60);

          msg += `• ${username} — ${hours}h ${minutes}m\n`;

        });

        msg += "\n";
      }

    });

    message.reply(msg);
  }

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

client.login(process.env.DISCORD_TOKEN);
