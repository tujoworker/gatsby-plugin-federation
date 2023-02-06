# Gatsby Plugin for enabling Module Federation

This Plugin enables Webpack Module Federation, without any sidecar or special solution.

## How to use

Install `yarn add gatsby-plugin-federation` and add it to your `gatsby-config.js` file:

```js
// gatsby-config.js
{
  plugins: [
    {
      resolve: 'gatsby-plugin-federation',
      options: {
        federationConfig: {
          // A. For your Remote
          name: 'my-host',
          exposes: {
            './Button': './src/components/RemoteButton',
          },

          // B. For your Host
          name: 'my-remote',
          remotes: {
            remote: 'remote@http://localhost:8002/remoteEntry.js',
          },
        },
      },
    },
  ]
}
```

### Importing components

Because Webpack is using `document` in their Module Federation implementation of loading a remote component, we need to ensure, Gatsby's SSR step gets as fallback instead of actually requesting the remote module, and rendering it on the server.

```jsx
import { ClientOnly } from 'gatsby-plugin-federation'

const RemoteModule = () => import('my-remote/Button')

render(<ClientOnly fallback="Loading..." module={RemoteModule} props={{}} />)
```

You could use the vanilla method of importing the shared component, but you would need to ensure that `React.Suspense` does not render on the server:

```jsx
const RemoteModule = React.lazy(() => import('my-remote/Button'))

const ClientOnly = () => {
  if (typeof document === 'undefined') {
    return <>loading...</>
  }
  return (
    <React.Suspense fallback="loading...">
      <RemoteModule />
    </React.Suspense>
  )
}

render(<ClientOnly />)
```

# Requirements

This plugin requires at least:

- Gatsby v4+ (Webpack v5)
- React v17+

## Sharing dependencies

Its not possible to share dependencies as of now.

How ever – this plugin does extract React and ReactDOM from the `framework.js` bundle, and creates a junk with a React version, instead of an unique hash. This way, we can share React, when several federated apps run on the same domain.

## Credits

A big thanks to Zack Jackson for originally coming up with Module Federation.

Read more about [Module Federation](https://webpack.js.org/concepts/module-federation/).

## How this Plugin works

It changes some settings in the Webpack config so the Module Federation Webpack Plugin works without throwing an error.

### Development

- clone this repo and run yarn install.
- run Gatsby in development: `yarn start`
- or a build i watch mode: `yarn watch`
- and visit http://localhost:8001/ and http://localhost:8002/
