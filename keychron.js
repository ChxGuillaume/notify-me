const axios = require('axios');
const cheerio = require('cheerio');
const cron = require('node-cron');
const logger = require('../utils/logger');

module.exports = class Keychron {

    constructor(client) {
        this.client = client;
        this.keyboard_vailable = false;

        cron.schedule('*/5 * * * *', () => {
            this.fetch();
        }, {});
        this.fetch();
    }

    channel() {
        return this.client
            .guilds.cache.find(guild => guild.id === '914899103035564132')
            .channels.cache.find(channel => channel.id === '915648102340366398')
    }

    fetch() {
        const url = 'https://www.keychron.com/products/keychron-k3-wireless-mechanical-keyboard?variant=32220198994009';

        axios
            .get(url)
            .then(async (response) => {
                const $keyboardPage = cheerio.load(response.data);

                const {
                    title,
                    available,
                    options,
                    price,
                    featured_media: {preview_image: {src: image}}
                } = JSON.parse($keyboardPage('[aria-label="Variant JSON"]').text().trim());

                if (available !== this.keyboard_vailable && available)
                    this.notify({title, available, options, price, image, url});

                this.keyboard_vailable = available;

                logger('Keychron Checked!');
            })
    }

    notify(shoe) {
        const {title, options, price, image, url} = shoe;

        this.channel()
            .send({
                embeds: [{
                    title: title,
                    url: url,
                    thumbnail: {url: image},
                    fields: [{
                        name: 'Price',
                        value: `$${price / 100}`,
                    }, {
                        name: 'Options',
                        value: options.join('\n\n')
                    }]
                }],
                components: [{
                    type: 1,
                    components: [{
                        style: 5,
                        label: `Buy Now`,
                        url: url,
                        disabled: false,
                        type: 2
                    }]
                }],
            })
    }

}
