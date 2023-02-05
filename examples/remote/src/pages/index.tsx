import React from 'react'
import LocalButton from '../components/RemoteButton'

const App = () => {
  return (
    <>
      <h1>Remote App</h1>

      <LocalButton onClick={onClick} />
    </>
  )

  function onClick(e) {
    console.log(e)
  }
}

export default App
