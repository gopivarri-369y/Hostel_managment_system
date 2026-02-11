const { Pool } = require('pg');
const config = require('./config');

const pool = new Pool(config.db);

pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ PostgreSQL connection failed:', err.message);
  } else {
    console.log('✅ Connected to PostgreSQL');
    release();
  }
});

async function getOwnerWithRoom(ownerId) {
  const { rows } = await pool.query(
    `SELECT * FROM owners_room 
     INNER JOIN owners ON owners_room.owner_id = owners.owner_id 
     WHERE owners.owner_id = $1`,
    [ownerId]
  );
  return rows[0] || null;
}

module.exports = { pool, getOwnerWithRoom };
