const { Client, GatewayIntentBits } = require("discord.js");
const express = require("express");
const fs = require("fs");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const app = express();
app.use(express.json());

/* DATABASE */

let staffTimes = {};

/* LOAD SAVED DATA */

if (fs.existsSync("staffTimes.json")) {
  const data = fs.readFileSync("staffTimes.json");
  staffTimes = JSON.parse(data);
}

/* SAVE FUNCTION */

function saveData() {
  fs.writeFileSync("staffTimes.json", JSON.stringify(staffTimes, null, 2));
}

/* RANK ORDER */

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

/* BOT READY */

client.once("ready", () => {
  console.log(`Bot online as ${client.user.tag}`);
});

/* ROBLOX → SEND TIME */

app.post("/stafftime", (req, res) => {

  const { username, time, rank } = req.body;

  if (!username || !time || !rank) {
    return res.status(400).send("Missing data");
  }

  if (!staffTimes[username]) {
    staffTimes[username] = {
      time: 0,
      rank: rank
    };
  }

  staffTimes[username].time += time;
  staffTimes[username].rank = rank;

  saveData();

  console.log(`${username} (${rank}) logged ${time}s`);

  res.sendStatus(200);
});

/* DEBUG ROUTE */

app.get("/data", (req, res) => {
  res.json(staffTimes);
});

/* DISCORD COMMANDS */

client.on("messageCreate", message => {

  if (message.author.bot) return;

  const args = message.content.split(" ");
  const command = args[0].toLowerCase();

  /* STAFFTIME */

  if (command === "!stafftime") {

    let username;

    if (!args[1]) {
      username = message.author.username;
    } else {
      username = args[1];
    }

    const data = staffTimes[username];

    if (!data) {
      message.reply(`No staff activity found for **${username}**.`);
      return;
    }

    const hours = Math.floor(data.time / 3600);
    const minutes = Math.floor((data.time % 3600) / 60);

    message.reply(`🏛 **${username}'s Staff Time:** ${hours}h ${minutes}m`);
  }

  /* LEADERBOARD */

  if (command === "!staffleaderboard") {

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

  /* HELP */

  if (command === "!help") {

    message.reply(`
🏛 **Roman Staff Tracker Commands**

!stafftime
View your staff time

!stafftime USERNAME
Check another staff member

!staffleaderboard
View staff activity leaderboard
`);
  }

});

/* START SERVER */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

client.login(process.env.DISCORD_TOKEN);
