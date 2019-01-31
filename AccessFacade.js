import cloneDeep from 'lodash/cloneDeep'
import filter from 'lodash/filter'
import uniq from 'lodash/uniq'
import get from 'lodash/get'
import set from 'lodash/set'

/**
 * Фасад для работы с объектом доступов к предложениям в торгах
 * @param {Object} accessObj AccessFactory
 * @return {Dict of Func}
 */
const AccessFacade = (accessObj) => {
  // если с сервера не приходят доступы, 
  // то доступ есть у всех компаний ко всем предложениям
  const serverAccessEmpty = accessObj === null
  const access = cloneDeep(accessObj) || {}

  // возвращает массив компаний, у которых есть доступы 
  // к указанному предложению в указанной позиции
  const valueOf = (positionIndex, offerIndex) =>
    get(access, `[${positionIndex}][${offerIndex}]`, [])

  // проверяет, есть ли у указанной компании доступ
  // к указанному преложению в указанной позиции
  const hasAccessTo = (companyId, positionIndex, offerIndex) =>
    serverAccessEmpty ? true
      : valueOf(positionIndex, offerIndex).includes(companyId)

  // меняет доступ в указанном предложении
  const updateAccessInOffer = (value, offer) => {
    const {i1, i2, ownerId} = offer
    const path = `[${i1}][${i2}]`
    const copyAccess = cloneDeep(access)
    let offerAccess = get(copyAccess, path, [])

    if (value === 'yes') offerAccess.push(ownerId)
    else offerAccess = filter(offerAccess, id => id !== ownerId)
    
    offerAccess = uniq(offerAccess)
    set(copyAccess, path, offerAccess)
    return copyAccess
  }

  return {
    valueOf,
    hasAccessTo,
    updateAccessInOffer,
  }
}

export default AccessFacade