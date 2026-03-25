const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
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

const DATA_FILE = "staffTimes.json";

let staffTimes = {};

/* LOAD SAVED DATA */

if (fs.existsSync(DATA_FILE)) {
  staffTimes = JSON.parse(fs.readFileSync(DATA_FILE));
}

/* SAVE DATA FUNCTION */

function saveData() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(staffTimes, null, 2));
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

/* ROBLOX API ENDPOINT */

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

  saveData();

  console.log(`${username} (${rank}) logged ${time}s`);

  res.sendStatus(200);
});

/* DISCORD COMMANDS */

client.on("messageCreate", message => {

  if (message.author.bot) return;

  const command = message.content.split(" ")[0];

  /* STAFF TIME LOOKUP */

  if (command === "!stafftime") {

    const args = message.content.split(" ").slice(1);

    const username = args[0] || message.author.username;

    const data = staffTimes[username];

    if (!data) {
      return message.reply("No staff activity recorded for that user.");
    }

    const hours = Math.floor(data.time / 3600);
    const minutes = Math.floor((data.time % 3600) / 60);

    message.reply(`🏛 ${username}'s service record: **${hours}h ${minutes}m**`);
  }

  /* CURSUS HONORUM LEADERBOARD */

  if (command === "!staffleaderboard") {

    const embed = new EmbedBuilder()
      .setTitle("🏛 Cursus Honorum Records")
      .setDescription("Official record of magistrate service within the Cursus Honorum")
      .setColor(0xD4AF37)
      .setFooter({ text: "Issued by the Office of the Censor" })
      .setTimestamp();

    rankOrder.forEach(rank => {

      const members = Object.entries(staffTimes)
        .filter(([_, data]) => data.rank === rank)
        .sort((a, b) => b[1].time - a[1].time);

      if (members.length > 0) {

        let fieldText = "";

        members.forEach(([username, data]) => {

          const hours = Math.floor(data.time / 3600);
          const minutes = Math.floor((data.time % 3600) / 60);

          fieldText += `• ${username} — ${hours}h ${minutes}m\n`;
        });

        embed.addFields({
          name: rank,
          value: fieldText
        });

      }

    });

    message.reply({ embeds: [embed] });
  }

  /* NEW WEEK RESET (ADMIN ONLY) */

  if (command === "!newweek") {

    if (!message.member.permissions.has("Administrator")) {
      return message.reply("❌ Only administrators may begin a new Senate week.");
    }

    staffTimes = {};

    saveData();

    message.reply("🏛 A new week begins. The Senate ledger has been cleared.");
  }

});

/* START SERVER */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

/* LOGIN BOT */

client.login(process.env.DISCORD_TOKEN);
