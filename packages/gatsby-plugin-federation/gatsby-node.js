/**
 * Auto: Tobias Høegh
 */

// Utils
const { addEntryPointToRemotes } = require('./utils/handleRemote')
const { copyExposesToPublic } = require('./utils/handleHost')
const { handleStylesOnSSR, handleDevStyles } = require('./utils/handleStyles')
const { handleSharedInternals } = require('./utils/sharedInternals')
const { mutateWebpackConfig } = require('./utils/webpackConfig')

// MF
const { UniversalFederationPlugin } = require('@module-federation/node')
const { container } = require('webpack')
const { ModuleFederationPlugin } = container

exports.pluginOptionsSchema = ({ Joi }) => {
  const federationConfig = Joi.object({
    name: Joi.string().required(),
    shared: Joi.object().optional(),
    remotes: Joi.object().optional(),
    exposes: Joi.object().optional(),
    filename: Joi.string().optional().default('remoteEntry.js'),
  }).required()

  return Joi.object({
    ssr: Joi.boolean().optional().default(true),
    ssrDir: Joi.string().optional().default('mf-ssr'),
    federationConfig,
  })
}

exports.onCreateWebpackConfig = (
  {
    store,
    stage,
    getConfig,
    plugins: { define },
    actions: { replaceWebpackConfig },
  },
  { ssr, ssrDir, federationConfig }
) => {
  /**
   * Mutables
   */
  let config = getConfig()
  let remotes = { ...federationConfig.remotes }
  let exposes = { ...federationConfig.exposes }
  let shared = { ...federationConfig.shared }

  /**
   *
   */
  federationConfig = Object.freeze(federationConfig)
  const cfg = Object.freeze({
    ssr,
    ssrDir,
    stage,
    store,
    config,
    federationConfig,
  })

  /**
   * Shared deps
   */
  ;[shared] = handleSharedInternals({ shared }, cfg)

  /**
   * Handle styles during SSR
   */
  ;[remotes, exposes] = handleStylesOnSSR({ remotes, exposes }, cfg)

  /**
   * Correct remote Paths
   */
  ;[remotes] = addEntryPointToRemotes({ remotes }, cfg)

  const commonSettings = {
    ...federationConfig,

    shared,
    remotes,
    exposes,

    /**
     * It should ensure the remote entry is a full copy of the webpack runtime,
     * not just 2 functinos and needs another file for the base webpack runtime.
     */
    runtime: false,
  }

  if (stage === 'build-html' || stage === 'develop-html') {
    if (ssr) {
      config.plugins.push(
        new UniversalFederationPlugin({
          ...commonSettings,

          isServer: true,
          library: { type: 'commonjs-module' },
        })
      )
    }
  }

  if (stage === 'build-javascript' || stage === 'develop') {
    config.plugins.push(
      /**
       * When using the MF plugin,
       * it will change the Webpack config,
       * so Gatsby styles are loaded as a CSS file (via MF and JavaScript),
       * but in addition to be embedded with "dangerouslySetInnerHTML" during SSR.
       */
      new ModuleFederationPlugin({
        ...commonSettings,
      })
    )
  }

  config.plugins.push(
    define({
      'globalThis.MF_SSR': ssr,
    })
  )

  /**
   * Mutate Webpack config to make MF work with Gatsby
   */
  ;[config] = mutateWebpackConfig({ config }, cfg)

  replaceWebpackConfig(config)
}

exports.onCreateDevServer = ({ store }, { federationConfig }) => {
  handleDevStyles({ store }, { federationConfig })
}

exports.onPostBuild = ({ store }, { ssr, ssrDir, federationConfig }) => {
  copyExposesToPublic({ store }, { ssr, federationConfig, ssrDir })
}
