require('dotenv').config();
const { Pool } = require('pg');

// Configure your pool (make sure your .env has the required DB variables)
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
    ssl: { rejectUnauthorized: false },  // if required by Render
});

// SQL script to create tables
const createTablesQuery = `
CREATE TABLE IF NOT EXISTS students (
    student_id SERIAL PRIMARY KEY,
    firstname VARCHAR(255) NOT NULL,
    lastname VARCHAR(255) NOT NULL,
    gender VARCHAR(50),
    age INT,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS owners (
    owner_id SERIAL PRIMARY KEY,
    fname VARCHAR(255) NOT NULL,
    lname VARCHAR(255) NOT NULL,
    gender VARCHAR(50),
    age INT,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS owners_room (
    room_id SERIAL PRIMARY KEY,
    college VARCHAR(255),
    hostel_name VARCHAR(255),
    roomsfor INT,
    twoshare INT DEFAULT 0,
    threeshare INT DEFAULT 0,
    fourshare INT DEFAULT 0,
    tworent INT DEFAULT 0,
    threerent INT DEFAULT 0,
    fourrent INT DEFAULT 0,
    pincode VARCHAR(20),
    owner_id INT REFERENCES owners(owner_id)
);
`;

async function initDB() {
    try {
        // Execute the SQL script
        await pool.query(createTablesQuery);
        console.log('Tables created successfully');
    } catch (err) {
        console.error('Error creating tables:', err);
    } finally {
        pool.end();
    }
}

initDB();
