import React from 'react'
import { buttonStyle } from './RemoteButton.module.scss'

type RemoteButtonProps = {
  onClick?: () => void
  text?: string
}

const RemoteButton = ({ onClick, text }: RemoteButtonProps = {}) => {
  // Just to see if React Hooks work on the remote
  React.useEffect(() => {
    console.log('RemoteButton test 🙌')
    document.documentElement.setAttribute('data-remote-button-mounted', '1')
  }, [])

  const [count, setCount] = React.useState(1)
  const defaultText = React.useMemo(() => `Remote Button ${count}`, [count])

  if (!onClick) {
    onClick = () => {
      setCount((s) => s + 1)
    }
  }

  return (
    <button className={buttonStyle} onClick={onClick}>
      {text || defaultText}
    </button>
  )
}

export default RemoteButton
