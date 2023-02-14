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

### Importing federated modules or components

```jsx
import { ClientOnly } from 'gatsby-plugin-federation'

const RemoteModule = () => import('my-remote/Button')

render(<ClientOnly module={RemoteModule} fallback="Loading..." props={{}} />)
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

Note: Gatsby in SSR or DSG should theoretically work. But where not tested as of now.

## Client side only - no SSG support

Right now, your server generated HTML will not be able to load a federated module. How ever, in future we may add this to this plugin as well. Let me know if you need it.

Background: Because Webpack is using `document` in their Module Federation implementation of loading a remote component, we need to ensure, Gatsby's SSG step gets as fallback instead of actually requesting the remote module, and rendering it on the server.

## Credits

A big thanks to [Zack Jackson](https://twitter.com/ScriptedAlchemy) for originally coming up with Module Federation.

Read more about [Module Federation](https://webpack.js.org/concepts/module-federation/).

## How this Plugin works

It changes some settings in the Webpack config so the Module Federation Webpack Plugin works without throwing an error.

### Development

- clone this repo and run yarn install.
- run Gatsby in development: `yarn start`
- or a build i watch mode: `yarn watch`
- and visit http://localhost:8001/ and http://localhost:8002/
