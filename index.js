const app = require('./app');
const config = require('./config');
const { pool } = require('./db');

// On Vercel, export the app for serverless; locally, start the server
if (process.env.VERCEL) {
  module.exports = app;
} else {
  const server = app.listen(config.port, () => {
    console.log(`Server running at http://localhost:${config.port}`);
  });

  function shutdown() {
    console.log('\nShutting down...');
    server.close(() => {
      pool.end(() => {
        console.log('Pool closed.');
        process.exit(0);
      });
    });
    setTimeout(() => process.exit(1), 5000);
  }

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  Object.assign(pool, { pool, app });
  module.exports = pool;
}
