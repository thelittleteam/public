import cloneDeep from 'lodash/cloneDeep'
import forEach from 'lodash/forEach'
import find from 'lodash/find'
import get from 'lodash/get'
import set from 'lodash/set'

import {pickId as id} from 'helpers'

/**
 * Адаптер для обновления текущих ставок участников данными,
 * которые пришли с сервера по сокетам
 * @param {Object} trade 
 * @param {Object} socketData 
 * @return {Object}
 */
const tradeOrgSocketUpdateAdapter = (trade, socketData) => {
  const {
    participants_offers, 
    trade_type
  } = trade || {}

  return trade_type === 'auction' 
    ? orgAuctionOffersUpdate(participants_offers, socketData)
    : orgTenderOffersUpdate(participants_offers, socketData)
}

export default tradeOrgSocketUpdateAdapter


/**
 * Обновляет ставки участников в тендере
 * @param {Array | Object} offers 
 * @param {Object} socketData 
 * @return {Array | Object}
 */
function orgTenderOffersUpdate(offers, socketData) {
  const result = cloneDeep(offers)

  forEach(result, (offer, index) => {
    const ownerId = id(offer.owner)

    forEach(offer.positions_list, (position, i) => {
      forEach(position, (ofr, j) => {
        const path = `[${index}].positions_list[${i}][${j}]`
        const source = get(socketData, `rates[${i}]`)
        const fromSocket = find(source, c => 
          c.owner === ownerId && ''+c.i2 === ''+j) || {}
        
        setValues(result, path, fromSocket)
      })
    })
  })
  return result
}

/**
 * Обновляет ставки участников в аукционе
 * @param {Object} offers ставки участников
 * @param {Object} socketData 
 * @return {Object}
 */
function orgAuctionOffersUpdate(offers, socketData) {
  const result = cloneDeep(offers)

  forEach(result, (offers, companyId) => {
    // первая — самая свежая
    const lastIndex = 0
    const last = offers && offers.length ? offers[lastIndex] : {}
    
    forEach(last.positions_list, (position, i) => {
      const path = `${companyId}[${lastIndex}].positions_list[${i}][0]`
      const source = get(socketData, `rates[${i}]`)
      const offer = find(source, c => c.owner === companyId) || {}
      
      setValues(result, path, offer)
    })
  })

  return result
}

/**
 * Обновляет значения цены и количества из source
 * в объекте changee по указанному пути path
 * @param {Object} changee 
 * @param {String} path 
 * @param {Object} source 
 * @return
 */
function setValues(changee, path, source) {
  const newPrice = source.price
  const newPriceRur = source.price_rur
  const newQuantity = source.quantity

  if (newPrice) set(changee, `${path}.price`, newPrice)
  if (newPriceRur) set(changee, `${path}.price_rur`, newPriceRur)
  if (newQuantity) set(changee, `${path}.quantity`, newQuantity)
}