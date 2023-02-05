import React from 'react'
import { Link } from 'gatsby'
import HostButton from '../components/HostButton'

type LazyComponentType = React.LazyExoticComponent<React.ComponentType<any>>

const RemoteComponent: LazyComponentType = React.lazy(
  () => import('remote/Button')
)

const App = () => {
  const [count, setCount] = React.useState(1)

  return (
    <>
      <h1>Host App</h1>
      <HostButton onClick={handleClick} /> <ClientOnly /> Check out the{' '}
      <Link to="/">ClientOnly</Link> solution.
    </>
  )

  function ClientOnly() {
    if (typeof document === 'undefined') {
      return <>loading...</>
    }

    return (
      <React.Suspense fallback="loading...">
        <RemoteComponent
          text={`Remote Button ${count} 🙌`}
          onClick={handleClick}
        />
      </React.Suspense>
    )
  }

  function handleClick(e) {
    console.log('onClick', e)
    setCount((s) => s + 1)
  }
}

export default App
