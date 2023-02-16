export default {
  plugins: [
    'gatsby-plugin-sass',
    {
      resolve: 'gatsby-plugin-federation',
      options: {
        ssr: process.env.MF_SSR !== 'false',
        federationConfig: {
          name: 'host',
          remotes: {
            remote: 'remote@http://localhost:8002/',
          },
        },
      },
    },
  ],
}
