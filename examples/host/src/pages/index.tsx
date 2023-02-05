import React from 'react'
import { Link } from 'gatsby'
import { ClientOnly } from 'gatsby-plugin-federation'
import HostButton from '../components/HostButton'

const RemoteModule = () => import('remote/Button')

const App = () => {
  const [count, setCount] = React.useState(1)

  return (
    <>
      <h1>Host App</h1>
      <HostButton onClick={handleClick} />{' '}
      <ClientOnly
        fallback="Loading Button"
        module={RemoteModule}
        props={{
          onClick: handleClick,
          text: `Remote Button ${count} 🙌`,
        }}
      />{' '}
      Check out the <Link to="/vanilla">Vanilla</Link> solution.
    </>
  )

  function handleClick(e) {
    console.log('onClick', e)
    setCount((s) => s + 1)
  }
}

export default App
