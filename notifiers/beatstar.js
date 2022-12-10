const { TwitterApi, ETwitterStreamEvent } = require('twitter-api-v2')
const { sendMessage, deleteMessage } = require('../utils/messages')

module.exports = class BeatStar {
    constructor(client) {
        this.client = client
        this.twitter = new TwitterApi(process.env.TWITTER_TOKEN).readOnly

        this.subscribeTweets().then()

        client.on('interactionCreate', async (interaction) => {
            if (!interaction.isButton()) return

            if (interaction.customId.startsWith('beatstar')) {
                await deleteMessage(this.channel(), interaction.message.id)
            }
        })
    }

    channel() {
        return this.client.guilds.cache
            .find((guild) => guild.id === '914899103035564132')
            .channels.cache.find((channel) => channel.id === '972444264569118750')
    }

    async subscribeTweets() {
        await this.twitter.v2.updateStreamRules({
            add: [{ value: 'from:playbeatstar', tag: 'beatstar tweets' }],
        })

        const streamFilter = await this.twitter.v2.searchStream()
        streamFilter.on(ETwitterStreamEvent.Data, ({ data: { id } }) => this.checkTweet(id))
        streamFilter.on(ETwitterStreamEvent.Connected, () => console.log('Stream is started.'))

        await streamFilter.connect({
            autoReconnect: true,
            autoReconnectRetries: Infinity,
        })
    }

    async checkTweet(tweet_id) {
        const tweetResponse = await this.twitter.v2.singleTweet(tweet_id, {
            expansions: 'attachments.media_keys',
            'media.fields': 'url',
            'tweet.fields': ['attachments', 'entities', 'public_metrics'],
        })

        const { data: tweet } = tweetResponse

        const media = tweetResponse.includes?.media

        tweet.entities.urls = tweet.entities.urls.filter((e) => {
            return !tweet.attachments.media_keys.includes(e?.media_key)
        })

        tweet.entities.urls.forEach((e) => (tweet.text = tweet.text.replace(e.url, '').trim()))

        if (tweet.entities.urls[0]?.expanded_url)
            sendMessage(
                this.channel(),
                '972444149473234954',
                {
                    title: 'BeatStar Tweet',
                    description: tweet.text,
                    url: tweet.entities.urls[0]?.expanded_url,
                    image: media[0]?.url,
                    deleteButton: true,
                },
                [],
                `beatstar-tweet-${tweet.id}`
            )
    }
}
