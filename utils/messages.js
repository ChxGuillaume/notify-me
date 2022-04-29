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
    const { title, description, url, image, price, options, buttonText } = item

    const message = await channel.send({
        content: `<@&${roleId}>`,
        embeds: [
            {
                title: title,
                url: url,
                description: description,
                thumbnail: { url: image },
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
        components: url
            ? [
                  {
                      type: 1,
                      components: [
                          {
                              style: 5,
                              label: buttonText || `Buy Now`,
                              url: url,
                              disabled: false,
                              type: 2,
                          },
                      ],
                  },
              ]
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
