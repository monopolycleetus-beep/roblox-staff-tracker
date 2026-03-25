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

let staffTimes = {};

if (fs.existsSync(DATA_FILE)) {
  staffTimes = JSON.parse(fs.readFileSync(DATA_FILE));
}

function saveData() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(staffTimes, null, 2));
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

client.on("messageCreate", message => {

  if (message.author.bot) return;

  const args = message.content.split(" ");
  const command = args[0].toLowerCase();

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
        value: `${hours}h ${minutes}m`,
        inline: true
      })
      .setFooter({ text: "Issued by the Office of the Censor" })
      .setTimestamp();

    message.reply({ embeds: [embed] });
  }

  /* LEADERBOARD */

  if (command === "!staffleaderboard") {

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

    message.reply({ embeds: [embed] });
  }

  /* NEW WEEK RESET */

  if (command === "!newweek") {

    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      message.reply("Only administrators may begin a new week of records.");
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
  }

  /* HELP COMMAND */

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
          "`!newweek` — Begin a new week of records (Admin only)"
        },
        {
          name: "ℹ️ Information",
          value:
          "`!help` — Display the command register"
        }
      )

      .setFooter({ text: "Issued by the Office of the Censor" })
      .setTimestamp();

    message.reply({ embeds: [embed] });
  }

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

client.login(process.env.DISCORD_TOKEN);
