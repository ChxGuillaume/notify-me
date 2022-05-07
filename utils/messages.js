const fs = require('fs')
const path = require('path')
let messages = {}

if (fs.existsSync(path.join('data', 'Messages.json'))) {
    const data = fs.readFileSync(path.join('data', 'Messages.json'), {
        encoding: 'utf8',
    })
    messages = JSON.parse(data)
}

function save() {
    fs.writeFileSync(
        path.join('data', 'Messages.json'),
        JSON.stringify(messages)
    )
}

async function sendMessage(
    channel,
    roleId,
    item,
    addedFields = [],
    messageTag = null,
    files = []
) {
    const {
        title,
        description,
        url,
        thumbnail,
        image,
        price,
        options,
        buttonText,
        deleteButton,
    } = item

    const buttons = []

    if (url)
        buttons.push({
            type: 2,
            style: 5,
            label: buttonText || 'Link',
            url: url,
        })

    if (deleteButton)
        buttons.push({
            type: 2,
            custom_id: `${messageTag}`,
            style: 4,
            emoji: '🗑',
        })

    const message = await channel.send({
        content: `<@&${roleId}>`,
        embeds: [
            {
                title: title,
                url: url,
                description: description,
                thumbnail: { url: thumbnail },
                image: { url: image },
                fields:
                    price && options
                        ? [
                              {
                                  name: 'Price',
                                  value: `${price}`,
                              },
                              {
                                  name: 'Details',
                                  value: options.join('\n\n'),
                              },
                              ...addedFields,
                          ]
                        : undefined,
            },
        ],
        components: buttons.length
            ? [{ type: 1, components: buttons }]
            : undefined,
        files,
    })

    if (messageTag) {
        if (messages[messageTag]) {
            await deleteMessage(channel, messages[messageTag])
        }

        messages[messageTag] = message.id
    }

    save()
}

async function checkAndDeleteMessage(channel, messageTag) {
    if (messages[messageTag]) {
        await deleteMessage(channel, messages[messageTag])
        delete messages[messageTag]
        save()
    }
}

async function deleteMessage(channel, messageId) {
    try {
        const message = await channel.messages.fetch(messageId)
        if (message) return await message.delete()
    } catch (e) {
        return false
    }

    return null
}

module.exports = { sendMessage, deleteMessage, checkAndDeleteMessage }
