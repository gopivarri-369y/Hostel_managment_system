const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const { pool, getOwnerWithRoom } = require('../db');

const router = express.Router();
const htmlDir = path.join(__dirname, '..', 'static', 'public', 'html');

function redirectLogin(res, errorCode) {
  const codes = {
    invalid_type: 'Invalid user type. Please choose Owner or Student.',
    invalid_email: 'No account found with this email.',
    invalid_password: 'Incorrect password.',
    no_owner_room: 'No hostel data found for this owner. Please complete registration or contact support.',
  };
  const msg = codes[errorCode] || 'Login failed. Please try again.';
  return res.redirect('/login?error=' + encodeURIComponent(msg));
}

router.post('/login-owner', async (req, res, next) => {
  try {
    const { types, email, password } = req.body;
    const tableName = types === 'owners' ? 'owners' : types === 'students' ? 'students' : null;
    if (!tableName) return redirectLogin(res, 'invalid_type');
    if (!email || !password) return redirectLogin(res, 'invalid_email');

    const result = await pool.query(`SELECT * FROM ${tableName} WHERE email = $1`, [email.trim()]);
    if (result.rows.length === 0) return redirectLogin(res, 'invalid_email');

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return redirectLogin(res, 'invalid_password');

    if (types === 'owners') {
      const owner_rooms = await getOwnerWithRoom(user.owner_id);
      if (!owner_rooms) return redirectLogin(res, 'no_owner_room');
      return res.render('owner-dashboard.ejs', { owner: owner_rooms });
    }

    if (types === 'students') {
      const hostelResult = await pool.query('SELECT * FROM owners_room');
      req.session.loggedin = true;
      req.session.email = user.email;
      req.session.firstname = user.firstname;
      req.session.lastname = user.lastname;
      return res.render('student.ejs', {
        owners: hostelResult.rows,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        student_id: user.student_id,
      });
    }
  } catch (err) {
    next(err);
  }
});

router.get('/login', (req, res) => {
  res.sendFile(path.join(htmlDir, 'student_login.html'));
});
router.get('/register', (req, res) => {
  res.sendFile(path.join(htmlDir, 'register.html'));
});

router.get('/dashboard', (req, res) => {
  if (req.session.owner) {
    const o = req.session.owner;
    res.send(`
      <h1>Welcome, ${o.firstname} ${o.lastname}</h1>
      <p>Email: ${o.email}</p>
      <p>Hostel: ${o.hostel}</p>
    `);
  } else {
    res.redirect('/login');
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.sendFile(path.join(htmlDir, 'student_login.html'));
  });
});

module.exports = router;
