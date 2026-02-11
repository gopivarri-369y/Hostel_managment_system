const express = require('express');
const bcrypt = require('bcrypt');
const { pool } = require('../db');
const { requireFields } = require('../middleware/validate');

const router = express.Router();

router.post(
  '/student/register',
  requireFields(['firstname', 'lastname', 'gender', 'age', 'email', 'password', 'phone']),
  async (req, res, next) => {
    try {
      const { firstname, lastname, gender, age, email, password, phone } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);

      const existing = await pool.query(
        'SELECT 1 FROM students WHERE email = $1 OR phone = $2',
        [email, phone]
      );
      if (existing.rows.length > 0) {
        return res.status(409).send('A user with this email or phone already exists.');
      }

      const insertResult = await pool.query(
        `INSERT INTO students (firstname, lastname, gender, age, email, phone, password) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [firstname, lastname, gender, age, email, phone, hashedPassword]
      );

      const hostelResult = await pool.query('SELECT * FROM owners_room');
      const student = insertResult.rows[0];

      req.session.loggedin = true;
      req.session.email = email;
      req.session.firstname = firstname;
      req.session.lastname = lastname;

      res.render('student.ejs', {
        owners: hostelResult.rows,
        email,
        firstname,
        lastname,
        student_id: student.student_id,
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
