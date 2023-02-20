import React from 'react'
import * as gmfData from 'gmfImport'

export const onRenderBody = (
  { setHeadComponents },
  { ssr, federationConfig }
) => {
  if (ssr && federationConfig?.remotes) {
    if (!globalThis.gmfLinks) {
      globalThis.gmfLinks = []
      const listOfData = Object.values(gmfData)
      for (const remote in federationConfig.remotes) {
        const found = listOfData.find(({ name }) => {
          return name === remote
        })
        if (found) {
          found?.styles.forEach((style) => {
            const url = federationConfig.remotes[remote].match(/.*@(.*)/)[1]
            const { href } = new URL(style, url)
            if (href) {
              globalThis.gmfLinks.push(href)
            } else {
              console.error(
                '[gatsby-plugin-federation] Did not get valid URL from remotes:',
                url
              )
            }
          })
        }
      }
    }

    setHeadComponents(
      globalThis.gmfLinks.map((style, i) => {
        return <link key={i} rel="stylesheet" type="text/css" href={style} />
      })
    )
  }
}
