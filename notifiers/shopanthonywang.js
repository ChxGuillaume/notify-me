const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');
const cron = require('node-cron');
const logger = require('../utils/logger');
const sendMessage = require('../utils/sendMessage');

module.exports = class ShopAnthonyWang {

    constructor(client) {
        this.client = client;
        this.file_name = 'ShopAnthonyWang.json';

        this.shoes = {};
        if (fs.existsSync(path.join('data', this.file_name))) {
            const file = fs.readFileSync(path.join('data', this.file_name), {encoding: 'utf8'});
            this.shoes = JSON.parse(file) || {};
        }

        cron.schedule('*/5 * * * *', () => {
            this.fetch();
        }, {});
        this.fetch();
    }

    save() {
        fs.writeFileSync(path.join('data', this.file_name), JSON.stringify(this.shoes));
    }

    channel() {
        return this.client
            .guilds.cache.find(guild => guild.id === '914899103035564132')
            .channels.cache.find(channel => channel.id === '914899158375215105')
    }

    fetch() {
        axios
            .get('https://shopanthonywang.com/a/search/all?filter_shop_by_size%5B0%5D=US%2011&filter_shop_by_size%5B1%5D=US%2012', {
                headers: {
                    cookie: 'cart_currency=EUR;'
                }
            })
            .then(async (response) => {
                const $shoesPage = cheerio.load(response.data);
                const newShoes = {};

                for (const item of $shoesPage('#shopify-section-collection-template').find('.grid__item')) {
                    if ($shoesPage(item).text().trim() === 'Sorry, there are no products in this collection') continue;

                    const url = 'https://shopanthonywang.com' + $shoesPage(item).find('.grid-view-item__link').attr('href');

                    if (!this.shoes[url])
                        await axios.get(url)
                            .then(({data}) => {
                                const $shoePage = cheerio.load(data);

                                let {
                                    title,
                                    description,
                                    featured_image: image,
                                    price,
                                    variants,
                                } = JSON.parse($shoePage('script').toArray().find(e => $shoesPage(e).attr('id') === 'ProductJson-product-template').children[0].data);

                                description = $shoePage(description)
                                    .text()
                                    .replace('CHECK YOUR SIZE', '')
                                    .trim()
                                    .split('\n')
                                    .filter(el => el && el.trim());

                                image = `https:${image}`;
                                price = `${price / 100}€`;

                                variants = variants
                                    .filter(({available}) => available)
                                    .map(({title}) => (`${title}`));

                                sendMessage(
                                    this.channel(),
                                    '921116258110406717',
                                    {title, url, image, price, options: description},
                                    [{
                                        name: 'Available Sizes',
                                        value: variants.join(' - ')
                                    }]
                                );

                                newShoes[url] = true;
                            });
                    else
                        newShoes[url] = true;
                }

                this.shoes = newShoes;

                this.save();

                logger('ShopAnthonyWang Checked!');
            })
    }

}
