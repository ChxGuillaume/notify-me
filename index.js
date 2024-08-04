require('colors')
require('dotenv').config()
const { Client } = require('discord.js')
const client = new Client({ intents: ['Guilds'] })

const { REST } = require('@discordjs/rest')
const { Routes } = require('discord-api-types/v9')
const rest = new REST({ version: '9' }).setToken(process.env.DISCORD_TOKEN)

// const DiscordSnowgiving = require('./notifiers/discord-snowgiving');
const ShopAnthonyWang = require('./notifiers/shopanthonywang')
// const Keychron = require('./notifiers/keychron')
const ZUnivers = require('./notifiers/zunivers')
// const ZLan = require('./notifiers/zlan')
// const BeatStar = require('./notifiers/beatstar')
const CustomEvents = require('./notifiers/custom')
// const MandatoryEvent = require('./notifiers/mandatory-event')
// const MandatoryShop = require('./notifiers/mandatory-shop')

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
                        description: 'Hour at which to notify check ZUnivers Daily',
                        required: true,
                        min: 0,
                        max: 23,
                    },
                    {
                        type: 4,
                        name: 'minute',
                        description: 'Minute at which to notify check ZUnivers Daily',
                        required: false,
                        min: 0,
                        max: 23,
                    },
                ],
            },
        ],
    },
    {
        name: 'custom-event',
        description: 'Custom Events',
        options: [
            {
                type: 1,
                name: 'create',
                description: 'Create a custom event',
                options: [
                    {
                        type: 3,
                        name: 'date',
                        description: 'Date of the custom event (YYYY-MM-DD HH:mm)',
                        required: true,
                    },
                    {
                        type: 3,
                        name: 'title',
                        description: 'Title of the custom event',
                        required: true,
                    },
                    {
                        type: 3,
                        name: 'link',
                        description: 'Link of the custom event',
                        required: false,
                    },
                ],
            },
        ],
    },
    {
        name: 'custom-event-recurring',
        description: 'Custom Events Recurring',
        options: [
            {
                type: 1,
                name: 'create',
                description: 'Create a custom recurring event',
                options: [
                    {
                        type: 4,
                        name: 'recurrence',
                        description: 'Recurrence in Minutes',
                        required: true,
                    },
                    {
                        type: 3,
                        name: 'title',
                        description: 'Title of the custom event',
                        required: true,
                    },
                    {
                        type: 3,
                        name: 'description',
                        description: 'Link of the custom event',
                        required: false,
                    },
                    {
                        type: 3,
                        name: 'start-at',
                        description: 'Date of start of the custom event (YYYY-MM-DD HH:mm)',
                        required: false,
                    },
                    {
                        type: 3,
                        name: 'link',
                        description: 'Link of the custom event',
                        required: false,
                    },
                ],
            },
            {
                type: 1,
                name: 'list',
                description: 'List custom recurring events',
            },
            {
                type: 1,
                name: 'delete',
                description: 'Delete a custom recurring event',
            },
        ],
    },
]

client.on('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`.yellow)

    //new DiscordSnowgiving(client);
    new ShopAnthonyWang(client)
    // new Keychron(client)
    new ZUnivers(client)
    // new ZLan(client)
    // new BeatStar(client)
    // new MandatoryEvent(client)
    // new MandatoryShop(client)
    new CustomEvents(client)

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
