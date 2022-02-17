const axios = require('axios');
const cheerio = require('cheerio');
const cron = require('node-cron');
const logger = require('../utils/logger');

module.exports = class ShopAnthonyWang {

    constructor(client) {
        this.client = client;
        this.shoes = {};

        cron.schedule('*/5 * * * *', () => {
            this.fetch();
        }, {});
        this.fetch();
    }

    channel() {
        return this.client
            .guilds.cache.find(guild => guild.id === '914899103035564132')
            .channels.cache.find(channel => channel.id === '914899158375215105')
    }

    fetch() {
        axios
            .get('https://shopanthonywang.com/a/search/all?filter_shop_by_size=US%2011', {
                headers: {
                    cookie: 'cart_currency=EUR;'
                }
            })
            .then(async (response) => {
                const $shoesPage = cheerio.load(response.data);

                for (const item of $shoesPage('#shopify-section-collection-template').find('.grid__item')) {
                    if ($shoesPage(item).text().trim() === 'Sorry, there are no products in this collection') continue;

                    const title = $shoesPage(item).find('.h4').text().trim();
                    const link = 'https://shopanthonywang.com' + $shoesPage(item).find('.grid-view-item__link').attr('href');
                    const image = 'http:' + $shoesPage(item).find('img').data('src').replace('{width}', '512');
                    const price = parseFloat($shoesPage(item).find('.price-item--regular').text().trim().replace('€', '').replace(',', '.'));

                    if (!this.shoes[link])
                        await axios.get(link)
                            .then(({data}) => {
                                const $shoePage = cheerio.load(data);
                                let details = $shoePage('.product-single__description .p1').toArray().map(el => $shoesPage(el).text().trim());
                                details = details.filter(el => el && el !== 'CHECK YOUR SIZE');

                                this.notify({title, link, image, price, details});
                                this.shoes[link] = {title, link, image, price, details};
                            })
                }

                logger('ShopAnthonyWang Checked!');
            })
    }

    notify(shoe) {
        const {title, link, image, price, details} = shoe;

        this.channel()
            .send({
                embeds: [{
                    title: title,
                    url: link,
                    thumbnail: {url: image},
                    fields: [{
                        name: 'Price',
                        value: `${price}€`,
                    }, {
                        name: 'Details',
                        value: details.join('\n\n')
                    }]
                }],
                components: [{
                    type: 1,
                    components: [{
                        style: 5,
                        label: `Buy Now`,
                        url: link,
                        disabled: false,
                        type: 2
                    }]
                }],
            })
    }

}
