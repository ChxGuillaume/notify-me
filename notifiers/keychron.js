const axios = require('axios');
const cheerio = require('cheerio');
const cron = require('node-cron');
const logger = require('../utils/logger');
const {sendMessage, checkAndDeleteMessage} = require('../utils/messages');
const fs = require("fs");
const path = require("path");

module.exports = class Keychron {

    constructor(client) {
        this.client = client;
        this.file_name = 'Keychron.json';

        this.keyboard_vailable = {};
        if (fs.existsSync(path.join('data', this.file_name))) {
            const file = fs.readFileSync(path.join('data', this.file_name), {encoding: 'utf8'});
            this.keyboard_vailable = JSON.parse(file) || {};
        }

        cron.schedule('*/5 * * * *', () => {
            this.fetch('https://www.keychron.com/products/keychron-k5-ultra-slim-wireless-mechanical-keyboard?variant=39559179108441');
            this.fetch('https://www.keychron.com/products/low-profile-keychron-optical-switch-set-87-pcs?variant=32264204615769');
            this.fetch('https://www.keychron.com/products/keychron-custom-coiled-cable?variant=39408315826265');
        }, {});
        this.fetch('https://www.keychron.com/products/keychron-k5-ultra-slim-wireless-mechanical-keyboard?variant=39559179108441');
        this.fetch('https://www.keychron.com/products/low-profile-keychron-optical-switch-set-87-pcs?variant=32264204615769');
        this.fetch('https://www.keychron.com/products/keychron-custom-coiled-cable?variant=39408315826265');
    }

    save() {
        fs.writeFileSync(path.join('data', this.file_name), JSON.stringify(this.keyboard_vailable));
    }

    channel() {
        return this.client
            .guilds.cache.find(guild => guild.id === '914899103035564132')
            .channels.cache.find(channel => channel.id === '915648102340366398')
    }

    fetch(url) {
        axios
            .get(url)
            .then(async (response) => {
                const $keyboardPage = cheerio.load(response.data);

                const {
                    name: title,
                    available,
                    options,
                    price,
                    featured_media: {preview_image: {src: image}}
                } = JSON.parse($keyboardPage('[aria-label="Variant JSON"]').text().trim());

                if (available !== this.keyboard_vailable[url] && available) {
                    await sendMessage(
                        this.channel(),
                        '921108721642389524',
                        {
                            title,
                            url,
                            image,
                            price: `$${price / 100}`,
                            options
                        }, [], 'keychron-' + url
                    );
                } else if (!available) {
                    await checkAndDeleteMessage(this.channel(), 'keychron-' + url);
                }

                this.keyboard_vailable[url] = available;

                this.save();

                logger('Keychron Checked!');
            });
    }

}
