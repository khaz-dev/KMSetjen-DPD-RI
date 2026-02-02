module.exports = {
  e2e: {
    baseUrl: 'http://localhost:5175',
    viewportWidth: 1280,
    viewportHeight: 720,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    pageLoadTimeout: 51750,
    setupNodeEvents(on, config) {
      // Add event listeners here
    },
  },
  component: {
    devServer: {
      framework: 'react',
      bundler: 'webpack',
    },
  },
};
