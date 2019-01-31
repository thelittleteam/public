import find from 'lodash/find'
import get from 'lodash/get'

/**
 * Фасад для работы с рейтингами
 * @param {Object}
 *  @arg {Array || Object} rates рейтинги к торгам
 * @return {Dict of Func}
 */
const RatingsFacade = ({rates}) => {

  // для организатора
  const ratingInAuctionPosition = (companyId, positionIndex=0) => {
    let rating = null, 
        ratingDelta = 0

    if (!rates || !companyId) return {rating, ratingDelta}

    const positionRatings = get(rates, `[${positionIndex}]`, [])
    const participantRatings = find(positionRatings, p => get(p, 'owner') === companyId)
    
    ratingDelta = get(participantRatings, 'ratingDelta', 0)
    rating = get(participantRatings, 'rating', null)
    return {rating, ratingDelta}
  }

  // для участника
  const ratingForParticipantOffer = (positionIndex, offerIndex) => {
    return get(rates, `[${positionIndex}][${offerIndex}].rate`, null)
  }

  return {
    ratingInAuctionPosition,
    ratingForParticipantOffer,
  }
}

export default RatingsFacade