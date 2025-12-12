// Deprecated bootstrap kept only for reference; runtime now starts in index.js -> src/app.js.
module.exports = function legacyServerBootstrap() {
  // Intentional no-op to prevent accidental double bootstraps.
  // Use `node index.js` (or the NPM scripts) to start the application.
  console.warn('src/server.js is deprecated. Start the server with index.js.');
};
