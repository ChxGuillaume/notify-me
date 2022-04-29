require('colors')
require('dotenv').config()
const { Client, Intents } = require('discord.js')
const client = new Client({ intents: [Intents.FLAGS.GUILDS] })

const { REST } = require('@discordjs/rest')
const { Routes } = require('discord-api-types/v9')

// const DiscordSnowgiving = require('./notifiers/discord-snowgiving');
const ShopAnthonyWang = require('./notifiers/shopanthonywang')
const Keychron = require('./notifiers/keychron')
const ZUnivers = require('./notifiers/zunivers')
// const ZLan = require('./notifiers/zlan');

client.on('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`.yellow)

    //new DiscordSnowgiving(client);
    new ShopAnthonyWang(client)
    new Keychron(client)
    new ZUnivers(client)
    // new ZLan(client);

    try {
        console.log('Started refreshing application (/) commands.'.gray)

        await rest.put(Routes.applicationCommands(process.env.DISCORD_APP_ID), {
            body: commands,
        })

        console.log('Successfully reloaded application (/) commands.'.green)
    } catch (error) {
        console.error(error)
    }
})

client.login(process.env.DISCORD_TOKEN).then()

const commands = [
    {
        name: 'zunivers',
        description: 'Notify ZUnivers at specific hour',
        options: [
            {
                type: 1,
                name: 'daily',
                description: 'Notify ZUnivers at specific hour',
                options: [
                    {
                        type: 4,
                        name: 'hour',
                        description:
                            'Hour at which to notify check ZUnivers Daily',
                        required: true,
                        min: 0,
                        max: 23,
                    },
                    {
                        type: 4,
                        name: 'minute',
                        description:
                            'Minute at which to notify check ZUnivers Daily',
                        required: false,
                        min: 0,
                        max: 23,
                    },
                ],
            },
        ],
    },
]

const rest = new REST({ version: '9' }).setToken(process.env.DISCORD_TOKEN)
