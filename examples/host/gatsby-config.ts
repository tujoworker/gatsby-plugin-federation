export default {
  plugins: [
    'gatsby-plugin-sass',
    {
      resolve: 'gatsby-plugin-federation',
      options: {
        ssr: true,
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
