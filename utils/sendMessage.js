module.exports = function sendMessage(channel, roleId, item, addedFields = []) {
    const {title, url, image, price, options} = item;

    channel
        .send({
            content: `<@&${roleId}>`,
            embeds: [{
                title: title,
                url: url,
                thumbnail: {url: image},
                fields: [{
                    name: 'Price',
                    value: `${price}`,
                }, {
                    name: 'Details',
                    value: options.join('\n\n')
                }, ...addedFields]
            }],
            components: [{
                type: 1,
                components: [{
                    style: 5,
                    label: `Buy Now`,
                    url: url,
                    disabled: false,
                    type: 2
                }]
            }],
        })
};
