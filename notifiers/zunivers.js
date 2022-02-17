const axios = require('axios');
const cron = require('node-cron');
const logger = require('../utils/logger');
const sendMessage = require('../utils/sendMessage');

module.exports = class ZUnivers {

    constructor(client) {
        this.client = client;

        cron.schedule('* 12 * * *', () => {
            this.fetch('https://zunivers-api.zerator.com/public/user/NiNoN%239999');
        }, {});
        this.fetch('https://zunivers-api.zerator.com/public/user/NiNoN%239999');
    }

    channel() {
        return this.client
            .guilds.cache.find(guild => guild.id === '914899103035564132')
            .channels.cache.find(channel => channel.id === '943448048753840159')
    }

    fetch(url) {
        axios
            .get(url)
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

                    setTimeout(() => {
                        this.fetch(url);
                    }, 1000 * 60 * 15);
                }

                logger('ZUnivers Checked!');
            });
    }

}
