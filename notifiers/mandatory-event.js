const cron = require('node-cron')
const { sendMessage } = require('../utils/messages')
const fs = require('fs')
const puppeteer = require('puppeteer')
const { imgDiff } = require('img-diff-js')
const logger = require('../utils/logger')

module.exports = class MandatoryEvent {
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
        ;(async () => {
            logger('MandatoryEvent - Starting Puppeteer', 'yellow')
            const browser = await puppeteer.launch({ args: ['--no-sandbox'] })
            console.log('-1')
            const mandatory_event = await browser.newPage()
            console.log('0')
            await mandatory_event.setDefaultNavigationTimeout(0)
            console.log('1')
            await mandatory_event.goto(
                'https://billetterie-polepixel.mapado.com/event/112636-soiree-mandatory-hammer-time'
            )
            console.log('2')
            try {
                await mandatory_event.waitForNavigation()
            } catch (e) {
                console.log(e)
            }
            console.log('3')
            await mandatory_event.screenshot({ path: 'data/current.png' })
            console.log('4')

            await browser.close()

            if (!fs.existsSync('data/mandatory_previous.png')) {
                logger('MandatoryEvent - Init Screenshot', 'yellow')
                fs.renameSync('data/mandatory_current.png', 'data/previous.png')
                return
            }

            imgDiff({
                actualFilename: 'data/mandatory_previous.png',
                expectedFilename: 'data/mandatory_current.png',
                diffFilename: 'data/mandatory_diff.png',
            }).then((result) => {
                if (!result.imagesAreSame || true) {
                    sendMessage(
                        this.channel(),
                        '993666943267651604',
                        {
                            title: 'Mandatory Event',
                            description: 'Lets go BUY TA PLACE!',
                            url: 'https://billetterie-polepixel.mapado.com/event/112636-soiree-mandatory-hammer-time',
                            image: 'https://yt3.ggpht.com/NeufpGLeaLlAocC0Nt9ajrNO22LgJjdsyjrZBlRnebXiWMmQ9ZGSCT3f15CbWbXck-irxWt3JLA=s900-c-k-c0x00ffffff-no-rj',
                            buttonText: 'HTDPlaces',
                        },
                        [],
                        null,
                        ['data/diff.png']
                    )
                }

                fs.renameSync(
                    'data/mandatory_current.png',
                    'data/mandatory_previous.png'
                )

                logger('MandatoryEvent - Checked')
            })
        })()
    }
}
