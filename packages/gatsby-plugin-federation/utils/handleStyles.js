const path = require('path')
const fs = require('fs')

const collectedStyles = {}

exports.handleStylesOnSSR = function handleStylesOnSSR(
  { remotes, exposes },
  { ssr, ssrDir, stage, store, config, federationConfig }
) {
  const state = store.getState()

  /**
   * Ensure we always alias out the import in gatsby-ssr.js
   */
  config.resolve.alias['gmfImport'] = false

  /**
   * Collect all css files
   */
  if (ssr && stage === 'build-javascript' && federationConfig?.exposes) {
    config.plugins.push(new CSSFilesPlugin())
  }

  if (ssr && stage === 'build-html') {
    if (federationConfig?.exposes) {
      const destDir = path.join(state.program.directory, 'public', ssrDir)
      const dataFile = path.join(destDir, 'gmfData.js')

      const data = JSON.stringify({
        name: federationConfig.name,
        styles: Object.values(collectedStyles),
      })
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir)
      }
      fs.writeFileSync(dataFile, `export default ${data}`, 'utf8')

      exposes[`./gmfData`] = `./public/${ssrDir}/gmfData.js`
    }

    if (federationConfig?.remotes) {
      const cacheDir = path.join(state.program.directory, '.cache')
      const importFile = path.join(cacheDir, 'module-federation-imports.js')

      let count = 1
      const gmfData = []
      for (const remote in federationConfig.remotes) {
        remotes[`gmf${count}`] = federationConfig.remotes[remote]

        gmfData.push(
          `export { default as g${count} } from 'gmf${count}/gmfData'`
        )

        count++
      }

      fs.writeFileSync(importFile, gmfData.join('\n'), 'utf8')
      config.resolve.alias['gmfImport'] = importFile
    }
  }

  return [remotes, exposes]
}

exports.handleDevStyles = function handleDevStyles(
  { store },
  { federationConfig }
) {
  if (federationConfig?.exposes) {
    const state = store.getState()
    const publicDir = path.join(state.program.directory, 'public')
    const commonsFile = path.join(publicDir, 'commons.css')

    if (!fs.existsSync(commonsFile)) {
      /**
       * Create a dummy file,
       * because we did delete "styles" from the cacheGroup, we get a random
       */
      fs.writeFileSync(commonsFile, '', 'utf8')
    }
  }
}

class CSSFilesPlugin {
  apply(compiler) {
    compiler.hooks.done.tap('GetFilesPlugin', (stats) => {
      const statsData = stats.compilation.getStats().toJson({
        all: false,
        assets: true,
      })

      statsData.assets
        .filter(({ name }) => {
          return name?.endsWith('.css')
        })
        .forEach(({ name }) => {
          collectedStyles[name] = name
        })
    })
  }
}
