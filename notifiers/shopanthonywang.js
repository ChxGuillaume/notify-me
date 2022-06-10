const fs = require('fs')
const path = require('path')
const axios = require('axios')
const cron = require('node-cron')
const logger = require('../utils/logger')
const { sendMessage, deleteMessage } = require('../utils/messages')

module.exports = class ShopAnthonyWang {
    constructor(client) {
        this.client = client
        this.file_name = 'ShopAnthonyWang.json'

        this.shoes = {}
        if (fs.existsSync(path.join('data', this.file_name))) {
            const file = fs.readFileSync(path.join('data', this.file_name), {
                encoding: 'utf8',
            })
            this.shoes = JSON.parse(file) || {}
        }

        cron.schedule(
            '*/5 * * * *',
            () => {
                this.fetch()
            },
            {}
        )
        this.fetch()

        client.on('interactionCreate', async (interaction) => {
            if (!interaction.isButton()) return

            if (interaction.customId.startsWith('aw-new-shoes')) {
                await deleteMessage(this.channel(), interaction.message.id)

                interaction.reply({
                    content: 'Message Deleted!',
                    ephemeral: true,
                })
            }
        })
    }

    save() {
        fs.writeFileSync(
            path.join('data', this.file_name),
            JSON.stringify(this.shoes)
        )
    }

    channel() {
        return this.client.guilds.cache
            .find((guild) => guild.id === '914899103035564132')
            .channels.cache.find(
                (channel) => channel.id === '914899158375215105'
            )
    }

    fetch() {
        axios
            .get('https://shopanthonywang.com/products.json?limit=500&page=1')
            .then(({ data: { products } }) => {
                if (!this.shoes.newProducts) {
                    this.shoes.newProducts = {}

                    products.forEach((product) => this.addNewProduct(product))

                    this.save()
                } else {
                    products.forEach((product) => {
                        if (!this.shoes.newProducts[product.id]) {
                            const newProduct = this.addNewProduct(product)

                            sendMessage(
                                this.channel(),
                                '921116258110406717',
                                {
                                    title: product.title,
                                    description: product.description,
                                    url: `https://shopanthonywang.com/products/${product.handle}`,
                                    thumbnail: product.images[0].src,
                                    price: `$${product.variants[0].price}`,
                                    options: [newProduct.description],
                                    deleteButton: true,
                                },
                                [
                                    {
                                        name: 'Sizes',
                                        value: product.variants
                                            .filter((v) => v.available)
                                            .map((v) => v.title)
                                            .join(' - '),
                                    },
                                ],
                                `aw-new-shoes-${product.id}`
                            ).then()
                        }
                    })

                    this.save()

                    logger('ShopAnthonyWang Checked!')
                }
            })
    }

    addNewProduct(product) {
        return (this.shoes.newProducts[product.id] = {
            id: product.id,
            title: product.title,
            handle: product.handle,
            description: product.body_html
                .replace(/<[^>]*>|CHECK YOUR SIZE/g, '')
                .trim(),
            images: product.images,
            price: product.variants[0].price,
            variants: product.variants,
            created_at: product.created_at,
            updated_at: product.updated_at,
        })
    }
}
