module.exports = function sendMessage(channel, roleId, item, addedFields = []) {
    const {title, url, image, price, options, buttonText} = item;

    channel
        .send({
            content: `<@&${roleId}>`,
            embeds: [{
                title: title,
                url: url,
                thumbnail: {url: image},
                fields: price && options ? [{
                    name: 'Price',
                    value: `${price}`,
                }, {
                    name: 'Details',
                    value: options.join('\n\n')
                }, ...addedFields] : undefined
            }],
            components: url ? [{
                type: 1,
                components: [{
                    style: 5,
                    label: buttonText || `Buy Now`,
                    url: url,
                    disabled: false,
                    type: 2
                }]
            }] : undefined,
        })
};
