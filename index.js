'use strict'

process.env.DEBUG = '*'

require('dotenv').config()

const debug = require('debug')('bfx-liq-twitter-bot')
const { WSv2 } = require('bitfinex-api-node')
const { RESTv2 } = require('bfx-api-node-rest')
const TweetTemplate = require('./lib/tweet_template')

const TICKER_UPDATE_INTERVAL_MS = 60 * 1000

const rest = new RESTv2({ transform: true })
const tickers = {}
const fromMTS = Date.now()

const {
  TWITTER_CONSUMER_KEY,
  TWITTER_CONSUMER_SECRET,
  TWITTER_ACCESS_TOKEN_KEY,
  TWITTER_ACCESS_TOKEN_SECRET,
} = process.env

const twitterClient = new Twitter({
  consumer_key: TWITTER_CONSUMER_KEY,
  consumer_secret: TWITTER_CONSUMER_SECRET,
  access_token_key: TWITTER_ACCESS_TOKEN_KEY,
  access_token_secret: TWITTER_ACCESS_TOKEN_SECRET,
})

const updateTickers = async () => {
  const data = await rest.tickers(['ALL'])

  data.forEach((ticker) => {
    tickers[ticker.symbol] = ticker.lastPrice
  })

  debug('updated tickers')
}

const run = async () => {
  debug('running')

  await updateTickers()
  setInterval(updateTickers, TICKER_UPDATE_INTERVAL_MS)

  const ws = new WSv2({
    transform: true,
    autoReconnect: true,
  })

  ws.on('open', () => {
    debug('ws connection opened')
    ws.subscribeStatus('liq:global')
  })

  ws.onStatus({ key: 'liq:global' }, (data) => {
    const liquidations = data.map(d => {
      const liq = {
        time: d[2],
        symbol: d[4],
        amount: d[5],
        basePrice: d[6],
        lastPrice: tickers[d[4]],
        isMatch: d[8],
        isExecuted: d[9]
      }

      if (!liq.lastPrice) { // unknown market
        return null
      }

      liq.dir = liq.basePrice > liq.lastPrice ? 1 : -1
      liq.deltaPrice = liq.lastPrice - liq.basePrice
      liq.nvQuote = -1 * liq.deltaPrice * liq.amount

      return liq
    }).filter(liq => !!liq && liq.time > fromMTS)

    liquidations.map(TweetTemplate).forEach((tweetText) => {
      twitterClient.post('statuses/update', {
        status: tweetText
      }).then(() => {
        debug('tweeted: %s', tweetText)
      })
    })
  })

  ws.open()
}

try {
  run()
} catch (e) {
  debug(e.stack)
}
