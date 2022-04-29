const moment = require('moment')
const axios = require('axios')
const cron = require('node-cron')
const logger = require('../utils/logger')
const { sendMessage, checkAndDeleteMessage } = require('../utils/messages')

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
            .channels.cache.find(
                (channel) => channel.id === '943448048753840159'
            )
    }

    fetchLootsStreak() {
        if (this.lootsStreakSpecifiedDate) return

        axios
            .get(
                'https://zunivers-api.zerator.com/public/user/NiNoN%239999/activity'
            )
            .then(async ({ data }) => {
                const { lootInfos } = data
                const event = lootInfos.at(-1)

                let weekStreak = lootInfos
                    .slice(-7, -1)
                    .filter((event) => event.count === 1).length
                if (weekStreak === 6 && event.count === 1) weekStreak = 7

                const lootStreak = lootInfos
                    .slice()
                    .reverse()
                    .findIndex((event) => event.count === 0)

                let title = 'ZUnivers Daily Loot'
                let description = `${lootStreak} loots streak, command (!journa)`

                if (weekStreak === 6) {
                    title = 'ZUnivers Daily Loot (+bonus)'
                    description = `${lootStreak} loots streak, command (!journa + !bonus)`
                } else if (weekStreak === 7) {
                    title = 'ZUnivers Daily Bonus'
                    description = `${lootStreak} loots streak, command (!bonus)`
                }

                if (!event.count || [6, 7].includes(weekStreak)) {
                    await sendMessage(
                        this.channel(),
                        '943447932160606228',
                        {
                            title,
                            description,
                            url: 'https://canary.discord.com/channels/138283154589876224/808432657838768168',
                            image: 'https://nekotiki.fr/zunivers.png',
                            buttonText: 'Daily Channel',
                        },
                        [],
                        'zunivers-daily-loots'
                    )
                } else {
                    await checkAndDeleteMessage(
                        this.channel(),
                        'zunivers-daily-loots'
                    )
                }

                logger('ZUnivers - Loot Streak Checked!')
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
            .get('https://zunivers-api.zerator.com/public/tower/NiNoN%239999')
            .then(async ({ data }) => {
                const {
                    towerStats: {
                        0: {
                            towerName,
                            maxFloorIndex,
                            towerLogCount,
                            towerSeasonBeginDate,
                            towerSeasonEndDate,
                        },
                    },
                } = data

                const maxTries =
                    moment().diff(
                        moment(towerSeasonBeginDate).subtract(12, 'hours'),
                        'days'
                    ) * 2

                if (
                    maxFloorIndex !== 5 &&
                    towerLogCount < maxTries &&
                    moment().isBefore(towerSeasonEndDate)
                ) {
                    await sendMessage(
                        this.channel(),
                        '943447932160606228',
                        {
                            title: 'ZUnivers Vortex Tries',
                            description: `${towerName} - floor ${
                                maxFloorIndex + 1
                            }/6
                            \n\n
                            ${maxTries - towerLogCount} tries left!`,
                            url: 'https://canary.discord.com/channels/138283154589876224/824253593892290561',
                            image: 'https://nekotiki.fr/zunivers.png',
                            buttonText: 'Vortex Channel',
                        },
                        [],
                        'zuni-vortex-tries'
                    )
                } else {
                    await checkAndDeleteMessage(
                        this.channel(),
                        'zuni-vortex-tries'
                    )
                }

                logger('ZUnivers - Vortex Status Checked!')
            })
    }
}
