import React from 'react'
import {isPremium} from 'helpers'
import {listTypes} from './Menu'

const defineListType = company =>
  isPremium(company) ? 0 : 2

const ChangeListTypeHandler = (Component) => {
  return class extends React.Component {
    get displayName() { return 'ChangeListTypeHandler' }

    state = {
      listType: defineListType(this.props.company)
    }
  
    componentDidUpdate(prevProps) {
      const {company} = this.props
      const prevCompany = prevProps.company
      if (isPremium(company) !== isPremium(prevCompany)) {
        this.checkListType()
      }
    }
  
  
    checkListType = () =>
      this.setState(state => ({ 
        listType: defineListType(this.props.company)
      }))
      
  
    updateListType = value => {
      const {onUpdateListType} = this.props
      if (onUpdateListType) onUpdateListType(listTypes[value])
      return this.setState(state => ({ listType: value }))
    }

    render() {
      return <Component 
        updateListType={this.updateListType}
        listType={this.state.listType}
        {...this.props} />
    }
  }
}

export default ChangeListTypeHandler