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

/* LOAD SAVED DATA */

let staffTimes = {};

if (fs.existsSync("staffTimes.json")) {
  const data = fs.readFileSync("staffTimes.json");
  staffTimes = JSON.parse(data);
}

/* RANK ORDER FOR LEADERBOARD */

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

/* ROBLOX → SEND STAFF TIME */

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

  /* SAVE DATA PERMANENTLY */
  fs.writeFileSync("staffTimes.json", JSON.stringify(staffTimes, null, 2));

  console.log(`${username} (${rank}) logged ${time}s`);

  res.sendStatus(200);
});

/* DISCORD COMMANDS */

client.on("messageCreate", message => {

  if (message.author.bot) return;

  const args = message.content.split(" ");
  const command = args[0];

  /* STAFFTIME COMMAND */

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
View staff leaderboard
`);
  }

});

/* START SERVER */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

client.login(process.env.DISCORD_TOKEN);
