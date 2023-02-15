const fs = require('fs')
const path = require('path')
const { container } = require('webpack')
const { ModuleFederationPlugin } = container

exports.onCreateWebpackConfig = (
  { store, stage, getConfig, actions },
  { federationConfig }
) => {
  const config = getConfig()

  if (stage === 'build-javascript' || stage === 'develop') {
    /**
     * In order to let MF know the correct URL.
     * Same location as the remoteEntry.js
     */
    config.output.publicPath = 'auto'
  }

  if (stage === 'build-javascript' || stage === 'develop') {
    if (config.optimization.splitChunks.chunks === 'all') {
      /**
       * Make it possible for the host to load shared chunks from remoteEntry.js
       *
       * When NOT in eager mode, then we need only this to be async,
       * given that the "app.js" and "production-app.js" is imported in a async boundary.
       */
      config.optimization.splitChunks.chunks = 'async'
    }
  }

  /**
   * Rename the app entry to use our own async boundary loader
   */
  if (stage === 'build-javascript') {
    config.entry.app = createAsyncBoundaryEntry({
      entry: config.entry.app,
      store,
    })
  }
  if (stage === 'develop') {
    config.entry.commons = createAsyncBoundaryEntry({
      entry: config.entry.commons,
      store,
    })
  }

  if (
    federationConfig.remotes &&
    (stage === 'build-html' || stage === 'develop-html')
  ) {
    /**
     * Ensure we alias the imports during SSR, when ssr=false in config
     */
    Object.keys(federationConfig.remotes).forEach((remote) => {
      config.resolve.alias[remote] = false
    })
  }

  if (stage === 'build-javascript' || stage === 'develop') {
    const { dependencies } = getPackageJson({ store })

    const { shared: sharedConfig, ...restConfig } = federationConfig

    // Don't share all deps by default
    const shared = { ...sharedConfig }

    shared.react = {
      singleton: true,
      requiredVersion: dependencies['react'],
    }
    shared['react-dom'] = {
      singleton: true,
      requiredVersion: dependencies['react-dom'],
    }
    shared['@gatsbyjs/reach-router'] = {
      singleton: true,
      requiredVersion: false,
    }
    // shared['@gatsbyjs/react-refresh-webpack-plugin'] = {
    //   singleton: true,
    //   requiredVersion: false,
    // }

    config.plugins.push(
      new ModuleFederationPlugin({
        ...restConfig,

        shared,
        filename: 'remoteEntry.js',

        /**
         * It should ensure the remote entry is a full copy of the webpack runtime,
         * not just 2 functinos and needs another file for the base webpack runtime.
         */
        runtime: false,
      })
    )
  }

  if (stage === 'develop' && federationConfig?.exposes) {
    /**
     * During the develop stage, the junk name "commons" in "styles" colides,
     * with the one from JS:
     * > Cache group "styles" conflicts with existing chunk.
     * > Both have the same name "commons" and existing chunk is not a parent
     * > of the selected modules.
     * When we remove the name, it creates its own.
     */
    if (config.optimization.splitChunks.cacheGroups.styles?.name) {
      delete config.optimization.splitChunks.cacheGroups.styles.name
    }
  }

  /**
   * This part extracts React + ReactDOM to its own junk, with a version nunmber instead of a random hash.
   * For the user, it means, this file will be cached locally, even if a prod build gets a new hash.
   */
  if (stage === 'build-javascript') {
    const origFilename =
      config.optimization.splitChunks.cacheGroups.framework?.filename
    config.optimization.splitChunks.cacheGroups.framework.filename = (
      module,
      chunks
    ) => {
      if (module.chunk.name?.includes('react')) {
        return `[name].js`
      }

      return typeof origFilename === 'function'
        ? origFilename(module, chunks)
        : '[name]-[contenthash].js'
    }

    const origName = config.optimization.splitChunks.cacheGroups.framework?.name
    config.optimization.splitChunks.cacheGroups.framework.name = (
      module,
      chunks
    ) => {
      const data = module?.resourceResolveData?.descriptionFileData

      if (data?.name === 'react' || data?.name === 'react-dom') {
        return 'react-' + data.version
      }

      return typeof origName === 'function'
        ? origName(module, chunks)
        : 'framework'
    }
  }

  actions.replaceWebpackConfig(config)
}

function createAsyncBoundaryEntry({ entry, store }) {
  const state = store.getState()
  const cacheDir = path.join(state.program.directory, '.cache')
  const isArray = Array.isArray(entry)
  const entries = isArray ? entry : [entry]
  const nameRegExp = '[\\/\\\\]([^/]*)$'

  const createFile = (file) => {
    const name = file.match(new RegExp('.*' + nameRegExp))[1]
    const destAppFile = path.join(cacheDir, `${name}-loader.js`)
    fs.writeFileSync(destAppFile, `import('./${name}.js')`, 'utf8')
  }

  const renameEntry = (file) => {
    return file.replace(new RegExp(nameRegExp), '/$1-loader')
  }

  const asyncEntries = entries.map((file) => {
    createFile(file)
    return renameEntry(file)
  })

  return isArray ? asyncEntries : asyncEntries[0]
}

exports.onCreateDevServer = ({ store }, { federationConfig }) => {
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

let packageJsonCache = null
function getPackageJson({ store }) {
  if (packageJsonCache) {
    return packageJsonCache
  }

  const state = store.getState()
  const packageJsonFile = path.join(state.program.directory, 'package.json')

  if (fs.existsSync(packageJsonFile)) {
    /**
     * Create a dummy file,
     * because we did delete "styles" from the cacheGroup, we get a random
     */
    return (packageJsonCache = JSON.parse(
      fs.readFileSync(packageJsonFile, 'utf8')
    ))
  }

  return {}
}
