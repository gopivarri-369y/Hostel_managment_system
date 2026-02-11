const express = require('express');
const bcrypt = require('bcrypt');
const { pool, getOwnerWithRoom } = require('../db');
const { requireFields } = require('../middleware/validate');

const router = express.Router();

const ownerRegisterFields = [
  'firstname', 'lastname', 'gender', 'age', 'email', 'password', 'phone',
  'college', 'pincode', 'hostel_name', 'rooms_for',
];

router.get('/update/:owner_id', async (req, res, next) => {
  try {
    const ownerId = req.params.owner_id;
    const [roomResult, ownerResult] = await Promise.all([
      pool.query('SELECT * FROM owners_room WHERE owner_id = $1', [ownerId]),
      pool.query('SELECT * FROM owners WHERE owner_id = $1', [ownerId]),
    ]);

    if (roomResult.rows.length === 0) {
      return res.status(404).send('No room data found for this owner.');
    }
    if (ownerResult.rows.length === 0) {
      return res.status(404).send('No owner data found.');
    }

    res.render('updation.ejs', {
      owners: roomResult.rows[0],
      owner: ownerResult.rows[0],
    });
  } catch (err) {
    next(err);
  }
});

router.patch('/updated/:ownerId', async (req, res, next) => {
  try {
    const owner_id = req.params.ownerId;
    const {
      college,
      hostel_name,
      rooms_for,
      twoshare,
      threeshare,
      fourshare,
      tworent,
      threerent,
      fourrent,
    } = req.body;

    const updateResult = await pool.query(
      `UPDATE owners_room
       SET college = $1, hostel_name = $2, rooms_for = $3,
           twoshare = $4, threeshare = $5, fourshare = $6,
           tworent = $7, threerent = $8, fourrent = $9
       WHERE owner_id = $10`,
      [
        college,
        hostel_name,
        rooms_for,
        twoshare ?? 0,
        threeshare ?? 0,
        fourshare ?? 0,
        tworent ?? 0,
        threerent ?? 0,
        fourrent ?? 0,
        owner_id,
      ]
    );

    if (updateResult.rowCount === 0) {
      return res.status(404).send('No owner found with this ID');
    }

    const owner_rooms = await getOwnerWithRoom(owner_id);
    if (!owner_rooms) {
      return res.status(404).send('No owner room data found');
    }
    return res.render('owner-dashboard.ejs', { owner: owner_rooms });
  } catch (err) {
    next(err);
  }
});

router.post('/login-owner/delete', (_req, res) => {
  res.send('What do you want to delete');
});

router.post(
  '/owner/register',
  requireFields(ownerRegisterFields),
  async (req, res, next) => {
    try {
      const {
        firstname,
        lastname,
        gender,
        age,
        email,
        password,
        phone,
        college,
        pincode,
        hostel_name,
        rooms_for,
        twoshare,
        tworent,
        threeshare,
        threerent,
        fourshare,
        fourrent,
      } = req.body;

      const hashedPassword = await bcrypt.hash(password, 10);

      const existing = await pool.query(
        'SELECT 1 FROM owners WHERE email = $1 OR phone = $2',
        [email, phone]
      );
      if (existing.rows.length > 0) {
        return res.status(409).send('User already exists');
      }

      const maxIdResult = await pool.query('SELECT COALESCE(MAX(owner_id), 0) AS max_id FROM owners');
      const owner_id = maxIdResult.rows[0].max_id + 1;

      await pool.query(
        `INSERT INTO owners (owner_id, firstname, lastname, gender, age, email, phone, password) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [owner_id, firstname, lastname, gender, age, email, phone, hashedPassword]
      );

      await pool.query(
        `INSERT INTO owners_room 
         (college, hostel_name, rooms_for, twoshare, tworent, threeshare, threerent, fourshare, fourrent, pincode, owner_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          college,
          hostel_name,
          rooms_for,
          twoshare || 0,
          tworent || 0,
          threeshare || 0,
          threerent || 0,
          fourshare || 0,
          fourrent || 0,
          pincode,
          owner_id,
        ]
      );

      const owner = await getOwnerWithRoom(owner_id);
      res.render('owner-dashboard.ejs', { owner: owner || req.body });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
