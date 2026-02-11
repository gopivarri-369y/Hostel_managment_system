const pagesRouter = require('./pages');
const authRouter = require('./auth');
const studentsRouter = require('./students');
const ownersRouter = require('./owners');
const mailRouter = require('./mail');

function mountRoutes(app) {
  app.use('/', pagesRouter);
  app.use('/', authRouter);
  app.use('/', studentsRouter);
  app.use('/', ownersRouter);
  app.use('/', mailRouter);
}

module.exports = { mountRoutes };
