const { sendMessage, deleteMessage } = require('../utils/messages')
const moment = require('moment')

module.exports = class CustomEvents {
    constructor(client) {
        this.client = client

        client.on('interactionCreate', async (interaction) => {
            if (!interaction.isCommand()) return

            if (interaction.commandName === 'custom-event')
                switch (interaction.options.getSubcommand()) {
                    case 'create':
                        await this.createCustomEvent(interaction)
                        break
                }
        })
    }

    channel() {
        return this.client.guilds.cache
            .find((guild) => guild.id === '914899103035564132')
            .channels.cache.find(
                (channel) => channel.id === '973949685075165254'
            )
    }

    createCustomEvent(interaction) {
        const date = moment(
            interaction.options.get('date').value,
            'YYYY-MM-DD HH:mm',
            true
        )

        console.log(
            interaction.options.get('date'),
            date.isValid(),
            date.isBefore(moment()),
            date.format('YYYY-MM-DD HH:mm:ss')
        )
        if (!date.isValid() || date.isBefore(moment())) {
            interaction.reply({
                content:
                    '***Invalid date.***\n\nPlease use the following format: YYYY-MM-DD HH:mm',
                ephemeral: true,
            })
        } else {
            interaction.reply({
                content: 'Creating custom event...',
                ephemeral: true,
            })
        }
    }
}
