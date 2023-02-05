const fs = require('fs')
const path = require('path')
const { container } = require('webpack')
const { ModuleFederationPlugin } = container

exports.onCreateWebpackConfig = (
  { stage, getConfig, actions },
  { federationConfig }
) => {
  const config = getConfig()

  const isHost = federationConfig?.remotes
  const isRemote = federationConfig?.exposes

  if (stage === 'build-javascript' || stage === 'develop') {
    if (isRemote) {
      /**
       * In order to make "ModuleFederationPlugin" to include "exposes" in "remoteEntry.js"
       */
      config.optimization.runtimeChunk = false

      /**
       * In order to let MF know the correct URL.
       * Same location as the remoteEntry.js
       */
      config.output.publicPath = 'auto'
    }
  }

  if (isRemote && stage === 'develop') {
    /**
     * During the develop stage, the junk name "commons" in "styles" colides,
     * with the one from JS:
     * Cache group "styles" conflicts with existing chunk.
     * Both have the same name "commons" and existing chunk is not a parent
     * of the selected modules.
     */
    if (config.optimization.splitChunks.cacheGroups.styles?.name) {
      delete config.optimization.splitChunks.cacheGroups.styles.name
    }
  }

  if (
    stage === 'build-html' ||
    stage === 'build-javascript' ||
    (stage === 'develop-html' && isHost) ||
    stage === 'develop'
  ) {
    config.plugins.push(
      new ModuleFederationPlugin({
        filename: 'remoteEntry.js',
        /**
         * NB: sharing deps do not work,
         * because MF wants then to create its own junks,
         * while gatsby has its UX enhances junks.
         */
        // shared: {
        //   react: { singleton: true },
        //   'react-dom': { singleton: true },
        // },
        ...federationConfig,
      })
    )
  }

  /**
   * This part extracts React + ReactDOM to its own junk, with a version nunmber instead of a random hash.
   * This way, React can be shared, when MF is run on the same domain.
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

exports.onCreateDevServer = ({ store }, { federationConfig }) => {
  const isRemote = federationConfig?.exposes
  if (isRemote) {
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
