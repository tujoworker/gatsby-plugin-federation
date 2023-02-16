import React from 'react'

export const wrapRootElement = ({ element }) => {
  return (
    <>
      <Mounted />
      {element}
    </>
  )
}

const Mounted = () => {
  React.useEffect(() => {
    document.documentElement.setAttribute('data-host-mounted', '1')
  })
  return null
}
