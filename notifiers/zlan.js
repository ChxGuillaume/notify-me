const cron = require('node-cron');
const {sendMessage} = require('../utils/messages');
const fs = require("fs");
const puppeteer = require('puppeteer');
const { imgDiff } = require("img-diff-js");
const logger = require("../utils/logger");

module.exports = class ZLan {
    constructor(client) {
        this.client = client;

        cron.schedule('0,30 8-20 * * *', () => {
            this.fetch();
        }, {});

        this.fetch();
    }

    channel() {
        return this.client
            .guilds.cache.find(guild => guild.id === '914899103035564132')
            .channels.cache.find(channel => channel.id === '960524661416943657')
    }

    fetch() {

        (async () => {
            logger('ZLAN - Starting Puppeteer', 'yellow');
            const browser = await puppeteer.launch();
            const zlan = await browser.newPage();
            await zlan.goto('https://www.weezevent.com/widget_billeterie.php?id_evenement=820287&widget_key=E820287&locale=fr_FR&color_primary=150d4a&width_auto=1&o=minisite_v2&code=65388&neo=1');
            await zlan.waitForNavigation();
            await zlan.screenshot({ path: 'data/current.png' });

            await browser.close();

            if (!fs.existsSync('data/previous.png')) {
                logger('ZLAN - Init Screenshot', 'yellow');
                fs.renameSync('data/current.png', 'data/previous.png');
                return;
            }

            imgDiff({
                actualFilename: 'data/previous.png',
                expectedFilename: 'data/current.png',
                diffFilename: 'data/diff.png',
            }).then(result => {
                if (!result.imagesAreSame) {
                    sendMessage(this.channel(), '960524570396360714',                         {
                        title: 'ZUnivers Daily Loots',
                        description: 'Lets go BUY TA PLACE!',
                        url: 'https://my.weezevent.com/zlan-2022-spectateurs',
                        image: 'https://pbs.twimg.com/profile_images/1236664323847700480/335uCMHt_400x400.png',
                        buttonText: 'HTDPlaces',
                    }, [], null, ['data/diff.png']);
                }

                fs.renameSync('data/current.png', 'data/previous.png');

                logger('ZLAN - Checked');
            });
        })();
    }

}
