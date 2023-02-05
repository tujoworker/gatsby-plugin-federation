import React from 'react'
import { buttonStyle } from './RemoteButton.module.scss'

const RemoteButton = ({ onClick, text = 'Remote Button' }) => {
  // React.useEffect(() => {
  //   console.log('RemoteButton 🙌')
  // }, [])

  return (
    <button className={buttonStyle} onClick={onClick}>
      {text}
    </button>
  )
}

export default RemoteButton
