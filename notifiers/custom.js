const { sendMessage, deleteMessage } = require('../utils/messages')
const moment = require('moment')
const fs = require('fs')
const path = require('path')
const { v4: uuid } = require('uuid')
const logger = require('../utils/logger')

module.exports = class CustomEvents {
    constructor(client) {
        this.client = client
        this.file_name = 'CustomEvents.json'

        this.custom_events = { events: [], recurring_events: [] }
        if (fs.existsSync(path.join('data', this.file_name))) {
            const file = fs.readFileSync(path.join('data', this.file_name), {
                encoding: 'utf8',
            })
            this.custom_events = JSON.parse(file) || { events: [], recurring_events: [] }
        }

        this.custom_events.recurring_events.forEach((re) => {
            this.initCustomEventRecurrence(re.uuid)
        })

        client.on('interactionCreate', async (interaction) => {
            if (!interaction.isButton()) return

            if (interaction.customId.startsWith('custom-event')) {
                await deleteMessage(this.channel(), interaction.message.id)
            }
        })

        client.on('interactionCreate', async (interaction) => {
            if (!interaction.isCommand()) return

            if (interaction.commandName === 'custom-event')
                switch (interaction.options.getSubcommand()) {
                    case 'create':
                        await this.createCustomEvent(interaction)
                        break
                }
            else if (interaction.commandName === 'custom-event-recurring')
                switch (interaction.options.getSubcommand()) {
                    case 'create':
                        await this.createCustomEventRecurrence(interaction)
                        break
                    case 'list':
                        await this.listCustomEventRecurrence(interaction)
                        break
                    case 'delete':
                        await this.deleteCustomEventRecurrence(interaction)
                        break
                }
        })
    }

    save() {
        fs.writeFileSync(path.join('data', this.file_name), JSON.stringify(this.custom_events))
    }

    channel() {
        return this.client.guilds.cache
            .find((guild) => guild.id === '914899103035564132')
            .channels.cache.find((channel) => channel.id === '1051147088676798504')
    }

    createCustomEvent(interaction) {
        const date = moment(interaction.options.get('date').value, 'YYYY-MM-DD HH:mm')

        console.log(
            interaction.options.get('date'),
            date.isValid(),
            date.isBefore(moment()),
            date.format('YYYY-MM-DD HH:mm:ss')
        )
        if (!date.isValid() || date.isBefore(moment())) {
            interaction.reply({
                content: '***Invalid date.***\n\nPlease use the following format: YYYY-MM-DD HH:mm',
                ephemeral: true,
            })
        } else {
            interaction.reply({
                content: 'Creating custom event...',
                ephemeral: true,
            })
        }
    }

    createCustomEventRecurrence(interaction) {
        const event_uuid = uuid()
        const recurrence = interaction.options.get('recurrence').value
        const title = interaction.options.get('title').value
        const description = interaction.options.get('description')?.value
        const link = interaction.options.get('link')?.value
        const startAt = interaction.options.get('start-at')?.value

        let nextOccurrence = recurrence * 60
        const startAtDate = moment(startAt, 'YYYY-MM-DD HH:mm')

        if (startAtDate.isValid()) {
            nextOccurrence = startAtDate.diff(moment(), 'seconds')
        }

        const nextOccurrenceUnix = moment().add(nextOccurrence, 'seconds').unix()

        interaction.reply({
            content: `Event "${title}" Created\nFirst occurrence <t:${nextOccurrenceUnix}:R>`,
            ephemeral: true,
        })

        this.custom_events.recurring_events.push({
            uuid: event_uuid,
            recurrence,
            link,
            title,
            description,
            nuxt_occurrence: startAt,
        })

        this.initCustomEventRecurrence(event_uuid)

        this.save()
    }

    listCustomEventRecurrence(interaction) {
        interaction.reply({
            embeds: [
                {
                    title: 'List of Recurring Events',
                    fields: this.custom_events.recurring_events.map((re) => {
                        const nextOccurrence = re.recurrence * 60 * 1000
                        let nextOccurrenceDate = moment(re.nuxt_occurrence, 'YYYY-MM-DD HH:mm:ss')

                        if (!nextOccurrenceDate.isValid()) {
                            nextOccurrenceDate = moment().add(nextOccurrence, 'milliseconds')
                        }

                        return {
                            name: `Title: ${re.title}`,
                            value: [
                                re.description && `Description: \`${re.description}\``,
                                `UUID: \`${re.uuid}\``,
                                `Next notification <t:${nextOccurrenceDate.unix()}:R>`,
                            ].join('\n'),
                            inline: true,
                        }
                    }),
                },
            ],
            ephemeral: true,
        })
    }

    deleteCustomEventRecurrence(interaction) {
        const uuid = interaction.options.get('uuid').value

        if (uuid === 'all') {
            this.custom_events.recurring_events = []
            this.save()

            interaction.reply({
                content: 'All Recurring Event Deleted',
                ephemeral: true,
            })

            return
        }

        const event_index = this.custom_events.recurring_events.findIndex((re) => re.uuid === uuid)

        if (event_index >= 0) {
            this.custom_events.recurring_events.splice(event_index, 1)
            this.save()

            interaction.reply({
                content: 'Recurring Event Deleted',
                ephemeral: true,
            })
        } else {
            interaction.reply({
                content: 'Recurring Event Does not exist',
                ephemeral: true,
            })
        }
    }

    initCustomEventRecurrence(uuid) {
        const event = this.custom_events.recurring_events.find((re) => re.uuid === uuid)

        if (event) {
            let nextOccurrence = event.recurrence * 60 * 1000
            let startAtDate = moment(event.nuxt_occurrence, 'YYYY-MM-DD HH:mm:ss')

            if (startAtDate.isValid()) {
                nextOccurrence = startAtDate.diff(moment(), 'seconds') * 1000
            } else {
                startAtDate = moment()
            }

            setTimeout(() => {
                event.nuxt_occurrence = startAtDate
                    .clone()
                    .add(event.recurrence * 60, 'seconds')
                    .format('YYYY-MM-DD HH:mm:ss')
                this.save()

                this.sendCustomEventRecurrence(uuid)
            }, nextOccurrence)
        }
    }

    sendCustomEventRecurrence(uuid) {
        const event = this.custom_events.recurring_events.find((re) => re.uuid === uuid)

        if (event) {
            sendMessage(
                this.channel(),
                '973949109113348136',
                {
                    title: event.title,
                    description: event.description,
                    url: event.link,
                    deleteButton: true,
                },
                [],
                `custom-event-recurring-${uuid}-${moment().unix()}`
            ).then()

            logger(`CustomEventRecurring - Sent (${uuid})!`)

            this.initCustomEventRecurrence(uuid)
        }
    }
}
