import React from 'react'
import {bind} from 'decko'

const ClickOutsideWatcher = (callback) => (Component) => {
  return class _ClickOutsideWatcher extends React.Component {
    componentDidMount() {
      document.addEventListener('click', this.checkClickOutside)
      document.addEventListener('touchstart', this.checkClickOutside)
    }
  
    componentWillUnmount() {
      document.removeEventListener('click', this.checkClickOutside)
      document.removeEventListener('touchstart', this.checkClickOutside)
    }
  
    @bind
    checkClickOutside(e) {
      if (!e || !e.target || !this.root) return
      
      if (!this.root.contains(e.target)) {
        return callback && callback()
      }
    }

    render() {
      return <span ref={node => this.root = node}>
        <Component {...this.props} />
      </span>
    }
  }
}

export default ClickOutsideWatcher