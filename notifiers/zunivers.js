const moment = require('moment')
const axios = require('axios')
const cron = require('node-cron')
const logger = require('../utils/logger')
const { sendMessage, checkAndDeleteMessage } = require('../utils/messages')
const { z } = require('zod')

const FormData = z.record(
    z.string(),
    z.array(
        z.object({
            amount: z.number(),
            baseAmount: z.number(),
            corporationAmount: z.number(),
            date: z.string().datetime({ local: true }),
            subscriptionAmount: z.number(),
            type: z.enum(['DAILY', 'WEEKLY']),
        })
    )
)

module.exports = class ZUnivers {
    constructor(client) {
        this.client = client

        cron.schedule(
            '0,30 8-20 * * *',
            () => {
                this.fetchVortexStatus()
                this.fetchLootsStreak()
            },
            {}
        )

        this.fetchVortexStatus()
        this.fetchLootsStreak()

        client.on('interactionCreate', async (interaction) => {
            if (!interaction.isCommand()) return

            if (interaction.commandName === 'zunivers')
                switch (interaction.options.getSubcommand()) {
                    case 'daily':
                        await this.fetchLootsStreakInteraction(interaction)
                        break
                }
        })
    }

    channel() {
        return this.client.guilds.cache
            .find((guild) => guild.id === '914899103035564132')
            .channels.cache.find((channel) => channel.id === '943448048753840159')
    }

    fetchLootsStreak() {
        if (this.lootsStreakSpecifiedDate) return

        axios
            .get('https://zunivers-api.zerator.com/public/loot/nekotiki?year=0', {
                headers: { 'x-zunivers-rulesettype': 'NORMAL' },
            })
            .then(async ({ data }) => {
                const result = FormData.safeParse(data)

                if (!result.success) {
                    logger('ZUnivers - Loot Streak - Error:' + result.error.toString())
                    await sendMessage(
                        this.channel(),
                        '943447932160606228',
                        {
                            title: 'ZUnivers Daily Loot',
                            description: `Error with the API, please check manually`,
                            url: 'https://canary.discord.com/channels/138283154589876224/808432657838768168',
                            thumbnail: 'https://nekotiki.fr/zunivers.png',
                            buttonText: 'Daily Channel',
                        },
                        [],
                        'zunivers-daily-loots'
                    )
                    return
                }

                try {
                    const currentDate = moment()
                    const currentDateData = data[currentDate.format('YYYY-MM-DD')] || []

                    const hasDaily = currentDateData.some((event) => event.type === 'DAILY')
                    const hasWeekly = currentDateData.some((event) => event.type === 'WEEKLY')

                    const lastWeekly7DaysAgoData =
                        data[currentDate.clone().subtract(7, 'days').format('YYYY-MM-DD')] || []
                    const lastWeekly7DaysAgo = lastWeekly7DaysAgoData.some((event) => event.type === 'WEEKLY')

                    let hasLootPast6Days = false

                    for (let day = 1; day < 7; day++) {
                        const previousDate = currentDate.clone().subtract(day, 'days')
                        const previousDateData = data[previousDate.format('YYYY-MM-DD')]

                        if (!previousDateData || !previousDateData.some((event) => event.type === 'DAILY')) {
                            hasLootPast6Days = false
                            break
                        }

                        hasLootPast6Days = true
                    }

                    const notifyWeekly = !hasWeekly && hasLootPast6Days && lastWeekly7DaysAgo

                    let title = 'ZUnivers Daily Loot'
                    let description = `command (/journa)`

                    if (!hasDaily && notifyWeekly) {
                        title = 'ZUnivers Daily Loot (+bonus)'
                        description = `command (/journa + /bonus)`
                    } else if (notifyWeekly) {
                        title = 'ZUnivers Daily Bonus'
                        description = `command (/bonus)`
                    }

                    if (!hasDaily || notifyWeekly) {
                        await sendMessage(
                            this.channel(),
                            '943447932160606228',
                            {
                                title,
                                description,
                                url: 'https://canary.discord.com/channels/138283154589876224/808432657838768168',
                                thumbnail: 'https://nekotiki.fr/zunivers.png',
                                buttonText: 'Daily Channel',
                            },
                            [],
                            'zunivers-daily-loots'
                        )
                    } else {
                        await checkAndDeleteMessage(this.channel(), 'zunivers-daily-loots')
                    }

                    logger('ZUnivers - Loot Streak - Checked!')
                } catch (e) {
                    logger('ZUnivers - Loot Streak - Error:' + e.toString())

                    await sendMessage(
                        this.channel(),
                        '943447932160606228',
                        {
                            title: 'ZUnivers Daily Loot',
                            description: `Error with the Calculation, please check manually`,
                            url: 'https://canary.discord.com/channels/138283154589876224/808432657838768168',
                            thumbnail: 'https://nekotiki.fr/zunivers.png',
                            buttonText: 'Daily Channel',
                        },
                        [],
                        'zunivers-daily-loots'
                    )
                }
            })
    }

    async fetchLootsStreakInteraction(interaction) {
        const hours = interaction.options.get('hour').value
        const minutes = interaction.options.get('minute')?.value || 0
        const date = moment(`${hours}:${minutes}`, 'HH:mm')
        if (date.isBefore(moment())) date.add(1, 'day')

        this.lootsStreakSpecifiedDate = date.toDate()
        setTimeout(() => {
            this.lootsStreakSpecifiedDate = null
            this.fetchLootsStreak()
        }, date.diff(moment()))

        await interaction.reply({
            content: `Will check for you <t:${date.unix()}:R>`,
            ephemeral: true,
        })
    }

    fetchVortexStatus() {
        axios
            .get('https://zunivers-api.zerator.com/public/tower/nekotiki', {
                headers: { 'x-zunivers-rulesettype': 'NORMAL' },
            })
            .then(async ({ data }) => {
                const {
                    towerStats: {
                        0: { towerName, maxFloorIndex, towerLogCount, towerSeasonBeginDate, towerSeasonEndDate },
                    },
                } = data

                const maxTries = moment().diff(moment(towerSeasonBeginDate).subtract(12, 'hours'), 'days') * 2

                if (maxFloorIndex !== 5 && towerLogCount < maxTries && moment().isBefore(towerSeasonEndDate)) {
                    await sendMessage(
                        this.channel(),
                        '943447932160606228',
                        {
                            title: 'ZUnivers Vortex Tries',
                            description: `${towerName} - floor ${maxFloorIndex + 1}/6
                            \n\n
                            ${maxTries - towerLogCount} tries left!`,
                            url: 'https://canary.discord.com/channels/138283154589876224/824253593892290561',
                            thumbnail: 'https://nekotiki.fr/zunivers.png',
                            buttonText: 'Vortex Channel',
                        },
                        [],
                        'zuni-vortex-tries'
                    )
                } else {
                    await checkAndDeleteMessage(this.channel(), 'zuni-vortex-tries')
                }

                logger('ZUnivers - Vortex Status - Checked!')
            })
    }
}
