const { preparePrice, prepareAmount } = require('bfx-api-node-util')

const formatSymbol = (sym) => {
  const q = sym.substring(4)
  const b = sym.substring(1, 4)

  return `${b}/${q}`
}

module.exports = (liq) => [
  'Liquidated 💥',
  liq.dir === 1 ? 'long' : 'short',
  `on ${formatSymbol(liq.symbol)}`,
  `${prepareAmount(liq.amount)} @ ${preparePrice(liq.lastPrice)}`,
  `(entry ${preparePrice(liq.basePrice)})`,
  '|',
  `${liq.nvQuote === liq.nvUSD ? '$' : ''}${preparePrice(liq.nvQuote)} lost`,
  '|',
  liq.isExecuted && liq.isMatch ? 'Executed' : 'Triggered',
].filter(t => !!t).join(' ')
