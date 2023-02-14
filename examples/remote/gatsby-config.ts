export default {
  plugins: [
    'gatsby-plugin-sass',
    {
      resolve: 'gatsby-plugin-federation',
      options: {
        ssr: true,
        federationConfig: {
          name: 'remote',
          exposes: {
            './Button': './src/components/RemoteButton',
          },
        },
      },
    },
  ],
}
