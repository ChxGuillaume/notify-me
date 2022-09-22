const cron = require('node-cron')
const { sendMessage } = require('../utils/messages')
const logger = require('../utils/logger')
const axios = require('axios')

module.exports = class MandatoryShop {
    constructor(client) {
        this.client = client

        cron.schedule(
            '0,30 8-20 * * *',
            () => {
                this.fetch()
            },
            {}
        )

        this.fetch()
    }

    channel() {
        return this.client.guilds.cache
            .find((guild) => guild.id === '914899103035564132')
            .channels.cache.find(
                (channel) => channel.id === '993667089988599838'
            )
    }

    fetch() {
        axios
            .get('https://shop.mandatory.gg/products.json')
            .then(({ data }) => {
                const jersey = data.products.find(
                    (p) => p.handle === 'maillot-mandatory'
                )

                const { title, variants, images } = jersey

                if (variants.filter((e) => e.available).length)
                    sendMessage(
                        this.channel(),
                        '993666943267651604',
                        {
                            title,
                            options: [
                                variants
                                    .filter((e) => e.available)
                                    .map((e) => e.title)
                                    .join(' - '),
                            ],
                            price: variants[0].price,
                            image: `${images[0].src}`,
                            url: 'https://shop.mandatory.gg/products/maillot-mandatory',
                            deleteButton: true,
                        },
                        [],
                        `maillot-mandatory`
                    )

                logger('MandatoryShop - Checked')
            })
    }
}
