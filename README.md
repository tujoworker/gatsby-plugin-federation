# Gatsby Plugin for enabling Module Federation

This Plugin enables Webpack Module Federation, without any sidecar or special solutions.

- Supports development and production modes
- Supports SSG/SSR – streaming modules during build time (`ssr: true`)

### Run the examples

- clone this repo and run yarn install.
- run Gatsby in development: `yarn start`
- or a build: `yarn build && yarn serve`
- and visit http://localhost:8001/ and http://localhost:8002/

## How to use

Install `yarn add gatsby-plugin-federation` and add it to your `gatsby-config.js` file:

```js
// gatsby-config.js
{
  plugins: [
    {
      resolve: 'gatsby-plugin-federation',
      options: {
        ssr: false, // If true, the remotes will be requested during SSG (SSR)
        federationConfig: {
          // A. For your Remote
          name: 'my-remote',
          exposes: {
            './Button': './src/components/RemoteButton',
          },

          // B. For your Host
          name: 'my-host',
          remotes: {
            remote: 'remote@http://localhost:8002/', // where the content of /public is served
          },
        },
      },
    },
  ]
}
```

### Importing federated modules or components

#### Method 1

```jsx
import { Dynamic } from 'gatsby-plugin-federation'

const RemoteModule = Dynamic(() => import('my-remote/Button'))

render(<RemoteModule fallback={<>Loading...</>} your-props />)
```

#### Method 2

You could use the vanilla method of importing the shared component, but you would need to ensure that `React.Suspense` does not render on the server:

```jsx
const RemoteModule = React.lazy(() => import('my-remote/Button'))

const DynamicWrapper = () => {
  if (!globalThis.MF_SSR && typeof document === 'undefined') {
    return <>loading...</>
  }
  return (
    <React.Suspense fallback="loading...">
      <RemoteModule />
    </React.Suspense>
  )
}

render(<DynamicWrapper />)
```

# Requirements

This plugin requires at least:

- Gatsby v4+ (Webpack v5)
- React v17+

## Credits

A big thanks to [Zack Jackson](https://twitter.com/ScriptedAlchemy) for originally coming up with Module Federation.

Read more about [Module Federation](https://webpack.js.org/concepts/module-federation/).

## How this Plugin works

It changes some settings in the Webpack config so the Module Federation Webpack Plugin works without throwing an error.

### Development

This package is using [semantic-release](https://github.com/semantic-release/semantic-release) – so please follow the commit message decoration principles.

- e.g. run a build in watch mode (re-build on file changes): `yarn watch:all`
- e.g. run build the TypeScript on file changes: `yarn workspace gatsby-plugin-federation watch`
- e.g. run the tests like on the CI: `yarn workspace e2e test:ci`
- e.g. run the tests in watch mode: `yarn workspace e2e test:watch` (you would need to run the projects in either development or production first)
