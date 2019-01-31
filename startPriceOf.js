import get from 'lodash/get'
import {isAuction} from 'tools/trade/typeOf'

import {
  getStructSize,
  formatSumWithCurrency,
} from 'helpers'

import {RUBLE_CURRENCY_ID as rub} from 'const'

/**
 * Возвращает форматированную стартовую цену аукциона
 * @param {Object} trade объект торгов
 * @return {String}
 */
const startPriceOf = trade => {
  if (!isAuction(trade)) return ''

  const {start_price} = trade
  if (start_price) return formatSumWithCurrency(start_price, rub)

  const {positions_list=[]} = trade
  if (getStructSize(positions_list) !== 1) return ''

  const price = get(positions_list, '[0].price')
  if (!price) return ''

  const currency = get(positions_list, '[0].currency', rub)
  return formatSumWithCurrency(price, currency)
}

export default startPriceOf