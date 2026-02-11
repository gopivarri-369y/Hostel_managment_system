const express = require('express');
const path = require('path');
const session = require('express-session');
const methodOverride = require('method-override');
const config = require('./config');
const { mountRoutes } = require('./routes');

let helmet, morgan;
try { helmet = require('helmet'); } catch (_) {}
try { morgan = require('morgan'); } catch (_) {}

const app = express();

if (helmet) app.use(helmet({ contentSecurityPolicy: false }));
if (morgan) app.use(morgan('dev'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'static', 'public')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(
  session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    name: 'hostel.sid',
  })
);

app.use(methodOverride('_method'));

mountRoutes(app);

app.use((_req, res) => {
  res.status(404).send('Page not found');
});

app.use((err, _req, res, _next) => {
  console.error('Server error:', err);
  res.status(500).send('Server Error');
});

module.exports = app;
