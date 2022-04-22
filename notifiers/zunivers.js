const moment = require('moment');
const axios = require('axios');
const cron = require('node-cron');
const logger = require('../utils/logger');
const {sendMessage, checkAndDeleteMessage} = require('../utils/messages');

module.exports = class ZUnivers {
    constructor(client) {
        this.client = client;

        cron.schedule('0,30 8-20 * * *', () => {
            this.fetchVortexStatus();
            this.fetchLootsStreak();
        }, {});

        this.fetchVortexStatus();
        this.fetchLootsStreak();

        client.on('interactionCreate', async interaction => {
            if (!interaction.isCommand()) return;

            if (interaction.commandName === 'zunivers-daily') await this.fetchLootsStreakInteraction(interaction);
        });
    }

    channel() {
        return this.client
            .guilds.cache.find(guild => guild.id === '914899103035564132')
            .channels.cache.find(channel => channel.id === '943448048753840159')
    }

    fetchLootsStreak() {
        if (this.lootsStreakSpecifiedDate) return;

        axios
            .get('https://zunivers-api.zerator.com/public/user/NiNoN%239999/activity')
            .then(async ({data}) => {
                const {lootInfos} = data;

                if (!lootInfos.pop().count) {
                    await sendMessage(
                        this.channel(),
                        '943447932160606228',
                        {
                            title: 'ZUnivers Daily Loots',
                            url: 'https://canary.discord.com/channels/138283154589876224/808432657838768168',
                            image: 'https://zunivers-feedback.zerator.com/static/images/logos/wx60VeZuFf640PFuKs4J8WwrkQQ07nrKbEFrNCtONh2Qhc0eKsX8xaguscSlTwTQ-zu_petit-vf-01.png?size=200',
                            buttonText: 'Daily Channel',
                        }, [], 'zunivers-daily-loots'
                    );
                } else {
                    await checkAndDeleteMessage(this.channel(), 'zunivers-daily-loots');
                }

                logger('ZUnivers - Loot Streak Checked!');
            });
    }

    async fetchLootsStreakInteraction(interaction) {
        const hours = interaction.options.get('hour').value;
        const minutes = interaction.options.get('minute')?.value || 0;
        const date = moment(`${hours}:${minutes}`, 'HH:mm');
        if (date.isBefore(moment())) date.add(1, 'day');

        this.lootsStreakSpecifiedDate = date.toDate();
        setTimeout(() => {
            this.lootsStreakSpecifiedDate = null;
            this.fetchLootsStreak();
        }, date.diff(moment()));

        await interaction.reply({ content: `Will check for you <t:${date.unix()}:R>`, ephemeral: true });
    }

    fetchVortexStatus() {
        axios
            .get('https://zunivers-api.zerator.com/public/tower/NiNoN%239999')
            .then(async ({data}) => {
                const {
                    towerStats: {
                        0: {
                            towerName,
                            maxFloorIndex,
                            towerLogCount,
                            towerSeasonBeginDate,
                            towerSeasonEndDate
                        }
                    }
                } = data;

                const maxTries = moment().diff(moment(towerSeasonBeginDate).subtract(12, 'hours'), 'days') * 2;

                if (maxFloorIndex !== 5 && towerLogCount < maxTries && moment().isBefore(towerSeasonEndDate)) {
                    await sendMessage(
                        this.channel(),
                        '943447932160606228',
                        {
                            title: 'ZUnivers Vortex Tries',
                            description: `${towerName} - floor ${maxFloorIndex + 1}/6\n\n${maxTries - towerLogCount} tries left!`,
                            url: 'https://canary.discord.com/channels/138283154589876224/824253593892290561',
                            image: 'https://zunivers-feedback.zerator.com/static/images/logos/wx60VeZuFf640PFuKs4J8WwrkQQ07nrKbEFrNCtONh2Qhc0eKsX8xaguscSlTwTQ-zu_petit-vf-01.png?size=200',
                            buttonText: 'Vortex Channel',
                        }, [], 'zuni-vortex-tries'
                    );
                } else {
                    await checkAndDeleteMessage(this.channel(), 'zuni-vortex-tries');
                }

                logger('ZUnivers - Vortex Status Checked!');
            });
    }

}
