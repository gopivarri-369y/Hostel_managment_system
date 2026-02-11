const express = require('express');
const path = require('path');

const router = express.Router();
const htmlDir = path.join(__dirname, '..', 'static', 'public', 'html');

const staticPages = [
  ['/', 'home.html'],
  ['/home', 'home.html'],
  ['/about', 'about.html'],
  ['/student', 'student_register.html'],
  ['/login', 'student_login.html'],
  ['/register', 'register.html'],
  ['/studentreg', 'student_register.html'],
  ['/ownerreg', 'owner_register.html'],
];

staticPages.forEach(([route, file]) => {
  router.get(route, (_req, res) => {
    res.sendFile(path.join(htmlDir, file));
  });
});

module.exports = router;
