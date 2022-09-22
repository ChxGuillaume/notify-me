const axios = require('axios')
const cheerio = require('cheerio')
const cron = require('node-cron')
const logger = require('../utils/logger')
const { sendMessage } = require('../utils/messages')

module.exports = class DiscordSnowgiving {
    constructor(client) {
        this.client = client
        this.discord_product = false

        cron.schedule(
            '*/5 * * * *',
            () => {
                this.fetch(
                    'https://discordmerch.com/products/snowsgiving-full-zip-bundle?variant=39637669740643'
                )
            },
            {}
        )
        this.fetch(
            'https://discordmerch.com/products/snowsgiving-full-zip-bundle?variant=39637669740643'
        )
    }

    channel() {
        return this.client.guilds.cache
            .find((guild) => guild.id === '914899103035564132')
            .channels.cache.find(
                (channel) => channel.id === '917573295421915186'
            )
    }

    fetch(url) {
        axios
            .get(url)
            .then(async (response) => {
                const $articlePage = cheerio.load(response.data)

                const {
                    images: { 0: image },
                    variants,
                } = JSON.parse(
                    $articlePage('script')
                        .toArray()
                        .find(
                            (e) =>
                                $articlePage(e).attr('id') ===
                                'ProductJson-product-template'
                        ).children[0].data
                )

                const {
                    name: title,
                    available,
                    price,
                    options,
                } = variants.find((e) => e.title === 'LG')

                if (available !== this.discord_product && available)
                    sendMessage(this.channel(), {
                        title,
                        available,
                        options,
                        price: price / 100,
                        image: `https:${image}`,
                        url,
                    })

                this.discord_product = available

                logger('Discord Snowgiving - Checked!')
            })
            .catch(() => {
                logger('Discord Snowgiving - Error!')
            })
    }
}
