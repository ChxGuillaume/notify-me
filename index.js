require('colors');
require('dotenv').config();
const {Client, Intents} = require('discord.js');
const client = new Client({intents: [Intents.FLAGS.GUILDS]});

// const DiscordSnowgiving = require('./notifiers/discord-snowgiving');
const ShopAnthonyWang = require('./notifiers/shopanthonywang');
const Keychron = require('./notifiers/keychron');
const ZUnivers = require('./notifiers/zunivers');
const ZLan = require('./notifiers/zlan');

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`.yellow);

    //new DiscordSnowgiving(client);
    new ShopAnthonyWang(client);
    new Keychron(client);
    new ZUnivers(client);
    new ZLan(client);
});

client.login(process.env.DISCORD_TOKEN).then();
