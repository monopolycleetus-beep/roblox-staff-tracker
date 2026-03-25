const { Client, GatewayIntentBits, EmbedBuilder, PermissionsBitField } = require("discord.js");
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

const DATA_FILE = "./staffTimes.json";
const BOARD_FILE = "./leaderboard.json";

let staffTimes = {};
let leaderboardData = { channelId: null, messageId: null };

if (fs.existsSync(DATA_FILE)) {
  staffTimes = JSON.parse(fs.readFileSync(DATA_FILE));
}

if (fs.existsSync(BOARD_FILE)) {
  leaderboardData = JSON.parse(fs.readFileSync(BOARD_FILE));
}

function saveData() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(staffTimes, null, 2));
}

function saveBoard() {
  fs.writeFileSync(BOARD_FILE, JSON.stringify(leaderboardData, null, 2));
}

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

/* BUILD LEADERBOARD EMBED */

function buildLeaderboardEmbed() {

  const embed = new EmbedBuilder()
    .setTitle("🏛 Cursus Honorum Records")
    .setDescription("Weekly service records of Rome's magistrates.")
    .setColor(0xD4AF37)
    .setFooter({ text: "Issued by the Office of the Censor" })
    .setTimestamp();

  rankOrder.forEach(rank => {

    const members = Object.entries(staffTimes)
      .filter(([_, data]) => data.rank === rank)
      .sort((a, b) => b[1].time - a[1].time);

    if (members.length > 0) {

      let text = "";

      members.forEach(([username, data]) => {

        const hours = Math.floor(data.time / 3600);
        const minutes = Math.floor((data.time % 3600) / 60);

        text += `• ${username} — ${hours}h ${minutes}m\n`;

      });

      embed.addFields({
        name: rank,
        value: text
      });

    }

  });

  return embed;
}

/* UPDATE LIVE LEADERBOARD */

async function updateLeaderboard() {

  if (!leaderboardData.channelId || !leaderboardData.messageId) return;

  try {

    const channel = await client.channels.fetch(leaderboardData.channelId);
    const message = await channel.messages.fetch(leaderboardData.messageId);

    const embed = buildLeaderboardEmbed();

    await message.edit({ embeds: [embed] });

  } catch (err) {
    console.log("Leaderboard update failed:", err);
  }
}

/* ROBLOX ACTIVITY API */

app.post("/stafftime", (req, res) => {

  const { username, time, rank } = req.body;

  if (!staffTimes[username]) {
    staffTimes[username] = { time: 0, rank: rank };
  }

  staffTimes[username].time += time;
  staffTimes[username].rank = rank;

  saveData();

  console.log(`${username} (${rank}) logged ${time}s`);

  updateLeaderboard();

  res.sendStatus(200);
});

/* DISCORD COMMANDS */

client.on("messageCreate", async message => {

  if (message.author.bot) return;

  const args = message.content.split(" ");
  const command = args[0].toLowerCase();

  /* HELP */

  if (command === "!help") {

    const embed = new EmbedBuilder()
      .setTitle("🏛 Command Register")
      .setDescription("Official commands of the Roman administration.")
      .setColor(0xD4AF37)

      .addFields(
        {
          name: "📊 Staff Activity",
          value:
          "`!stafftime` — View your service hours\n" +
          "`!stafftime username` — View another magistrate's hours\n" +
          "`!staffleaderboard` — View the Cursus Honorum records"
        },
        {
          name: "🏛 Administration",
          value:
          "`!newweek` — Begin a new week of records (Admin)\n" +
          "`!createstaffboard` — Create the live leaderboard"
        }
      )

      .setFooter({ text: "Issued by the Office of the Censor" })
      .setTimestamp();

    message.reply({ embeds: [embed] });
  }

  /* STAFFTIME */

  if (command === "!stafftime") {

    let target = args[1] || message.author.username;

    const data = staffTimes[target];

    if (!data) {
      message.reply("No staff activity recorded for that user.");
      return;
    }

    const hours = Math.floor(data.time / 3600);
    const minutes = Math.floor((data.time % 3600) / 60);

    const embed = new EmbedBuilder()
      .setTitle("🏛 Staff Service Record")
      .setDescription(`Service record for **${target}**`)
      .setColor(0xD4AF37)
      .addFields({
        name: "Recorded Service",
        value: `${hours}h ${minutes}m`
      })
      .setFooter({ text: "Issued by the Office of the Censor" })
      .setTimestamp();

    message.reply({ embeds: [embed] });
  }

  /* LEADERBOARD COMMAND */

  if (command === "!staffleaderboard") {

    const embed = buildLeaderboardEmbed();
    message.reply({ embeds: [embed] });

  }

  /* CREATE LIVE BOARD */

  if (command === "!createstaffboard") {

    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      message.reply("Only administrators may create the staff board.");
      return;
    }

    const embed = buildLeaderboardEmbed();

    const msg = await message.channel.send({ embeds: [embed] });

    leaderboardData.channelId = msg.channel.id;
    leaderboardData.messageId = msg.id;

    saveBoard();

    message.reply("🏛 Live staff leaderboard created.");
  }

  /* NEW WEEK RESET */

  if (command === "!newweek") {

    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      message.reply("Only administrators may begin a new week.");
      return;
    }

    staffTimes = {};
    saveData();

    const embed = new EmbedBuilder()
      .setTitle("🏛 A New Week Begins")
      .setDescription("The **Cursus Honorum Records** have been cleared.\n\nA new week of service to Rome begins.")
      .setColor(0xD4AF37)
      .setFooter({ text: "Issued by the Office of the Censor" })
      .setTimestamp();

    message.channel.send({ embeds: [embed] });

    updateLeaderboard();
  }

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

client.login(process.env.DISCORD_TOKEN);
