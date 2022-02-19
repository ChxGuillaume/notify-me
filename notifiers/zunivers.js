const axios = require('axios');
const cron = require('node-cron');
const logger = require('../utils/logger');
const sendMessage = require('../utils/sendMessage');

module.exports = class ZUnivers {
    constructor(client) {
        this.client = client;

        cron.schedule('0,10 12 * * *', () => {
            this.fetchVortexStatus();
            this.fetchLootsStreak();
        }, {});

        this.fetchVortexStatus();
        this.fetchLootsStreak();
    }

    channel() {
        return this.client
            .guilds.cache.find(guild => guild.id === '914899103035564132')
            .channels.cache.find(channel => channel.id === '943448048753840159')
    }

    fetchLootsStreak() {
        axios
            .get('https://zunivers-api.zerator.com/public/user/NiNoN%239999')
            .then(async ({data}) => {
                const {lootStreak} = data;

                if (!lootStreak[lootStreak.length - 1].loots) {
                    sendMessage(
                        this.channel(),
                        '943447932160606228',
                        {
                            title: 'ZUnivers Daily Loots',
                            url: 'https://canary.discord.com/channels/138283154589876224/808432657838768168',
                            image: 'https://zunivers.zerator.com/img/logo.ac4a9e45.png',
                            buttonText: 'Daily Channel',
                        }
                    );

                    setTimeout(() =>{
                        this.fetchLootsStreak();
                    }, 1000 * 60 * 20);
                }

                logger('ZUnivers Loot Streak Checked!');
            });
    }

    fetchVortexStatus() {
        axios
            .get('https://zunivers-api.zerator.com/public/user/NiNoN%239999/activity')
            .then(async ({data}) => {
                const {towerStats: { 0: { towerName, maxFloorIndex, towerLogCount } }} = data;

                if (this.actualVortexTries === towerLogCount) {
                    sendMessage(
                        this.channel(),
                        '943447932160606228',
                        {
                            title: 'ZUnivers Vortex Tries',
                            description: `${towerName} - floor ${maxFloorIndex + 1}/6`,
                            url: 'https://canary.discord.com/channels/138283154589876224/824253593892290561',
                            image: 'https://zunivers.zerator.com/img/logo.ac4a9e45.png',
                            buttonText: 'Vortex Channel',
                        }
                    );

                    setTimeout(() =>{
                        this.fetchLootsStreak();
                    }, 1000 * 60 * 20);
                }

                this.actualVortexTries = towerLogCount;

                logger('ZUnivers Vortex Status Checked!');
            });
    }

}
