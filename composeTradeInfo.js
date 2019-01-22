import React from 'react'
import get from 'lodash/get'
import filter from 'lodash/filter'

import {
  wrap,
  parseMS,
  formatDate,
  getDiffBetweenDates,
} from 'helpers'

import {
  renderTradeDurationTable,
  renderTimerUntilTradeEnd,
  renderTimerUntilStepEnd,
  renderTimerFinishedTrade,
  assignResultFooterValues,
} from 'tools/tradeListing'

import extractRegions from './extractRegions'
import {getStepsInfo} from 'tools/tender'
import {getPositionWordForm as pluralizeLot} from 'tools/wordFormsProviders'

const hollandTradeAdditional = 'Дата окончания будет известна, когда торги подойдут к концу'

/**
 * Отдаёт нужную инфу о торгах для отрисовки карточки торгов или пункта списка
 * @param {String} type 'organizator|participant'
 * @param {Object} trade 
 * @param {Object} config
 * @return {Object}
 */
const composeTradeInfo = (type='organizator', trade={}, config={}) => {
  const {
    isOperator=false,
  } = config || {}

  const {
    title=null,
    winners=null,
    organizator=null,
    positions_list=[],
    delivery_list=[],
    offer_require={},
    steps=[],
    // не хватает пока что 
    active_companies=[],
    recommend=false,
    invited=false,
    // из реального апи
    isFavorite,
    statistics={},
    myStatusInTrade={},
    active_companies_count,
    is_golland=false,
    buyer_name=null,
    seller_name=null,
  } = trade

  const haveBid = myStatusInTrade.haveBid || trade.haveBid
  const allBidsIsNotFirst = myStatusInTrade.allBidsIsNotFirst || trade.allBidsIsNotFirst
  const waitApproveYourBid = myStatusInTrade.waitApproveYourBid || trade.waitApproveYourBid
  const youWin = myStatusInTrade.youWin || trade.youWin
  const youLuse = myStatusInTrade.youLuse || trade.youLuse
  const youCancelYourBid = myStatusInTrade.youCancelYourBid || trade.youCancelYourBid

  const {
    closed=null,
  } = statistics || {}

  const {
    totalCountClosed,
    closedItemsInAllOffers,
  } = closed || {}

  const {
    status,
    isLast,
    allSteps,
    currentStep,
    indexInAllSteps,
    offerRequireIsCurrent,
  } = getStepsInfo(steps, offer_require)

  const regions = extractRegions(trade)

  const isNotStarted = status === 'not_started'
  const isFinished = status === 'expired'
  const notFinished = !winners 
  const noWinners = !!winners && !winners.length
  const hasWinners = !!winners && !!winners.length 
  const noConfirmedWinners = filter(winners || [], m => 
    !m.confirm || m.confirm === 'pending').length

  const closed_positions = closedItemsInAllOffers || 0
  const orgName = get(organizator, 'mini_name') || get(organizator, 'name')
  const company = buyer_name || seller_name || orgName

  const isOrg = type === 'organizator'
  const stepsCount = allSteps.length
  const totalLots = positions_list.length
  const totalParticipants = active_companies_count 
    || (active_companies && active_companies.length)
    || 0
    
  const currentStepOrdinal = indexInAllSteps + 1
  const last = allSteps.length - 1 || 0

  const startMS = parseMS(get(allSteps, '[0].datestart', 0))
  const endMS = parseMS(get(allSteps, `[${last}].dateend`, 0))
  const start = startMS && formatDate(startMS, 'date-time') || ''
  const end = endMS && formatDate(endMS, 'date-time') || ''
  const endShort = endMS && formatDate(endMS, 'date-time-numbers') || ''

  let tradeStatus = -1,
      resultClassName = '',
      resultTitle = '',
      resultTitleAdaptive = '',
      resultAdditionalInfo = '',
      resultContent = null,
      resultFooter = {title: null, content: null},
      tag = {text: '', color: 'green'},
      tags = []

  const assignValues = assignResultFooterValues(resultFooter)

  if (isOrg) {
    // торги ещё не начались
    if (isNotStarted) {
      tag.text = 'Ожидает начала'
      resultClassName = 'has-grey-bg'
      resultTitle = 'Торги ещё не начались'
      resultContent = renderTradeDurationTable(start, end)
      assignValues(renderTimerUntilTradeEnd(allSteps))
    }
    // торги идут
    else if (!isFinished && !isNotStarted) {
      tag.text = 'Торги идут'
      resultClassName = 'has-grey-bg'
      resultTitle = 'Торги идут'
      resultTitleAdaptive = !offerRequireIsCurrent 
        ? `Идёт ${currentStepOrdinal} этап из ${stepsCount}`
        : `Идёт запрос предложений`
      resultContent = renderTradeDurationTable(start, end)
      assignValues(renderTimerUntilStepEnd(currentStep, currentStepOrdinal, isLast))
    }
    // завершены, но победителей ещё нет
    else if (isFinished && (notFinished || noConfirmedWinners)) {
      tag.text = 'Выберите победителей'
      resultTitle = 'Выберите победителей'
      resultContent = <p>Закончился последний день торгов, выберите победителей</p>
      assignValues(renderTimerFinishedTrade(end))
    }
    // завершены, победителей не выбрано
    else if (isFinished && noWinners) {
      tag.text = 'Без победителей'
      tag.color = 'red'
      resultClassName = 'has-red-bg'
      resultTitle = 'Без победителей'
      resultContent = <p>Торги завершены, ни одно предложение не подошло</p>
      assignValues(renderTimerFinishedTrade(end))
    }
    // завершены, участник отказался
    else if (isFinished && hasWinners
      && filter(winners, m => m.confirm === 'declined').length) {
      tag.text = 'Участник отказался от поставки'
      tag.color = 'red'
      resultClassName = 'has-red-bg'
      resultTitle = 'Отказ от поставки'
      resultContent = <p>Участник отказался от поставки, попробуйте выбрать другого</p>
      assignValues(renderTimerFinishedTrade(end))
    }
    // завершены, победители подтвердили
    else if (isFinished && hasWinners
      && winners.length === filter(winners, m => m.confirm === 'accepted').length) {
      tag.text = 'Есть победители'
      resultClassName = 'has-green-bg'
      resultTitle = 'Есть победители'
      resultContent = <p>Закрыто {closed_positions} {pluralizeLot(closed_positions)} из {totalLots}</p>
      assignValues(renderTimerFinishedTrade(end))
    }
    // торги завершены, победители выбраны, подтверждают ставки
    else if (isFinished && hasWinners) {
      tag.text = 'Подтверждение ставок'
      resultClassName = 'has-grey-bg'
      resultTitle = 'Подтверждение ставок'
      resultContent = <p>Ждём решение участников по разделению поставок</p>
      assignValues(renderTimerFinishedTrade(end))
    }
  }
  
  else {
    // торги ещё не начались
    if (isNotStarted) {
      tag.text = recommend ? 'Рекомендуем поучаствовать' : 'Ожидает начала'
      tag.color = 'grey'
      resultClassName = 'has-grey-bg'
      resultTitle = 'Торги ещё не начались'
      resultContent = renderTradeDurationTable(start, end)
      assignValues(renderTimerUntilTradeEnd(allSteps))

      // голландские
      if (is_golland && !isOperator) {
        resultAdditionalInfo = hollandTradeAdditional
      }
    }
    // торги идут
    else if (!isNotStarted && !isFinished) {
      tag.text = 'Торги идут'
      resultTitle = 'Торги идут'
      resultTitleAdaptive = !offerRequireIsCurrent 
        ? `Идёт ${currentStepOrdinal} этап из ${stepsCount}`
        : `Идёт запрос предложений`
      resultContent = renderTradeDurationTable(start, end)
      assignValues(renderTimerUntilStepEnd(currentStep, currentStepOrdinal, isLast))

      // голландские
      if (is_golland && !isOperator) {
        resultAdditionalInfo = hollandTradeAdditional
        resultTitleAdaptive = resultTitle
      }
    }
    // торги завершены, не участвовал
    else if (isFinished && !haveBid) {
      tag.text = 'Торги завершены'
      tag.color = 'grey'
      resultTitle = 'Торги завершены'
      resultClassName = 'has-grey-bg'
      resultContent = <p>Вы не участвовали</p>
      assignValues(renderTimerFinishedTrade(end))
    }
    // торги завершены, не победил
    else if (isFinished && youLuse) {
      tag.text = 'Вы не победили'
      tag.color = 'red'
      resultTitle = 'Вы не победили'
      resultClassName = 'has-red-bg'
      resultContent = <p>Ни одной позиции не закрыто</p>
      assignValues(renderTimerFinishedTrade(end))
    }
    // торги завершены, победил
    else if (isFinished && youWin) {
      tag.text = 'Вы победили'
      resultTitle = 'Вы победили'
      resultClassName = 'has-green-bg'
      resultContent = <p>Закрыто {closed_positions} {pluralizeLot(closed_positions)} из {totalLots}</p>
      assignValues(renderTimerFinishedTrade(end))
    }
    // торги завершены, надо подтвердить ставку
    else if (isFinished && waitApproveYourBid) {
      tag.text = 'Подтвердите вашу ставку'
      resultTitle = 'Подтвердите ставку'
      resultContent = <p>Вы в числе победителей, подтвердите ставку</p>
      assignValues(renderTimerFinishedTrade(end))
    }
    // торги завершены, отказался
    else if (isFinished && youCancelYourBid) {
      tag.text = 'Вы отказались от поставки'
      tag.color = 'red'
      resultTitle = 'Вы отказались от поставки'
      resultClassName = 'has-red-bg'
      resultContent = <p>Возможно, организатор торгов пересмотрит условия</p>
      assignValues(renderTimerFinishedTrade(end))
    }
    // торги завершены, победителей ещё нет
    else if (isFinished && !winners) {
      tag.text = haveBid ? 'Вы участвовали в торгах' : 'Торги завершены'
      tag.color = haveBid ? 'green' : 'grey'
      resultClassName = 'has-grey-bg'
      resultTitle = 'Выбор победителя'
      resultContent = <p>Закончился последний день торгов. Организатор выбирает победителя.</p>
      assignValues(renderTimerFinishedTrade(end))
    }

    // пригласили участвовать
    if (!isFinished && invited) {
      tag.text = 'Вас пригласили как участника'
      tag.color = 'green'
      tag.iconLeft = 'email'
    }
    // участвует
    if (!isFinished && haveBid) {
      tag.text = 'Вы участвуете в торгах'
      tag.color = 'green'
    }
    // ставка перебита
    if (!isFinished && allBidsIsNotFirst) {
      tag.text = 'Ваша ставка перебита'
      tag.color = 'red'
    }
  }

  if (tag.text) tags.push(tag)

  const timeDiff = !!currentStep 
    ? getDiffBetweenDates(currentStep.dateend, wrap()) 
    : null

  const showTooltip = !!isNotStarted || timeDiff === 0
  
  const showRedClock = !isNotStarted 
    && timeDiff === 0 
    && !isFinished 
    && !is_golland


  return {
    title,
    company,
    regions,
    recievers: delivery_list,
    tradeStatus,
    resultClassName,
    resultTitle,
    resultTitleAdaptive,
    resultContent,
    resultFooter,
    tags,
    currentStep,
    isNotStarted,
    stepsCount,
    totalParticipants,
    totalLots,
    timeDiff,
    showTooltip,
    isFavorite,
    isFavourite: isFavorite,
    isLast,
    isFinished,
    end,
    endShort,
    currentStepOrdinal,
    allBidsIsNotFirst,
    currentStepIsOfferRequire: offerRequireIsCurrent,
    totalCountClosed,
    closedItemsInAllOffers,
    isHolland: is_golland,
    showRedClock,
    resultAdditionalInfo,
  }
}

export default composeTradeInfo
