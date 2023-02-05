import React from 'react'
import { buttonStyle } from './HostButton.module.scss'

const Button = ({ onClick }) => {
  return (
    <button className={buttonStyle} onClick={onClick}>
      Local Host Button
    </button>
  )
}

export default Button
