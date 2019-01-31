import get from 'lodash/get'
import {isAuction} from 'tools/trade/typeOf'

import {
  getStructSize,
  formatSumWithCurrency,
} from 'helpers'

import {RUBLE_CURRENCY_ID as rub} from 'const'

/**
 * Возвращает форматированную конечную цену аукциона
 * @param {Object} trade объект торгов
 * @return {String}
 */
const finishPriceOf = trade => {
  if (!isAuction(trade)) return ''

  const {positions_list=[], winners=[]} = trade
  if (getStructSize(positions_list) !== 1) return ''
  if (getStructSize(winners) !== 1) return ''

  const price = get(winners, '[0].price')
  if (!price) return ''

  const currency = get(winners, '[0].currency', rub)
  return formatSumWithCurrency(price, currency)
}

export default finishPriceOf